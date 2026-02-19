import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EscoService } from './esco.service';
import { EscoApiService } from './esco-api.service';

@Controller('esco')
export class EscoController {
  constructor(
    private escoService: EscoService,
    private escoApiService: EscoApiService,
  ) {}

  @Get('groups')
  getGroups(
    @Query('parentId') parentId?: string,
    @Query('level') level?: string,
  ) {
    return this.escoService.getGroups(
      parentId,
      level ? parseInt(level, 10) : undefined,
    );
  }

  @Get('occupations')
  getOccupations(
    @Query('iscoGroupId') iscoGroupId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.escoService.getOccupations(
      iscoGroupId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('occupations/:id/network')
  getOccupationNetwork(@Param('id') id: string) {
    return this.escoService.getOccupationNetwork(id);
  }

  @Get('stats')
  getStats() {
    return this.escoService.getStats();
  }

  @Get('api/test')
  @UseGuards(AuthGuard('jwt'))
  async testApiConnection() {
    const connected = await this.escoApiService.testConnection();
    return { connected };
  }

  @Get('api/search')
  @UseGuards(AuthGuard('jwt'))
  async searchOccupation(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: string,
  ) {
    if (!keyword) return { data: [] };
    return {
      data: await this.escoApiService.searchOccupation(keyword, limit ? parseInt(limit) : 5),
    };
  }

  @Get('api/occupation')
  @UseGuards(AuthGuard('jwt'))
  async getOccupationDetails(@Query('uri') uri: string) {
    return this.escoApiService.getOccupationDetails(uri);
  }

  @Get('api/skills')
  @UseGuards(AuthGuard('jwt'))
  async getSkills(@Query('uri') uri: string) {
    if (!uri) return { data: [] };
    return {
      data: await this.escoApiService.getSkills(uri),
    };
  }
}
