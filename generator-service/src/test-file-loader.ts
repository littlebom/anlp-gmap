import { fileLoaderService } from './modules/file-loader/file-loader.service';
import { logger } from './utils/logger';
import fs from 'fs';
import path from 'path';

async function runTest() {
    const samplePdfPath = path.join(__dirname, '../sample.pdf');

    // Create a dummy PDF if not exists (This is just for testing structure, 
    // in real scenario we need a real PDF. For now, we will just test text parsing 
    // or skip PDF if file missing)

    logger.info('Testing Text Parsing...');
    const textBuffer = Buffer.from('Hello, this is a sample text content for ANLP.');
    const textResult = await fileLoaderService.parseText(textBuffer);
    logger.info(`Text Result: ${textResult}`);

    // Test PDF - we need a real PDF buffer. 
    // We will create a dummy file just to see if the service accepts buffer, 
    // but pdf-parse might fail on invalid pdf.
    // So we only test if we have a file.
    if (fs.existsSync(samplePdfPath)) {
        const pdfBuffer = fs.readFileSync(samplePdfPath);
        const pdfResult = await fileLoaderService.parsePdf(pdfBuffer);
        logger.info(`PDF Result length: ${pdfResult.length}`);
    } else {
        logger.warn('Skipping PDF test: No sample.pdf found in root.');
    }

}

runTest().catch(console.error);
