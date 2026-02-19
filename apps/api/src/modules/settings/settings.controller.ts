import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TestConnectionDto } from './dto/test-connection.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    const settings = await this.settingsService.getAll();
    return settings;
  }

  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    await this.settingsService.updateBatch(dto.settings);
    const updated = await this.settingsService.getAll();
    return { message: 'Settings updated successfully', settings: updated };
  }

  @Post('test')
  async testConnection(@Body() dto: TestConnectionDto) {
    const result = await this.settingsService.testConnection(
      dto.provider,
      dto.config,
    );
    return result;
  }
}
