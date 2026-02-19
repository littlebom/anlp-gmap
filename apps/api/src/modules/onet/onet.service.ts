import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface IONETSearchResult {
  code: string;
  title: string;
  href: string;
  score: number;
}

export interface IONETTechnology {
  id: string;
  name: string;
  category: string;
}

export interface IONETTask {
  id: number;
  name: string;
}

export interface IONETKnowledge {
  id: string;
  name: string;
  description: string;
  score: number;
}

export interface IONETSkill {
  id: string;
  name: string;
  description: string;
  score: number;
}

export interface IONETAbility {
  id: string;
  name: string;
  description: string;
  score: number;
}

export interface IONETWorkActivity {
  id: string;
  name: string;
  description: string;
  score: number;
}

export interface IONETOccupationDetail {
  code: string;
  title: string;
  description: string;
  tasks: IONETTask[];
  knowledge: IONETKnowledge[];
  skills: IONETSkill[];
  abilities: IONETAbility[];
  technology: IONETTechnology[];
  workActivities: IONETWorkActivity[];
}

@Injectable()
export class OnetService {
  private readonly logger = new Logger(OnetService.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ONET_BASE_URL', 'https://services.onetcenter.org/ws');
    this.username = this.configService.get<string>('ONET_USERNAME', '');
    this.password = this.configService.get<string>('ONET_PASSWORD', '');
  }

  private get isConfigured(): boolean {
    return !!(this.username && this.password);
  }

  private getAuthHeader(username?: string, password?: string): string {
    const u = username || this.username;
    const p = password || this.password;
    return `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
  }

  private get headers() {
    return {
      Authorization: this.getAuthHeader(),
      Accept: 'application/json',
      'User-Agent': 'ANLP-GMAP/2.0',
    };
  }

  async testConnection(username?: string, password?: string): Promise<boolean> {
    try {
      const auth = (username && password)
        ? this.getAuthHeader(username, password)
        : this.getAuthHeader();

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/search`, {
          params: { keyword: 'test', start: 1, end: 1 },
          headers: { ...this.headers, Authorization: auth },
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error('O*NET connection test failed', error);
      return false;
    }
  }

  async searchCareers(keyword: string, limit = 5): Promise<IONETSearchResult[]> {
    if (!this.isConfigured) {
      this.logger.warn('O*NET credentials not set. Skipping search.');
      return [];
    }

    try {
      this.logger.log(`Searching O*NET careers: ${keyword}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/search`, {
          params: { keyword, start: 1, end: limit },
          headers: this.headers,
        }),
      );

      if (response.data?.career) {
        return response.data.career.map((c: any) => ({
          code: c.code,
          title: c.title,
          href: c.href,
          score: c.score,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error searching O*NET careers: ${keyword}`, error);
      return [];
    }
  }

  async getTechnology(socCode: string): Promise<IONETTechnology[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/technology`, {
          headers: this.headers,
        }),
      );

      const technology: IONETTechnology[] = [];
      if (response.data?.category) {
        for (const cat of response.data.category) {
          const category = cat.title?.name || 'Unknown';
          if (cat.example) {
            for (const ex of cat.example) {
              technology.push({
                id: String(ex.id || Math.random()),
                name: ex.name,
                category,
              });
            }
          }
        }
      }
      return technology;
    } catch (error) {
      this.logger.error(`Error fetching technology for ${socCode}`, error);
      return [];
    }
  }

  async getTasks(socCode: string): Promise<IONETTask[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/tasks`, {
          headers: this.headers,
        }),
      );

      if (response.data?.task) {
        return response.data.task.map((t: any) => ({
          id: t.id,
          name: t.name,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching tasks for ${socCode}`, error);
      return [];
    }
  }

  async getKnowledge(socCode: string): Promise<IONETKnowledge[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/knowledge`, {
          headers: this.headers,
        }),
      );

      if (response.data?.element) {
        return response.data.element.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description || '',
          score: e.score?.value || 0,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching knowledge for ${socCode}`, error);
      return [];
    }
  }

  async getSkills(socCode: string): Promise<IONETSkill[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/skills`, {
          headers: this.headers,
        }),
      );

      if (response.data?.element) {
        return response.data.element.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description || '',
          score: e.score?.value || 0,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching skills for ${socCode}`, error);
      return [];
    }
  }

  async getAbilities(socCode: string): Promise<IONETAbility[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/abilities`, {
          headers: this.headers,
        }),
      );

      if (response.data?.element) {
        return response.data.element.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description || '',
          score: e.score?.value || 0,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching abilities for ${socCode}`, error);
      return [];
    }
  }

  async getWorkActivities(socCode: string): Promise<IONETWorkActivity[]> {
    if (!this.isConfigured) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/mnm/careers/${socCode}/work_activities`, {
          headers: this.headers,
        }),
      );

      if (response.data?.element) {
        return response.data.element.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description || '',
          score: e.score?.value || 0,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching work activities for ${socCode}`, error);
      return [];
    }
  }

  async getFullOccupation(socCode: string): Promise<IONETOccupationDetail | null> {
    if (!this.isConfigured) {
      this.logger.warn('O*NET credentials not set. Cannot fetch occupation.');
      return null;
    }

    try {
      const [tasks, knowledge, skills, abilities, technology, workActivities] = await Promise.all([
        this.getTasks(socCode),
        this.getKnowledge(socCode),
        this.getSkills(socCode),
        this.getAbilities(socCode),
        this.getTechnology(socCode),
        this.getWorkActivities(socCode),
      ]);

      // Get basic occupation info
      const searchResults = await this.searchCareers(socCode, 1);
      const title = searchResults[0]?.title || socCode;

      return {
        code: socCode,
        title,
        description: '',
        tasks,
        knowledge,
        skills,
        abilities,
        technology,
        workActivities,
      };
    } catch (error) {
      this.logger.error(`Error fetching full occupation for ${socCode}`, error);
      return null;
    }
  }
}
