import { env } from './env.config';

export const redisConnection = {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
};
