import { onetService } from './modules/onet/onet.service';
import { logger } from './utils/logger';
import { env } from './config/env.config';

async function runTest() {
    if (!env.ONET_USERNAME || !env.ONET_PASSWORD) {
        logger.warn('Skipping O*NET Test: Credentials missing in .env');
        return;
    }

    const keyword = 'Software Developer';
    logger.info(`Testing O*NET Search for "${keyword}"...`);

    const results = await onetService.searchCareers(keyword);

    if (results.length === 0) {
        logger.error('No results found (or auth failed).');
        return;
    }

    logger.info(`Found ${results.length} careers. Taking the first one.`);
    const topResult = results[0];
    logger.info(`Top Result: ${topResult.title} (SOC: ${topResult.code})`);

    logger.info('Fetching Tools & Tech...');
    const { technology } = await onetService.getToolsAndTechnology(topResult.code);
    console.log('--- Technology (Top 5) ---');
    technology.slice(0, 5).forEach(t => console.log(`- ${t.name}`));

    logger.info('Fetching Tasks...');
    const tasks = await onetService.getTasks(topResult.code);
    console.log('--- Tasks (Top 5) ---');
    tasks.slice(0, 5).forEach(t => console.log(`- ${t.name}`));
}

runTest().catch(console.error);
