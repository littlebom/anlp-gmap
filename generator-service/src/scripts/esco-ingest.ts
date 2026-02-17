import 'dotenv/config';
import axios from 'axios';
import { PrismaClient, EscoRelationType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const ESCO_API_BASE = 'https://ec.europa.eu/esco/api';

// Configuration
const CONCURRENCY = 3; // Reduced concurrency to avoid rate limiting
const DELAY_MS = 100;   // Delay between requests
const MAX_RETRIES = 3;

// Skill cache
const skillCache = new Map<string, string>();

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, params: any, retries = MAX_RETRIES): Promise<any> {
    for (let i = 0; i <= retries; i++) {
        try {
            await sleep(DELAY_MS);
            const response = await axios.get(url, { params, timeout: 30000 });
            return response.data;
        } catch (error: any) {
            if (i === retries) throw error;
            const wait = Math.pow(2, i) * 1000;
            logger.warn(`Retrying ${url} (${i + 1}/${retries}) after ${wait}ms due to: ${error.message}`);
            await sleep(wait);
        }
    }
}

async function fetchISCOHierarchy() {
    logger.info('Starting Phase: Ingesting ESCO/ISCO Hierarchy and Occupations...');
    const rootUri = 'http://data.europa.eu/esco/concept-scheme/isco';

    try {
        const data = await fetchWithRetry(`${ESCO_API_BASE}/resource/taxonomy`, { uri: rootUri, language: 'en' });
        const topConcepts = data._links.hasTopConcept || [];

        for (const concept of topConcepts) {
            await processIscoGroup(concept.uri, null);
        }

        logger.info('Hierarchy Ingestion Process Complete.');
    } catch (error) {
        logger.error('Critical error in hierarchy ingestion', error);
    }
}

async function processIscoGroup(uri: string, parentId: string | null) {
    try {
        const data = await fetchWithRetry(`${ESCO_API_BASE}/resource/concept`, { uri, language: 'en' });
        const code = data.code || data.notation || uri.split('/').pop();

        logger.info(`[ISCO] ${code} - ${data.title}`);

        const description = typeof data.description === 'string'
            ? data.description
            : data.description?.en?.literal || data.description?.literal || '';

        const group = await prisma.escoIscoGroup.upsert({
            where: { uri },
            update: {
                code,
                prefLabel: data.title,
                description,
                parentId
            },
            create: {
                uri,
                code,
                prefLabel: data.title,
                description,
                parentId
            }
        });

        // Occupations can be linked to ANY level in some versions, though standard is L4
        const occupations = data._links.narrowerOccupation || [];
        if (occupations.length > 0) {
            logger.info(`Found ${occupations.length} occupations for group ${code}`);
            await processOccupationsInBatches(occupations, group.id);
        }

        // Recurse into children (narrower ISCO groups)
        const children = data._links.narrowerConcept || [];
        for (const child of children) {
            await processIscoGroup(child.uri, group.id);
        }

    } catch (error) {
        logger.error(`Error processing ISCO group ${uri}`, error);
    }
}

async function processOccupationsInBatches(occupations: any[], iscoGroupId: string) {
    for (let i = 0; i < occupations.length; i += CONCURRENCY) {
        const batch = occupations.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(occLink => processOccupation(occLink.uri, iscoGroupId)));
    }
}

async function processOccupation(uri: string, iscoGroupId: string) {
    try {
        // Check if already processed to save time on resume
        const existing = await prisma.escoOccupation.findUnique({
            where: { uri },
            include: { skills: true }
        });

        const data = await fetchWithRetry(`${ESCO_API_BASE}/resource/occupation`, { uri, language: 'en' });

        logger.info(`  [OCC] ${data.title}`);

        const description = typeof data.description === 'string'
            ? data.description
            : data.description?.en?.literal || data.description?.literal || '';

        const occupation = await prisma.escoOccupation.upsert({
            where: { uri },
            update: {
                prefLabel: data.title,
                description,
                iscoGroupId
            },
            create: {
                uri,
                prefLabel: data.title,
                description,
                iscoGroupId
            }
        });

        // Always check skills, but skip if already has many (simple optimization)
        if (!existing || existing.skills.length < 5) {
            await processOccupationSkills(data, occupation.id);
        }

        // Check for narrower occupations (Occupation Hierarchy)
        const narrower = data._links.narrowerOccupation || [];
        if (narrower.length > 0) {
            logger.info(`    Found ${narrower.length} sub-occupations for ${data.title}`);
            await processOccupationsInBatches(narrower, iscoGroupId);
        }

    } catch (error) {
        logger.error(`Error processing occupation ${uri}`, error);
    }
}

async function processOccupationSkills(occData: any, occupationId: string) {
    const essentialSkills = occData._links.hasEssentialSkill || [];
    const optionalSkills = occData._links.hasOptionalSkill || [];

    // Process in smaller batches
    for (let i = 0; i < essentialSkills.length; i += CONCURRENCY) {
        const batch = essentialSkills.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((s: any) => processSkill(s.uri, occupationId, EscoRelationType.ESSENTIAL)));
    }
    for (let i = 0; i < optionalSkills.length; i += CONCURRENCY) {
        const batch = optionalSkills.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((s: any) => processSkill(s.uri, occupationId, EscoRelationType.OPTIONAL)));
    }
}

async function processSkill(uri: string, occupationId: string, type: EscoRelationType) {
    try {
        let skillId = skillCache.get(uri);

        if (!skillId) {
            const skill = await prisma.escoSkill.findUnique({ where: { uri } });
            if (skill) {
                skillId = skill.id;
            } else {
                const data = await fetchWithRetry(`${ESCO_API_BASE}/resource/skill`, { uri, language: 'en' });
                const description = typeof data.description === 'string'
                    ? data.description
                    : data.description?.en?.literal || data.description?.literal || '';

                const newSkill = await prisma.escoSkill.create({
                    data: {
                        uri,
                        skillType: data.skillType || 'skill',
                        prefLabel: data.title,
                        description
                    }
                });
                skillId = newSkill.id;
            }
            skillCache.set(uri, skillId);
        }

        await prisma.escoOccupationSkill.upsert({
            where: {
                occupationId_skillId: {
                    occupationId,
                    skillId: skillId!
                }
            },
            update: { relationType: type },
            create: {
                occupationId,
                skillId: skillId!,
                relationType: type
            }
        });

    } catch (error) {
        // Log error but don't stop
    }
}

async function main() {
    logger.info('--- ESCO Ingestion Script (Resilient Version) ---');
    await fetchISCOHierarchy();
    logger.info('--- Full ESCO Ingestion Complete! ---');
    await prisma.$disconnect();
}

main().catch(async (e) => {
    logger.error('Critical ingestion error', e);
    await prisma.$disconnect();
    process.exit(1);
});
