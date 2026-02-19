import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),

    // Database
    DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/anlp_gsm?schema=public'),

    // External APIs
    API_KEY_OPENAI: z.string().optional(),
    API_KEY_GEMINI: z.string().optional(),
    ESCO_API_URL: z.string().default('https://ec.europa.eu/esco/api'),

    // O*NET
    ONET_API_KEY: z.string().default(''),
    ONET_BASE_URL: z.string().default('https://api-v2.onetcenter.org'),

    // Lightcast
    LIGHTCAST_CLIENT_ID: z.string().default(''),
    LIGHTCAST_CLIENT_SECRET: z.string().default(''),
    LIGHTCAST_AUTH_URL: z.string().default('https://auth.emsicloud.com/connect/token'),
    LIGHTCAST_BASE_URL: z.string().default('https://emsiservices.com/skills/versions/latest'),

    // JWT Auth
    JWT_SECRET: z.string().default('anlp-gsm-dev-secret-key-change-in-production'),
    JWT_EXPIRES_IN: z.string().default('7d'),
});

export const env = envSchema.parse(process.env);
