import 'dotenv/config';
import axios from 'axios';
import { PrismaClient, EscoRelationType } from '@prisma/client';

const prisma = new PrismaClient();
const ESCO_API_BASE = 'https://ec.europa.eu/esco/api';

async function processSkill(uri: string, occupationId: string, type: EscoRelationType) {
    try {
        let skill = await prisma.escoSkill.findUnique({ where: { uri } });
        if (!skill) {
            const response = await axios.get(`${ESCO_API_BASE}/resource/skill`, {
                params: { uri, language: 'en' }
            });
            const data = response.data;
            const description = typeof data.description === 'string'
                ? data.description
                : data.description?.en?.literal || data.description?.literal || '';

            skill = await prisma.escoSkill.create({
                data: {
                    uri,
                    skillType: data.skillType || 'skill',
                    prefLabel: data.title,
                    description
                }
            });
            console.log(`  [SKILL] Created: ${data.title}`);
        }

        await prisma.escoOccupationSkill.upsert({
            where: {
                occupationId_skillId: {
                    occupationId,
                    skillId: skill.id
                }
            },
            update: { relationType: type },
            create: {
                occupationId,
                skillId: skill.id,
                relationType: type
            }
        });
    } catch (error) {
        console.error(`Error processing skill ${uri}`, error);
    }
}

async function processOccupation(uri: string, iscoGroupId: string) {
    console.log(`[OCCUPATION] Starting: ${uri}`);
    try {
        const response = await axios.get(`${ESCO_API_BASE}/resource/occupation`, {
            params: { uri, language: 'en' }
        });

        const data = response.data;
        console.log(`[OCCUPATION] Processing: ${data.title}`);

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

        const essentialSkills = data._links.hasEssentialSkill || [];
        const optionalSkills = data._links.hasOptionalSkill || [];
        console.log(`[OCCUPATION] ${data.title} has ${essentialSkills.length} essential and ${optionalSkills.length} optional skills`);

        for (const skillLink of essentialSkills) {
            await processSkill(skillLink.uri, occupation.id, EscoRelationType.ESSENTIAL);
        }

        for (const skillLink of optionalSkills) {
            await processSkill(skillLink.uri, occupation.id, EscoRelationType.OPTIONAL);
        }
    } catch (error) {
        console.error(`Error processing occupation ${uri}`, error);
    }
}

async function test() {
    const iscoUri = 'http://data.europa.eu/esco/isco/C2511';
    console.log(`Testing ISCO Unit Group: ${iscoUri}`);

    const group = await prisma.escoIscoGroup.findUnique({ where: { uri: iscoUri } });
    if (!group) {
        console.log('Group C2511 not found in DB. Creating it...');
        // Create it just for testing
        const response = await axios.get(`${ESCO_API_BASE}/resource/concept`, {
            params: { uri: iscoUri, language: 'en' }
        });
        const data = response.data;
        const newGroup = await prisma.escoIscoGroup.create({
            data: {
                uri: iscoUri,
                code: data.code || '2511',
                prefLabel: data.title,
                description: data.description?.en?.literal || ''
            }
        });
        await runTest(iscoUri, newGroup.id);
    } else {
        await runTest(iscoUri, group.id);
    }

    await prisma.$disconnect();
}

async function runTest(iscoUri: string, id: string) {
    const response = await axios.get(`${ESCO_API_BASE}/resource/concept`, {
        params: { uri: iscoUri, language: 'en' }
    });
    const occupations = response.data._links.narrowerOccupation || [];
    console.log(`Found ${occupations.length} occupations for ISCO ${iscoUri}`);

    // Process only first 2 occupations for quick test
    for (let i = 0; i < Math.min(occupations.length, 2); i++) {
        await processOccupation(occupations[i].uri, id);
    }
}

test().catch(console.error);
