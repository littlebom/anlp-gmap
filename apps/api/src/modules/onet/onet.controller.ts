import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnetService } from './onet.service';

@Controller('onet')
@UseGuards(AuthGuard('jwt'))
export class OnetController {
  constructor(private readonly onetService: OnetService) {}

  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: string,
  ) {
    if (!keyword) return { data: [] };
    return {
      data: await this.onetService.searchCareers(keyword, limit ? parseInt(limit) : 5),
    };
  }

  @Get('test')
  async testConnection() {
    const connected = await this.onetService.testConnection();
    return { connected };
  }

  @Get('careers/:socCode')
  async getFullOccupation(@Param('socCode') socCode: string) {
    return this.onetService.getFullOccupation(socCode);
  }

  @Get('careers/:socCode/tasks')
  async getTasks(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getTasks(socCode) };
  }

  @Get('careers/:socCode/skills')
  async getSkills(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getSkills(socCode) };
  }

  @Get('careers/:socCode/knowledge')
  async getKnowledge(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getKnowledge(socCode) };
  }

  @Get('careers/:socCode/abilities')
  async getAbilities(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getAbilities(socCode) };
  }

  @Get('careers/:socCode/technology')
  async getTechnology(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getTechnology(socCode) };
  }

  @Get('careers/:socCode/work-activities')
  async getWorkActivities(@Param('socCode') socCode: string) {
    return { data: await this.onetService.getWorkActivities(socCode) };
  }
}
