import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { JwtPayload } from './auth.types';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * JWT Authentication Middleware
 * ตรวจสอบ Authorization: Bearer <token> จาก header
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = authService.verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
        return;
    }
}

/**
 * Admin-only Middleware
 * ต้องเป็น admin เท่านั้นถึงจะเข้าถึงได้
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied. Admin only.' });
        return;
    }
    next();
}
