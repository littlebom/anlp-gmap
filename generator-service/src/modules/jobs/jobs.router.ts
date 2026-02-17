import { Router, Request, Response } from 'express';
import { queueService } from '../queue/queue.service';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

const createJobSchema = z.object({
    jobTitle: z.string().min(1),
    maxNodes: z.number().int().min(1).max(50).default(20),
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = createJobSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.message });
            return;
        }

        const { jobTitle, maxNodes } = validation.data;

        const job = await queueService.addJob('generate-graph', {
            jobTitle,
            maxNodes,
        });

        res.status(202).json({
            message: 'Job submitted successfully',
            jobId: job.id,
            jobTitle,
        });
    } catch (error) {
        logger.error('Error submitting job', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const job = await queueService.getJob(jobId);

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        res.json({
            jobId,
            state,
            progress,
            result,
            failedReason
        });
    } catch (error) {
        logger.error('Error fetching job status', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const jobsRouter = router;
