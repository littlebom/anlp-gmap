import { generatorProcessor } from './modules/generator/generator.processor';
import { logger } from './utils/logger';

// Mock Job object
const mockJob: any = {
    id: 'test-job-1',
    data: {
        jobTitle: 'Software Engineer'
    }
};

async function runIntegrationTest() {
    logger.info("Starting Integration Test...");
    try {
        const result = await generatorProcessor.processJob(mockJob);
        logger.info("Integration Test Success!");
        logger.info(`Nodes: ${result.nodes.length}, Edges: ${result.edges.length}`);
    } catch (error) {
        logger.error("Integration Test Failed", error);
    }
    process.exit(0);
}

runIntegrationTest();
