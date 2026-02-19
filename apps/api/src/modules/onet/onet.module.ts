import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OnetService } from './onet.service';
import { OnetController } from './onet.controller';

@Module({
  imports: [HttpModule],
  controllers: [OnetController],
  providers: [OnetService],
  exports: [OnetService],
})
export class OnetModule {}
