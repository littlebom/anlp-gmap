import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { AIProviderFactory, AIProviderName } from '@anlp/ai-provider';

// Keys that contain secrets and should be encrypted
const SECRET_KEYS = new Set([
  'API_KEY_CLAUDE',
  'API_KEY_GEMINI',
  'API_KEY_OPENAI',
  'ONET_API_KEY',
  'LIGHTCAST_CLIENT_SECRET',
]);

// All manageable keys
const ALL_KEYS = [
  'AI_PROVIDER',
  'API_KEY_CLAUDE',
  'API_KEY_GEMINI',
  'API_KEY_OPENAI',
  'OLLAMA_BASE_URL',
  'OLLAMA_MODEL',
  'ESCO_API_URL',
  'ONET_BASE_URL',
  'ONET_API_KEY',
  'LIGHTCAST_AUTH_URL',
  'LIGHTCAST_BASE_URL',
  'LIGHTCAST_CLIENT_ID',
  'LIGHTCAST_CLIENT_SECRET',
];

// Default values
const DEFAULTS: Record<string, string> = {
  AI_PROVIDER: 'gemini',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_MODEL: 'llama3.1',
  ESCO_API_URL: 'https://ec.europa.eu/esco/api',
  ONET_BASE_URL: 'https://api-v2.onetcenter.org',
  LIGHTCAST_AUTH_URL: 'https://auth.emsicloud.com/connect/token',
  LIGHTCAST_BASE_URL: 'https://emsiservices.com/skills/versions/latest',
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Derive encryption key from JWT_SECRET (or fallback)
    const secret = this.configService.get<string>('JWT_SECRET', 'anlp-gmap-settings-key');
    this.encryptionKey = scryptSync(secret, 'anlp-salt', 32);
  }

  /**
   * Encrypt a value using AES-256-CBC
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt a value
   */
  private decrypt(encrypted: string): string {
    try {
      const [ivHex, encHex] = encrypted.split(':');
      if (!ivHex || !encHex) return encrypted; // Not encrypted, return as-is
      const iv = Buffer.from(ivHex, 'hex');
      const enc = Buffer.from(encHex, 'hex');
      const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch {
      return encrypted; // If decryption fails, return original
    }
  }

  /**
   * Mask a secret value for display (show last 4 chars)
   */
  private mask(value: string): string {
    if (!value || value.length <= 4) return '••••';
    return '••••••••' + value.slice(-4);
  }

  /**
   * Get a single setting value. Priority: DB → .env → default
   */
  async get(key: string): Promise<string> {
    // 1. Try DB first
    const dbSetting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (dbSetting?.value) {
      return SECRET_KEYS.has(key) ? this.decrypt(dbSetting.value) : dbSetting.value;
    }

    // 2. Fallback to .env
    const envValue = this.configService.get<string>(key, '');
    if (envValue) return envValue;

    // 3. Fallback to defaults
    return DEFAULTS[key] || '';
  }

  /**
   * Set a single setting value
   */
  async set(key: string, value: string): Promise<void> {
    const storedValue = SECRET_KEYS.has(key) ? this.encrypt(value) : value;
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: storedValue },
      create: { key, value: storedValue },
    });
  }

  /**
   * Get all settings for display (secrets are masked)
   */
  async getAll(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const key of ALL_KEYS) {
      const value = await this.get(key);
      result[key] = SECRET_KEYS.has(key) ? this.mask(value) : value;
    }

    return result;
  }

  /**
   * Batch update settings
   */
  async updateBatch(settings: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of settings) {
      if (!ALL_KEYS.includes(key)) {
        this.logger.warn(`Ignoring unknown setting key: ${key}`);
        continue;
      }
      // Skip masked values (user didn't change the secret)
      if (SECRET_KEYS.has(key) && value.startsWith('••••')) {
        continue;
      }
      await this.set(key, value);
    }
  }

  /**
   * Test an AI provider connection
   */
  async testAiProvider(
    provider: string,
    apiKey: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      // If apiKey is masked, load the real key from storage
      const realKey = apiKey.startsWith('••••')
        ? await this.get(`API_KEY_${provider.toUpperCase()}`)
        : apiKey;

      if (!realKey) {
        return { ok: false, message: 'API key is empty' };
      }

      const ai = AIProviderFactory.create(provider as AIProviderName, { apiKey: realKey });
      const response = await ai.complete('Reply with just the word "ok"', {
        maxTokens: 10,
        temperature: 0,
      });

      return { ok: true, message: `Connected successfully (model: ${ai.name})` };
    } catch (error: any) {
      const msg = error?.message || error?.error?.message || 'Connection failed';
      return { ok: false, message: msg };
    }
  }

  /**
   * Test ESCO API connection
   */
  async testEsco(url: string): Promise<{ ok: boolean; message: string }> {
    try {
      const testUrl = `${url}/search?text=test&type=occupation&limit=1&language=en`;
      const response = await fetch(testUrl, {
        headers: { 'User-Agent': 'ANLP-GMAP/1.0' },
      });

      if (response.ok) {
        return { ok: true, message: 'ESCO API connected successfully' };
      }
      return { ok: false, message: `HTTP ${response.status}: ${response.statusText}` };
    } catch (error: any) {
      return { ok: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Test O*NET API connection
   */
  async testOnet(
    url: string,
    apiKey: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      // If API key is masked, load real value
      const realKey = apiKey.startsWith('••••')
        ? await this.get('ONET_API_KEY')
        : apiKey;

      if (!realKey) {
        return { ok: false, message: 'API key is required' };
      }

      // O*NET API v2: uses X-API-Key header, test with /about/ endpoint
      const response = await fetch(`${url}/about/`, {
        headers: {
          'X-API-Key': realKey,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return { ok: true, message: 'O*NET API connected successfully' };
      }
      if (response.status === 401 || response.status === 422) {
        return { ok: false, message: 'Invalid API key' };
      }
      return { ok: false, message: `HTTP ${response.status}: ${response.statusText}` };
    } catch (error: any) {
      return { ok: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Test Lightcast API connection
   */
  async testLightcast(
    authUrl: string,
    clientId: string,
    clientSecret: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      // If credentials are masked, load real values
      const realId = clientId.startsWith('••••')
        ? await this.get('LIGHTCAST_CLIENT_ID')
        : clientId;
      const realSecret = clientSecret.startsWith('••••')
        ? await this.get('LIGHTCAST_CLIENT_SECRET')
        : clientSecret;

      if (!realId || !realSecret) {
        return { ok: false, message: 'Client ID and Secret are required' };
      }

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${encodeURIComponent(realId)}&client_secret=${encodeURIComponent(realSecret)}&grant_type=client_credentials&scope=emsi_open`,
      });

      if (response.ok) {
        return { ok: true, message: 'Lightcast API connected successfully' };
      }
      return { ok: false, message: `Authentication failed (HTTP ${response.status})` };
    } catch (error: any) {
      return { ok: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Test Ollama connection
   */
  async testOllama(
    baseUrl: string,
    model: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      // First check if Ollama is running
      const tagsRes = await fetch(`${baseUrl}/api/tags`);
      if (!tagsRes.ok) {
        return { ok: false, message: `Cannot reach Ollama at ${baseUrl}` };
      }

      const tags: any = await tagsRes.json();
      const models = (tags.models || []).map((m: any) => m.name);

      // Check if the requested model is available
      const modelAvailable = models.some(
        (m: string) => m === model || m.startsWith(`${model}:`)
      );

      if (!modelAvailable) {
        return {
          ok: false,
          message: `Ollama is running but model "${model}" is not installed. Available: ${models.join(', ') || 'none'}. Run: ollama pull ${model}`,
        };
      }

      // Quick test completion
      const ai = AIProviderFactory.create('ollama' as AIProviderName, {
        apiKey: baseUrl,
        model,
      });
      await ai.complete('Reply with just the word "ok"', {
        maxTokens: 100,
        temperature: 0,
      });

      return { ok: true, message: `Connected to Ollama (model: ${model})` };
    } catch (error: any) {
      if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
        return { ok: false, message: `Ollama is not running. Start it with: ollama serve` };
      }
      return { ok: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Test connection by provider name
   */
  async testConnection(
    provider: string,
    config: Record<string, string>,
  ): Promise<{ ok: boolean; message: string }> {
    switch (provider) {
      case 'claude':
      case 'gemini':
      case 'openai':
        return this.testAiProvider(provider, config.apiKey || '');

      case 'ollama':
        return this.testOllama(
          config.baseUrl || DEFAULTS.OLLAMA_BASE_URL,
          config.model || DEFAULTS.OLLAMA_MODEL,
        );

      case 'esco':
        return this.testEsco(config.url || DEFAULTS.ESCO_API_URL);

      case 'onet':
        return this.testOnet(
          config.url || DEFAULTS.ONET_BASE_URL,
          config.apiKey || '',
        );

      case 'lightcast':
        return this.testLightcast(
          config.authUrl || DEFAULTS.LIGHTCAST_AUTH_URL,
          config.clientId || '',
          config.clientSecret || '',
        );

      default:
        return { ok: false, message: `Unknown provider: ${provider}` };
    }
  }
}
