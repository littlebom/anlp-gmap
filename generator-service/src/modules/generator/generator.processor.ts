import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis.config';
import { logger } from '../../utils/logger';
import { escoService } from '../esco/esco.service';
import { onetService } from '../onet/onet.service';
import { lightcastService } from '../lightcast/lightcast.service';
import { architectService } from '../architect/architect.service';
import { IGraphResult } from '../architect/architect.types';

export const QUEUE_NAME = 'generator-queue';

export class GeneratorProcessor {
    private worker: Worker;

    constructor() {
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: redisConnection,
            concurrency: 5, // Process 5 jobs in parallel
        });

        this.worker.on('completed', (job: Job) => {
            logger.info(`Job ${job.id} completed!`);
        });

        this.worker.on('failed', (job: Job | undefined, err: Error) => {
            logger.error(`Job ${job?.id} failed`, err);
        });

        logger.info(`Generator Processor started on queue: ${QUEUE_NAME}`);
    }

    async processJob(job: Job): Promise<IGraphResult> {
        const { jobTitle, files } = job.data;
        logger.info(`Processing Job ${job.id}: Generating Graph for "${jobTitle}"`);

        try {
            // 1. Research (Adapters)
            const skills: string[] = [];

            // ESCO
            try {
                logger.info('Fetching from ESCO...');
                const escoOccupation = await escoService.searchOccupation(jobTitle);
                if (escoOccupation && escoOccupation.length > 0) {
                    const topOccupation = escoOccupation[0];
                    const escoDetails = await escoService.getOccupationDetails(topOccupation.uri);

                    if (escoDetails) {
                        const escoSkills = await escoService.getSkills(escoDetails.uri);
                        skills.push(...escoSkills.map(s => s.title));
                        logger.info(`ESCO provided ${escoSkills.length} skills`);
                    }
                }
            } catch (e) {
                logger.error('ESCO Adapter failed', e);
            }

            // O*NET (Skipped by default due to Auth issues, but left as optional)
            try {
                if (process.env.ONET_USERNAME) { // Only try if creds exist
                    logger.info('Fetching from O*NET...');
                    const onetResults = await onetService.searchCareers(jobTitle);
                    if (onetResults.length > 0) {
                        logger.info(`O*NET found ${onetResults.length} careers (using top 1)`);
                        // TODO: Implement O*NET details fetching
                    }
                } else {
                    logger.info('Skipping O*NET (No Credentials)');
                }
            } catch (e) {
                logger.warn('O*NET Adapter skipped/failed (Non-critical)', e);
            }

            // Lightcast
            try {
                logger.info('Fetching from Lightcast...');
                const lightcastSkills = await lightcastService.extractSkills(jobTitle);
                const skillNames = lightcastSkills.map(s => s.name);
                skills.push(...skillNames);
                logger.info(`Lightcast provided ${skillNames.length} skills`);
            } catch (e) {
                logger.error('Lightcast Adapter failed', e);
            }

            // File Loader (Context)
            // if (files) { ... }

            if (skills.length === 0) {
                // Fallback if adapters return nothing (e.g. strict search)
                // Seed with basic skills to ensure Architect has something to work with
                logger.warn("No skills found from adapters. Using job title as seed.");
                skills.push(jobTitle);
            }

            // 2. Architect (Synthesis)
            const graph = await architectService.synthesizeGraph(jobTitle, skills);

            // 3. Save/Output
            // For now, valid JSON log
            console.log("FINAL_GRAPH::" + JSON.stringify(graph));

            return graph;

        } catch (error) {
            logger.error('Error processing job', error);
            throw error;
        }
    }
}

export const generatorProcessor = new GeneratorProcessor();
