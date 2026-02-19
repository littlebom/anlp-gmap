import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LightcastService } from './lightcast.service';
import { LightcastController } from './lightcast.controller';

@Module({
  imports: [HttpModule],
  controllers: [LightcastController],
  providers: [LightcastService],
  exports: [LightcastService],
})
export class LightcastModule {}
