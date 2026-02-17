import axios from 'axios';
import { env } from '../../config/env.config';
import { logger } from '../../utils/logger';
import { IESCOSearchResult, IESCOOccupation, IESCOSkill } from './esco.types';

export class EscoService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = env.ESCO_API_URL;
    }

    async testConnection(): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/search`;
            const params = {
                text: 'test',
                type: 'occupation',
                limit: 1,
            };

            const response = await axios.get(url, { params });
            return response.status === 200;
        } catch (error) {
            logger.error('ESCO connection test failed', error);
            return false;
        }
    }

    async searchOccupation(keyword: string): Promise<IESCOSearchResult[]> {
        try {
            const url = `${this.baseUrl}/search`;
            const params = {
                text: keyword,
                type: 'occupation',
                language: 'en',
                limit: 5,
            };

            logger.info(`Searching ESCO occupation: ${keyword}`);
            const response = await axios.get(url, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            return response.data._embedded.results || [];
        } catch (error) {
            logger.error('Error searching ESCO occupation', error);
            return [];
        }
    }

    async getOccupationDetails(uri: string): Promise<IESCOOccupation | null> {
        try {
            // The ESCO API uses the resource endpoint to get details by URI
            // We need to encode the URI properly or use the /resource endpoint if available directly
            // However, usually we can query by concept URI.
            // E.g. /resource/occupation?uri=...

            const url = `${this.baseUrl}/resource/occupation`;
            const params = {
                uri: uri,
                language: 'en',
            };

            logger.info(`Fetching ESCO occupation details for URI: ${uri}`);
            const response = await axios.get(url, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            logger.error(`Error fetching ESCO details for ${uri}`, error);
            return null;
        }
    }

    async getSkills(occupationUri: string): Promise<IESCOSkill[]> {
        const occupation = await this.getOccupationDetails(occupationUri);
        if (!occupation) return [];

        const skills: IESCOSkill[] = [];

        // Extract essential skills
        if (occupation._links.hasEssentialSkill) {
            occupation._links.hasEssentialSkill.forEach(link => {
                skills.push({
                    title: link.title,
                    uri: link.uri,
                    type: 'essential',
                });
            });
        }

        // Extract optional skills
        if (occupation._links.hasOptionalSkill) {
            occupation._links.hasOptionalSkill.forEach(link => {
                skills.push({
                    title: link.title,
                    uri: link.uri,
                    type: 'optional',
                });
            });
        }

        return skills;
    }
}

export const escoService = new EscoService();
