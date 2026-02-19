import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class EscoService {
  constructor(private prisma: PrismaService) {}

  async getGroups(parentId?: string, level?: number) {
    const where: any = {};
    if (parentId) where.parentId = parentId;
    if (level !== undefined) {
      where.code = { startsWith: level === 1 ? '' : undefined };
    }
    if (parentId === undefined && level === undefined) {
      where.parentId = null; // top-level groups
    }

    return this.prisma.escoIscoGroup.findMany({
      where,
      include: {
        _count: { select: { occupations: true, children: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getOccupations(iscoGroupId?: string, page = 1, limit = 50) {
    const where: any = {};
    if (iscoGroupId) where.iscoGroupId = iscoGroupId;

    const [occupations, total] = await Promise.all([
      this.prisma.escoOccupation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          iscoGroup: { select: { code: true, prefLabel: true } },
          _count: { select: { skills: true } },
        },
        orderBy: { prefLabel: 'asc' },
      }),
      this.prisma.escoOccupation.count({ where }),
    ]);

    return {
      data: occupations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOccupationNetwork(id: string) {
    const occupation = await this.prisma.escoOccupation.findUnique({
      where: { id },
      include: {
        iscoGroup: true,
        skills: {
          include: { skill: true },
          orderBy: { relationType: 'asc' },
        },
      },
    });

    return occupation;
  }

  async getStats() {
    const [groups, occupations, skills, links] = await Promise.all([
      this.prisma.escoIscoGroup.count(),
      this.prisma.escoOccupation.count(),
      this.prisma.escoSkill.count(),
      this.prisma.escoOccupationSkill.count(),
    ]);

    return { groups, occupations, skills, links };
  }
}
