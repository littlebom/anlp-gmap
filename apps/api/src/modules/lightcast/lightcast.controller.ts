import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LightcastService } from './lightcast.service';

@Controller('lightcast')
@UseGuards(AuthGuard('jwt'))
export class LightcastController {
  constructor(private readonly lightcastService: LightcastService) {}

  @Get('test')
  async testConnection() {
    const connected = await this.lightcastService.testConnection();
    return { connected };
  }

  @Get('skills')
  async extractSkills(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'hard' | 'soft' | 'all',
  ) {
    if (!keyword) return { data: [] };
    return {
      data: await this.lightcastService.extractSkillsByType(
        keyword,
        type || 'all',
        limit ? parseInt(limit) : 10,
      ),
    };
  }
}
