import { PrismaClient, Role } from '@prisma/client';
import { User } from './auth.types';
import { logger } from '../../utils/logger';
import { env } from '../../config/env.config';

export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: env.DATABASE_URL
        }
    }
});

/**
 * Prisma-based User Store
 * ใช้ PostgreSQL ผ่าน Prisma ORM — ทดแทน JSON file store เดิม
 * Interface เดิมไม่เปลี่ยน เปลี่ยนแค่ implementation
 */
export class PrismaUserStore {
    async findByEmail(email: string): Promise<User | undefined> {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        return user ? this.toUser(user) : undefined;
    }

    async findById(id: string): Promise<User | undefined> {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user ? this.toUser(user) : undefined;
    }

    async create(user: User): Promise<User> {
        const created = await prisma.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email.toLowerCase(),
                passwordHash: user.passwordHash,
                role: user.role.toUpperCase() as Role,
            },
        });
        logger.info(`[Prisma] Created user: ${created.email}`);
        return this.toUser(created);
    }

    async getAll(): Promise<User[]> {
        const users = await prisma.user.findMany();
        return users.map(u => this.toUser(u));
    }

    private toUser(dbUser: any): User {
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            role: dbUser.role.toLowerCase() as 'learner' | 'admin' | 'curator',
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString(),
        };
    }
}

export const prismaUserStore = new PrismaUserStore();
