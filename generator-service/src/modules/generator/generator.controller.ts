import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis.config';
import { QUEUE_NAME } from './generator.processor';
import { logger } from '../../utils/logger';
import { escoService } from '../esco/esco.service';
import { onetService } from '../onet/onet.service';
import { lightcastService } from '../lightcast/lightcast.service';
import { prisma } from '../../config/prisma-client';

export class GeneratorController {
    public router: Router;
    private queue: Queue;

    constructor() {
        this.router = Router();
        this.queue = new Queue(QUEUE_NAME, { connection: redisConnection });
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/generate', this.createJob.bind(this));
        this.router.get('/jobs/:id', this.getJobStatus.bind(this));
        this.router.post('/test-connection', this.testConnection.bind(this));
    }

    private async testConnection(req: Request, res: Response) {
        try {
            const { service, credentials } = req.body;
            let success = false;

            logger.info(`Testing connection for service: ${service}`);

            switch (service) {
                case 'esco':
                    success = await escoService.testConnection(); // ESCO usually doesn't need custom keys for the public API we're using
                    break;
                case 'onet':
                    success = await onetService.testConnection(credentials?.apiKey);
                    break;
                case 'lightcast':
                    success = await lightcastService.testConnection(credentials?.clientId, credentials?.clientSecret);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid service' });
            }

            return res.json({ success });
        } catch (error) {
            logger.error('Error in testConnection controller', error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    }

    private async getJobStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                return res.status(400).json({ error: 'Invalid Job ID' });
            }
            const job = await this.queue.getJob(id);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const state = await job.getState();
            const result = job.returnvalue;
            const error = job.failedReason;

            return res.json({
                id: job.id,
                state,
                result,
                error
            });

        } catch (error) {
            logger.error('Error fetching job status', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    private async createJob(req: Request, res: Response) {
        try {
            const { jobTitle } = req.body;

            if (!jobTitle) {
                return res.status(400).json({ error: 'jobTitle is required' });
            }

            logger.info(`Received request to generate graph for: ${jobTitle}`);

            const job = await this.queue.add('generate-graph', {
                jobTitle,
                timestamp: new Date()
            });

            return res.status(202).json({
                message: 'Job submitted successfully',
                jobId: job.id,
                statusUrl: `/jobs/${job.id}` // Stub for future status endpoint
            });

        } catch (error) {
            logger.error('Error creating job', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export const generatorController = new GeneratorController();
