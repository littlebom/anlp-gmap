import { Router, Request, Response } from 'express';
import { authService } from './auth.service';
import { authMiddleware } from './auth.middleware';
import { logger } from '../../utils/logger';

export class AuthController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/register', this.register.bind(this));
        this.router.post('/login', this.login.bind(this));
        this.router.get('/me', authMiddleware, this.getMe.bind(this));
    }

    /**
     * POST /auth/register
     * Body: { name, email, password }
     */
    private async register(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, password } = req.body;

            // Validate input
            if (!name || !email || !password) {
                res.status(400).json({ error: 'name, email, and password are required' });
                return;
            }

            if (password.length < 6) {
                res.status(400).json({ error: 'Password must be at least 6 characters' });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ error: 'Invalid email format' });
                return;
            }

            const user = await authService.register({ name, email, password });
            res.status(201).json({
                message: 'User registered successfully',
                user,
            });
        } catch (error: any) {
            if (error.message === 'Email already registered') {
                res.status(409).json({ error: error.message });
                return;
            }
            logger.error('Registration error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /auth/login
     * Body: { email, password }
     * Response: { token, user }
     */
    private async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: 'email and password are required' });
                return;
            }

            const result = await authService.login({ email, password });
            res.json(result);
        } catch (error: any) {
            if (error.message === 'Invalid email or password') {
                res.status(401).json({ error: error.message });
                return;
            }
            logger.error('Login error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /auth/me
     * Header: Authorization: Bearer <token>
     * Response: { user }
     */
    private async getMe(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const user = authService.getUserById(req.user.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ user });
        } catch (error) {
            logger.error('Get me error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export const authController = new AuthController();
