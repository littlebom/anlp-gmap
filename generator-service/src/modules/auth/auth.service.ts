import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.config';
import { logger } from '../../utils/logger';
import { userStore } from './auth.store';
import {
    RegisterDTO,
    LoginDTO,
    AuthResponse,
    SafeUser,
    JwtPayload,
    User,
} from './auth.types';

const SALT_ROUNDS = 10;

export class AuthService {
    /**
     * สมัครสมาชิก
     */
    async register(dto: RegisterDTO): Promise<SafeUser> {
        // ตรวจสอบ email ซ้ำ
        const existing = userStore.findByEmail(dto.email);
        if (existing) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const now = new Date().toISOString();
        const user: User = {
            id: uuidv4(),
            name: dto.name,
            email: dto.email.toLowerCase(),
            passwordHash,
            role: 'learner',
            createdAt: now,
            updatedAt: now,
        };

        userStore.create(user);
        logger.info(`User registered: ${user.email}`);

        return this.toSafeUser(user);
    }

    /**
     * เข้าสู่ระบบ
     */
    async login(dto: LoginDTO): Promise<AuthResponse> {
        const user = userStore.findByEmail(dto.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        // สร้าง JWT token
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        } as jwt.SignOptions);

        logger.info(`User logged in: ${user.email}`);
        return { token, user: this.toSafeUser(user) };
    }

    /**
     * ตรวจสอบ token
     */
    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        } catch {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * ดึงข้อมูล user จาก ID
     */
    getUserById(id: string): SafeUser | null {
        const user = userStore.findById(id);
        if (!user) return null;
        return this.toSafeUser(user);
    }

    /**
     * ลบ passwordHash ก่อนส่งกลับ client
     */
    private toSafeUser(user: User): SafeUser {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }
}

export const authService = new AuthService();
