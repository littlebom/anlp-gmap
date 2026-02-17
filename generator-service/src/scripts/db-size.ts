
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        const result: any[] = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size('anlp_gsm')) as size;`;
        console.log(`Database Size: ${result[0].size}`);
    } catch (error) {
        console.error('Error querying database size:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
