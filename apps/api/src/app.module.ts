import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './config/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EscoModule } from './modules/esco/esco.module';
import { OnetModule } from './modules/onet/onet.module';
import { LightcastModule } from './modules/lightcast/lightcast.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EscoModule,
    OnetModule,
    LightcastModule,
    GeneratorModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
