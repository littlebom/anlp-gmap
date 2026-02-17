import fs from 'fs';
const pdf = require('pdf-parse');
import { logger } from '../../utils/logger';

export class FileLoaderService {

    async parsePdf(buffer: Buffer): Promise<string> {
        try {
            logger.info('Parsing PDF file...');
            const data = await pdf(buffer);
            return data.text;
        } catch (error) {
            logger.error('Error parsing PDF', error);
            throw new Error('Failed to parse PDF file');
        }
    }

    async parseText(buffer: Buffer): Promise<string> {
        try {
            logger.info('Parsing Text file...');
            return buffer.toString('utf-8');
        } catch (error) {
            logger.error('Error parsing Text file', error);
            throw new Error('Failed to parse Text file');
        }
    }
}

export const fileLoaderService = new FileLoaderService();
