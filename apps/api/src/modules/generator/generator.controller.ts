import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GeneratorService } from './generator.service';
import { GenerateMapDto } from './dto/generate.dto';
import { CuratorEditDto } from './dto/curator-edit.dto';
import { PublishMapDto } from './dto/publish.dto';

@Controller('generator')
@UseGuards(AuthGuard('jwt'))
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateMapDto) {
    const jobId = await this.generatorService.createGenerationJob(dto.jobTitle);
    return {
      message: 'Generation job submitted',
      jobId,
      statusUrl: `/generator/jobs/${jobId}`,
    };
  }

  @Get('jobs')
  async listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.generatorService.getAllJobs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('jobs/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.generatorService.getJobStatus(id);
  }

  @Patch('jobs/:id/courses')
  async curatorEdit(
    @Param('id') id: string,
    @Body() dto: CuratorEditDto,
  ) {
    return this.generatorService.curatorEdit(id, dto.courses, dto.dependencies);
  }

  @Post('jobs/:id/publish')
  async publishMap(
    @Param('id') id: string,
    @Body() dto: PublishMapDto,
  ) {
    const result = await this.generatorService.publishMap(id, dto.jobGroupId);
    return {
      message: 'Map published successfully',
      ...result,
    };
  }
}
