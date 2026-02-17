import axios from 'axios';
import { env } from '../../config/env.config';
import { logger } from '../../utils/logger';
import { ILightcastAuthResponse, ILightcastSkill } from './lightcast.types';

export class LightcastService {
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    private async authenticate(clientId?: string, clientSecret?: string): Promise<string | null> {
        // If no custom credentials, check if cached token is still valid
        if (!clientId && !clientSecret) {
            if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
                return this.accessToken;
            }
        }

        const cid = clientId || env.LIGHTCAST_CLIENT_ID;
        const csecret = clientSecret || env.LIGHTCAST_CLIENT_SECRET;

        if (!cid || !csecret) {
            logger.warn('Lightcast Credentials (CLIENT_ID/SECRET) not set.');
            return null;
        }

        try {
            logger.info('Authenticating with Lightcast...');
            const params = new URLSearchParams();
            params.append('client_id', cid);
            params.append('client_secret', csecret);
            params.append('grant_type', 'client_credentials');
            params.append('scope', 'emsi_open');

            const response = await axios.post<ILightcastAuthResponse>(
                env.LIGHTCAST_AUTH_URL,
                params,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            // only cache if we're using the default credentials
            if (!clientId && !clientSecret) {
                this.accessToken = response.data.access_token;
                this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            }

            logger.info('Lightcast Auth Successful');
            return response.data.access_token;

        } catch (error) {
            logger.error('Error authenticating with Lightcast', error);
            return null;
        }
    }

    async testConnection(clientId?: string, clientSecret?: string): Promise<boolean> {
        const token = await this.authenticate(clientId, clientSecret);
        return !!token;
    }

    async extractSkills(keyword: string): Promise<ILightcastSkill[]> {
        try {
            const token = await this.authenticate();
            if (!token) return [];

            const url = `${env.LIGHTCAST_BASE_URL}/skills`;
            const params = {
                q: keyword,
                limit: 10,
                typeIds: 'ST1,ST2', // Hard skills, Soft skills (Example IDs, adjust as needed)
            };

            logger.info(`Searching Lightcast skills for: ${keyword}`);
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` },
                params
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return [];

        } catch (error) {
            logger.error('Error fetching Lightcast skills', error);
            return [];
        }
    }
}

export const lightcastService = new LightcastService();
