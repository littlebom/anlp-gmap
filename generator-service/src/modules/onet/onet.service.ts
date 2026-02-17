import axios from 'axios';
import { env } from '../../config/env.config';
import { logger } from '../../utils/logger';
import { IONETSearchResult, IONETTool, IONETTechnology, IONETTask } from './onet.types';

export class OnetService {
    private baseUrl: string;
    private authHeader: string;

    constructor() {
        this.baseUrl = env.ONET_BASE_URL;
        const credentials = Buffer.from(`${env.ONET_USERNAME}:${env.ONET_PASSWORD}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;
    }

    private get headers() {
        return {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
    }

    async testConnection(username?: string, password?: string): Promise<boolean> {
        try {
            const auth = (username && password)
                ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
                : this.authHeader;

            const url = `${this.baseUrl}/mnm/search`;
            const params = { keyword: 'test', start: 1, end: 1 };

            const response = await axios.get(url, {
                params,
                headers: { ...this.headers, 'Authorization': auth }
            });
            return response.status === 200;
        } catch (error) {
            logger.error('O*NET connection test failed', error);
            return false;
        }
    }

    async searchCareers(keyword: string): Promise<IONETSearchResult[]> {
        try {
            const url = `${this.baseUrl}/mnm/search`;
            const params = {
                keyword: keyword,
                start: 1,
                end: 5,
            };

            logger.info(`Searching O*NET careers: ${keyword}`);
            // Note: If no credentials are provided, this might return 401 or limited results depending on API config.
            // For now, we assume credentials are set or we handle the error.
            if (!env.ONET_USERNAME || !env.ONET_PASSWORD) {
                logger.warn('O*NET Credentials not set. Skipping O*NET search.');
                return [];
            }

            const response = await axios.get(url, {
                params,
                headers: this.headers
            });

            if (response.data.career) {
                return response.data.career.map((c: any) => ({
                    code: c.code,
                    title: c.title,
                    href: c.href,
                    score: c.score
                }));
            }
            return [];

        } catch (error) {
            logger.error('Error searching O*NET careers', error);
            return [];
        }
    }

    async getToolsAndTechnology(socCode: string): Promise<{ tools: IONETTool[], technology: IONETTechnology[] }> {
        try {
            if (!env.ONET_USERNAME) return { tools: [], technology: [] };

            const url = `${this.baseUrl}/mnm/careers/${socCode}/technology`;
            const response = await axios.get(url, { headers: this.headers });

            const tools: IONETTool[] = [];
            const technology: IONETTechnology[] = [];

            if (response.data.category) {
                response.data.category.forEach((cat: any) => {
                    const title = cat.title.name;
                    // Heuristic: "Tools" vs "Technology"
                    // O*NET groups them nicely usually, but broadly we can just fetch all "example"
                    if (cat.example) {
                        cat.example.forEach((ex: any) => {
                            technology.push({ id: Math.random().toString(), name: ex.name });
                        });
                    }
                });
            }

            // Also try fetching "tools" specifically if a different endpoint exists or checking another category
            // In O*NET /mnm/careers/{code}/tools used to be an endpoint, checking...
            // Actually /technology endpoint often covers both in categories.

            return { tools, technology };

        } catch (error) {
            logger.error(`Error fetching tools for ${socCode}`, error);
            return { tools: [], technology: [] };
        }
    }

    async getTasks(socCode: string): Promise<IONETTask[]> {
        try {
            if (!env.ONET_USERNAME) return [];

            const url = `${this.baseUrl}/mnm/careers/${socCode}/tasks`;
            const response = await axios.get(url, { headers: this.headers });

            if (response.data.task) {
                return response.data.task.map((t: any) => ({
                    id: t.id,
                    name: t.name
                }));
            }
            return [];
        } catch (error) {
            logger.error(`Error fetching tasks for ${socCode}`, error);
            return [];
        }
    }
}

export const onetService = new OnetService();
