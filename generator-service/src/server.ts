import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { generatorController } from './modules/generator/generator.controller';
import { authController } from './modules/auth/auth.controller';
import { escoController } from './modules/esco/esco.controller';
import './modules/generator/generator.processor'; // Start the worker

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve mockups as static files
app.use('/mockups', express.static(path.join(process.cwd(), '..', 'mockups')));

// Routes
app.use('/auth', authController.router);
app.use('/esco', escoController.router);
app.use('/', generatorController.router);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
const server = app.listen(env.PORT, () => {
    logger.info(`Generator Service running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
    });
});
