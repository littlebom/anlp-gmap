import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    } as any);
    console.log('PrismaClient initialized successfully');
    prisma.$connect()
        .then(() => {
            console.log('Connected to DB');
            process.exit(0);
        })
        .catch(err => {
            console.error('Connection failed:', err);
            process.exit(1);
        });
} catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
}
