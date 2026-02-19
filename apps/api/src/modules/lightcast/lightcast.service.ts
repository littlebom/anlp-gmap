import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ILightcastSkill {
  id: string;
  name: string;
  type: { id: string; name: string };
  infoUrl: string;
}

@Injectable()
export class LightcastService {
  private readonly logger = new Logger(LightcastService.name);
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('LIGHTCAST_BASE_URL', 'https://emsiservices.com/skills/versions/latest');
    this.authUrl = this.configService.get<string>('LIGHTCAST_AUTH_URL', 'https://auth.emsicloud.com/connect/token');
    this.clientId = this.configService.get<string>('LIGHTCAST_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('LIGHTCAST_CLIENT_SECRET', '');
  }

  private get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private async authenticate(clientId?: string, clientSecret?: string): Promise<string | null> {
    const useDefault = !clientId && !clientSecret;

    // Return cached token if still valid (with 60s buffer)
    if (useDefault && this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const cid = clientId || this.clientId;
    const csecret = clientSecret || this.clientSecret;

    if (!cid || !csecret) {
      this.logger.warn('Lightcast credentials not set.');
      return null;
    }

    try {
      this.logger.log('Authenticating with Lightcast...');
      const params = new URLSearchParams();
      params.append('client_id', cid);
      params.append('client_secret', csecret);
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'emsi_open');

      const response = await firstValueFrom(
        this.httpService.post(this.authUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      const token = response.data.access_token;

      // Cache only for default credentials
      if (useDefault) {
        this.accessToken = token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
      }

      this.logger.log('Lightcast auth successful');
      return token;
    } catch (error) {
      this.logger.error('Error authenticating with Lightcast', error);
      return null;
    }
  }

  async testConnection(clientId?: string, clientSecret?: string): Promise<boolean> {
    const token = await this.authenticate(clientId, clientSecret);
    return !!token;
  }

  async extractSkills(keyword: string, limit = 10): Promise<ILightcastSkill[]> {
    if (!this.isConfigured) {
      this.logger.warn('Lightcast credentials not set. Skipping skill extraction.');
      return [];
    }

    try {
      const token = await this.authenticate();
      if (!token) return [];

      this.logger.log(`Searching Lightcast skills for: ${keyword}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/skills`, {
          params: {
            q: keyword,
            limit,
            typeIds: 'ST1,ST2', // Hard skills + Soft skills
          },
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return response.data?.data || [];
    } catch (error) {
      this.logger.error(`Error fetching Lightcast skills: ${keyword}`, error);
      return [];
    }
  }

  async extractSkillsByType(
    keyword: string,
    type: 'hard' | 'soft' | 'all' = 'all',
    limit = 10,
  ): Promise<ILightcastSkill[]> {
    if (!this.isConfigured) return [];

    try {
      const token = await this.authenticate();
      if (!token) return [];

      const typeIds = type === 'hard' ? 'ST1' : type === 'soft' ? 'ST2' : 'ST1,ST2';

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/skills`, {
          params: { q: keyword, limit, typeIds },
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return response.data?.data || [];
    } catch (error) {
      this.logger.error(`Error fetching Lightcast skills by type: ${keyword}`, error);
      return [];
    }
  }
}
