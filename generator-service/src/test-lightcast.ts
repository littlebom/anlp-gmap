import { lightcastService } from './modules/lightcast/lightcast.service';
import { logger } from './utils/logger';
import { env } from './config/env.config';

async function runTest() {
    if (!env.LIGHTCAST_CLIENT_ID || !env.LIGHTCAST_CLIENT_SECRET) {
        logger.warn('Skipping Lightcast Test: Credentials missing in .env');
        return;
    }

    const keyword = 'Python';
    logger.info(`Testing Lightcast Skill Search for "${keyword}"...`);

    const skills = await lightcastService.extractSkills(keyword);

    if (skills.length === 0) {
        logger.warn('No skills found (or auth failed).');
        return;
    }

    logger.info(`Found ${skills.length} skills.`);
    skills.forEach(s => console.log(`- ${s.name} (ID: ${s.id}, Type: ${s.type})`));
}

runTest().catch(console.error);
