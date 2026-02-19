import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface IESCOSearchResult {
  className: string;
  classId: string;
  uri: string;
  title: string;
  score: number;
}

export interface IESCOOccupation {
  className: string;
  classId: string;
  uri: string;
  title: string;
  description: {
    en: { literal: string };
  };
  _links: {
    hasEssentialSkill: IESCOLink[];
    hasOptionalSkill: IESCOLink[];
  };
}

export interface IESCOLink {
  uri: string;
  title: string;
  href: string;
}

export interface IESCOSkill {
  title: string;
  uri: string;
  type: 'essential' | 'optional';
}

@Injectable()
export class EscoApiService {
  private readonly logger = new Logger(EscoApiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ESCO_API_URL', 'https://ec.europa.eu/esco/api');
  }

  private get headers() {
    return {
      Accept: 'application/json',
      'User-Agent': 'ANLP-GMAP/2.0',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search`, {
          params: { text: 'test', type: 'occupation', limit: 1 },
          headers: this.headers,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error('ESCO connection test failed', error);
      return false;
    }
  }

  async searchOccupation(keyword: string, limit = 5): Promise<IESCOSearchResult[]> {
    try {
      this.logger.log(`Searching ESCO occupation: ${keyword}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search`, {
          params: {
            text: keyword,
            type: 'occupation',
            language: 'en',
            limit,
          },
          headers: this.headers,
        }),
      );

      return response.data?._embedded?.results || [];
    } catch (error) {
      this.logger.error(`Error searching ESCO occupation: ${keyword}`, error);
      return [];
    }
  }

  async getOccupationDetails(uri: string): Promise<IESCOOccupation | null> {
    try {
      this.logger.log(`Fetching ESCO occupation details for URI: ${uri}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/resource/occupation`, {
          params: { uri, language: 'en' },
          headers: this.headers,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching ESCO details for ${uri}`, error);
      return null;
    }
  }

  async getSkills(occupationUri: string): Promise<IESCOSkill[]> {
    const occupation = await this.getOccupationDetails(occupationUri);
    if (!occupation) return [];

    const skills: IESCOSkill[] = [];

    if (occupation._links?.hasEssentialSkill) {
      for (const link of occupation._links.hasEssentialSkill) {
        skills.push({ title: link.title, uri: link.uri, type: 'essential' });
      }
    }

    if (occupation._links?.hasOptionalSkill) {
      for (const link of occupation._links.hasOptionalSkill) {
        skills.push({ title: link.title, uri: link.uri, type: 'optional' });
      }
    }

    return skills;
  }

  async getSkillDetails(uri: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/resource/skill`, {
          params: { uri, language: 'en' },
          headers: this.headers,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching ESCO skill details for ${uri}`, error);
      return null;
    }
  }
}
