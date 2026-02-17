import { Queue, Job } from 'bullmq';
import { redisConfig } from '../../config/redis.config';
import { logger } from '../../utils/logger';

export const JOB_QUEUE_NAME = 'generator-queue';

class QueueService {
    private queue: Queue;

    constructor() {
        this.queue = new Queue(JOB_QUEUE_NAME, {
            connection: redisConfig.connection,
        });
        logger.info(`Queue ${JOB_QUEUE_NAME} initialized`);
    }

    async addJob(jobType: string, data: any) {
        try {
            const job = await this.queue.add(jobType, data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            });
            logger.info(`Job added to queue: ${job.id}`);
            return job;
        } catch (error) {
            logger.error('Failed to add job to queue', error);
            throw error;
        }
    }

    async getJob(jobId: string): Promise<Job | undefined> {
        try {
            return await this.queue.getJob(jobId);
        } catch (error) {
            logger.error(`Failed to get job ${jobId}`, error);
            return undefined;
        }
    }
}

export const queueService = new QueueService();
