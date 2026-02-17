import fs from 'fs';
import path from 'path';
import { User } from './auth.types';
import { logger } from '../../utils/logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * JSON File-based User Store
 * เก็บข้อมูล user ลงไฟล์ JSON — สำหรับ Phase 1 (POC)
 * จะ migrate เป็น PostgreSQL + Prisma ใน Phase 2
 */
export class UserStore {
    private users: User[] = [];

    constructor() {
        this.ensureDataDir();
        this.load();
    }

    private ensureDataDir(): void {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            logger.info(`Created data directory: ${DATA_DIR}`);
        }
    }

    private load(): void {
        try {
            if (fs.existsSync(USERS_FILE)) {
                const data = fs.readFileSync(USERS_FILE, 'utf-8');
                this.users = JSON.parse(data);
                logger.info(`Loaded ${this.users.length} users from store`);
            } else {
                this.users = [];
                this.save();
                logger.info('Initialized empty user store');
            }
        } catch (error) {
            logger.error('Failed to load user store', error);
            this.users = [];
        }
    }

    private save(): void {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
        } catch (error) {
            logger.error('Failed to save user store', error);
        }
    }

    findByEmail(email: string): User | undefined {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    findById(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }

    create(user: User): User {
        this.users.push(user);
        this.save();
        logger.info(`Created user: ${user.email}`);
        return user;
    }

    getAll(): User[] {
        return [...this.users];
    }
}

export const userStore = new UserStore();
