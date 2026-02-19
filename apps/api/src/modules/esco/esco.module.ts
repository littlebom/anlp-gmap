import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EscoService } from './esco.service';
import { EscoApiService } from './esco-api.service';
import { EscoController } from './esco.controller';

@Module({
  imports: [HttpModule],
  controllers: [EscoController],
  providers: [EscoService, EscoApiService],
  exports: [EscoService, EscoApiService],
})
export class EscoModule {}
