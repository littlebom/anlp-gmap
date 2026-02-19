import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeneratorService } from './generator.service';
import { GeneratorController } from './generator.controller';
import { EscoModule } from '../esco/esco.module';
import { OnetModule } from '../onet/onet.module';
import { LightcastModule } from '../lightcast/lightcast.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    HttpModule,
    EscoModule,
    OnetModule,
    LightcastModule,
    SettingsModule,
  ],
  controllers: [GeneratorController],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
