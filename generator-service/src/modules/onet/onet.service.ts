import axios from 'axios';
import { env } from '../../config/env.config';
import { logger } from '../../utils/logger';
import { IONETSearchResult, IONETTool, IONETTechnology, IONETTask } from './onet.types';

export class OnetService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = env.ONET_BASE_URL;
        this.apiKey = env.ONET_API_KEY;
    }

    private getHeaders(apiKey?: string) {
        return {
            'X-API-Key': apiKey || this.apiKey,
            'Accept': 'application/json',
        };
    }

    async testConnection(apiKey?: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/mnm/search`;
            const params = { keyword: 'test', start: 1, end: 1 };

            const response = await axios.get(url, {
                params,
                headers: this.getHeaders(apiKey),
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
            if (!env.ONET_API_KEY) {
                logger.warn('O*NET API key not set. Skipping O*NET search.');
                return [];
            }

            const response = await axios.get(url, {
                params,
                headers: this.getHeaders()
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
            if (!env.ONET_API_KEY) return { tools: [], technology: [] };

            const url = `${this.baseUrl}/mnm/careers/${socCode}/technology`;
            const response = await axios.get(url, { headers: this.getHeaders() });

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
            if (!env.ONET_API_KEY) return [];

            const url = `${this.baseUrl}/mnm/careers/${socCode}/tasks`;
            const response = await axios.get(url, { headers: this.getHeaders() });

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
