import { generatorProcessor } from './modules/generator/generator.processor';
import { logger } from './utils/logger';
import { Job } from 'bullmq';

async function runFlowTest() {
    const jobTitle = "Data Scientist";
    logger.info(`Starting End-to-End Generator Flow Test for: ${jobTitle}`);

    // Mock Job object
    const mockJob = {
        id: 'test-job-123',
        data: {
            jobTitle: jobTitle
        },
        updateProgress: async (progress: any) => { logger.info(`Job Progress: ${progress}%`); },
        log: async (msg: string) => { logger.info(`Job Log: ${msg}`); }
    } as unknown as Job;

    try {
        logger.info("--- Triggering Processor ---");
        const graph = await generatorProcessor.processJob(mockJob);

        logger.info("--- Result ---");
        logger.info(`Generated ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);

        // Validation
        const hasTools = graph.nodes.some(n => n.category === 'Tool' || n.category === 'Technology');
        const hasLevels = graph.nodes.every(n => n.sfia_level !== undefined);

        if (hasTools) logger.info("✅ Tools/Tech inferred successfully");
        else logger.warn("⚠️ No tools/tech found in graph");

        if (hasLevels) logger.info("✅ SFIA Levels assigned");
        else logger.error("❌ Validated Failed: Missing SFIA Levels");

        console.log(JSON.stringify(graph, null, 2));

    } catch (error) {
        logger.error("Flow Test Failed", error);
    }
}

runFlowTest().catch(console.error);
