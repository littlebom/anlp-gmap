import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma-client';
import { logger } from '../../utils/logger';

export class EscoController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/groups', this.getGroups.bind(this));
        this.router.get('/occupations', this.getOccupations.bind(this));
        this.router.get('/occupations/:id/network', this.getOccupationNetwork.bind(this));
        this.router.get('/stats', this.getStats.bind(this));
    }

    private async getGroups(req: Request, res: Response) {
        try {
            const { parentId, level } = req.query;

            const where: any = {};
            if (parentId) {
                where.parentId = parentId as string;
            } else if (level) {
                // If level is provided, we might need a more complex query or specific logic
                // For now, if no parentId and level=1, fetch root groups
                if (level === '1') {
                    where.parentId = null;
                }
            }

            const groups = await prisma.escoIscoGroup.findMany({
                where,
                include: {
                    _count: {
                        select: { occupations: true }
                    }
                },
                orderBy: { code: 'asc' }
            });

            return res.json(groups);
        } catch (error) {
            logger.error('Error fetching ESCO groups', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    private async getOccupations(req: Request, res: Response) {
        try {
            const { iscoGroupId, page = 1, limit = 50 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const where: any = {};
            if (iscoGroupId) {
                // Fetch the target group to get its code
                const targetGroup = await prisma.escoIscoGroup.findUnique({
                    where: { id: iscoGroupId as string }
                });

                if (targetGroup) {
                    // Find all occupations where the ISCO group's code starts with targetGroup.code
                    where.iscoGroup = {
                        code: { startsWith: targetGroup.code }
                    };
                } else {
                    where.iscoGroupId = iscoGroupId as string;
                }
            }

            const [occupations, total] = await Promise.all([
                prisma.escoOccupation.findMany({
                    where,
                    skip,
                    take,
                    include: {
                        _count: {
                            select: { skills: true }
                        }
                    }
                }),
                prisma.escoOccupation.count({ where })
            ]);

            return res.json({
                data: occupations,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / take)
                }
            });
        } catch (error) {
            logger.error('Error fetching ESCO occupations', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    private async getOccupationNetwork(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            // 1. Fetch primary occupation
            const occupation = await prisma.escoOccupation.findUnique({
                where: { id },
                include: {
                    skills: {
                        include: {
                            skill: true
                        }
                    }
                }
            }) as any;

            if (!occupation) {
                return res.status(404).json({ error: 'Occupation not found' });
            }

            const nodes: any[] = [
                { id: occupation.id, label: occupation.prefLabel, type: 'occupation', color: '#38bdf8' }
            ];
            const links: any[] = [];
            const skillIds = new Set<string>();
            const neighborIds = new Set<string>();

            // 2. Fetch neighbors for each skill (up to 3 per skill)
            for (const occSkill of occupation.skills) {
                const skill = occSkill.skill;
                if (!skillIds.has(skill.id)) {
                    nodes.push({ id: skill.id, label: skill.prefLabel, type: 'skill', color: '#818cf8' });
                    skillIds.add(skill.id);
                }

                links.push({ source: occupation.id, target: skill.id, type: occSkill.relationType });

                // Find other occupations sharing this skill
                const neighbors = await prisma.escoOccupationSkill.findMany({
                    where: {
                        skillId: skill.id,
                        occupationId: { not: occupation.id }
                    },
                    take: 3,
                    include: {
                        occupation: true
                    }
                });

                for (const neighbor of neighbors) {
                    if (!neighborIds.has(neighbor.occupation.id)) {
                        nodes.push({
                            id: neighbor.occupation.id,
                            label: neighbor.occupation.prefLabel,
                            type: 'neighbor',
                            color: '#2dd4bf'
                        });
                        neighborIds.add(neighbor.occupation.id);
                    }
                    links.push({ source: skill.id, target: neighbor.occupation.id, type: neighbor.relationType });
                }
            }

            return res.json({ nodes, links });
        } catch (error) {
            logger.error('Error fetching occupation network', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    private async getStats(req: Request, res: Response) {
        try {
            const [iscoGroups, occupations, skills, relations] = await Promise.all([
                prisma.escoIscoGroup.count(),
                prisma.escoOccupation.count(),
                prisma.escoSkill.count(),
                prisma.escoOccupationSkill.count()
            ]);

            return res.json({
                iscoGroups,
                occupations,
                skills,
                relations
            });
        } catch (error) {
            logger.error('Error in getStats controller', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export const escoController = new EscoController();
