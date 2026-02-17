import { escoService } from './modules/esco/esco.service';
import { logger } from './utils/logger';

async function runTest() {
    const keyword = 'Software Developer';
    logger.info(`Testing ESCO Search for "${keyword}"...`);

    const results = await escoService.searchOccupation(keyword);

    if (results.length === 0) {
        logger.error('No results found.');
        return;
    }

    logger.info(`Found ${results.length} occupations. Taking the first one.`);
    const topResult = results[0];
    logger.info(`Top Result: ${topResult.title} (${topResult.uri})`);

    logger.info('Fetching Skills...');
    const skills = await escoService.getSkills(topResult.uri);

    logger.info(`Found ${skills.length} skills.`);
    console.log('--- Essential Skills ---');
    skills.filter(s => s.type === 'essential').slice(0, 5).forEach(s => console.log(`- ${s.title}`));

    console.log('--- Optional Skills (Top 5) ---');
    skills.filter(s => s.type === 'optional').slice(0, 5).forEach(s => console.log(`- ${s.title}`));
}

runTest().catch(console.error);
