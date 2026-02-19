'use client';

import { useEffect, useState, useCallback } from 'react';
import { settingsApi } from '@/lib/api';

interface TestResult {
  ok: boolean;
  message: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.getAll();
      setSettings(res.data);
    } catch {
      // Will show empty form
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveSection = async (section: string, keys: string[]) => {
    setSaving((prev) => ({ ...prev, [section]: true }));
    setSaveMessages((prev) => ({ ...prev, [section]: '' }));
    try {
      const items = keys.map((key) => ({ key, value: settings[key] || '' }));
      await settingsApi.update(items);
      const res = await settingsApi.getAll();
      setSettings(res.data);
      setSaveMessages((prev) => ({ ...prev, [section]: 'Saved!' }));
      setTimeout(() => setSaveMessages((prev) => ({ ...prev, [section]: '' })), 3000);
    } catch (err: any) {
      setSaveMessages((prev) => ({
        ...prev,
        [section]: err.response?.data?.message || 'Failed to save',
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [section]: false }));
    }
  };

  const testConnection = async (provider: string, config: Record<string, string>) => {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    setTestResults((prev) => ({ ...prev, [provider]: undefined as any }));
    try {
      const res = await settingsApi.test(provider, config);
      setTestResults((prev) => ({ ...prev, [provider]: res.data }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { ok: false, message: err.response?.data?.message || 'Test failed' },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure AI providers and external API connections
        </p>
      </div>

      {/* AI Provider Section */}
      <SettingsCard
        title="AI Provider"
        description="Select the active AI provider and configure API keys"
        saveMessage={saveMessages['ai']}
        isSaving={saving['ai']}
        onSave={() =>
          saveSection('ai', [
            'AI_PROVIDER',
            'API_KEY_CLAUDE',
            'API_KEY_GEMINI',
            'API_KEY_OPENAI',
            'OLLAMA_BASE_URL',
            'OLLAMA_MODEL',
          ])
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Active Provider</label>
            <select
              value={settings['AI_PROVIDER'] || 'gemini'}
              onChange={(e) => updateSetting('AI_PROVIDER', e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="ollama">Ollama (Local LLM - Free)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
              <option value="openai">OpenAI (GPT)</option>
            </select>
          </div>

          {/* Ollama Settings */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Ollama (Local)</span>
              <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-300">FREE</span>
            </div>
            <SettingsField
              label="Base URL"
              value={settings['OLLAMA_BASE_URL'] || 'http://127.0.0.1:11434'}
              onChange={(v) => updateSetting('OLLAMA_BASE_URL', v)}
              placeholder="http://127.0.0.1:11434"
            />
            <SettingsField
              label="Model"
              value={settings['OLLAMA_MODEL'] || 'llama3.1'}
              onChange={(v) => updateSetting('OLLAMA_MODEL', v)}
              placeholder="llama3.1, mistral, gemma2, qwen2.5, etc."
            />
            <TestButton
              label="Test Ollama"
              onTest={() =>
                testConnection('ollama', {
                  baseUrl: settings['OLLAMA_BASE_URL'] || 'http://127.0.0.1:11434',
                  model: settings['OLLAMA_MODEL'] || 'llama3.1',
                })
              }
              isTesting={testing['ollama']}
              testResult={testResults['ollama']}
            />
          </div>

          <ApiKeyField
            label="Claude API Key"
            value={settings['API_KEY_CLAUDE'] || ''}
            onChange={(v) => updateSetting('API_KEY_CLAUDE', v)}
            onTest={() =>
              testConnection('claude', { apiKey: settings['API_KEY_CLAUDE'] || '' })
            }
            isTesting={testing['claude']}
            testResult={testResults['claude']}
            placeholder="sk-ant-api03-..."
          />

          <ApiKeyField
            label="Gemini API Key"
            value={settings['API_KEY_GEMINI'] || ''}
            onChange={(v) => updateSetting('API_KEY_GEMINI', v)}
            onTest={() =>
              testConnection('gemini', { apiKey: settings['API_KEY_GEMINI'] || '' })
            }
            isTesting={testing['gemini']}
            testResult={testResults['gemini']}
            placeholder="AIza..."
          />

          <ApiKeyField
            label="OpenAI API Key"
            value={settings['API_KEY_OPENAI'] || ''}
            onChange={(v) => updateSetting('API_KEY_OPENAI', v)}
            onTest={() =>
              testConnection('openai', { apiKey: settings['API_KEY_OPENAI'] || '' })
            }
            isTesting={testing['openai']}
            testResult={testResults['openai']}
            placeholder="sk-..."
          />
        </div>
      </SettingsCard>

      {/* ESCO API Section */}
      <SettingsCard
        title="ESCO API"
        description="European Skills, Competences, Qualifications and Occupations"
        saveMessage={saveMessages['esco']}
        isSaving={saving['esco']}
        onSave={() => saveSection('esco', ['ESCO_API_URL'])}
      >
        <div className="space-y-4">
          <SettingsField
            label="API URL"
            value={settings['ESCO_API_URL'] || ''}
            onChange={(v) => updateSetting('ESCO_API_URL', v)}
            placeholder="https://ec.europa.eu/esco/api"
          />
          <TestButton
            label="Test ESCO Connection"
            onTest={() =>
              testConnection('esco', { url: settings['ESCO_API_URL'] || '' })
            }
            isTesting={testing['esco']}
            testResult={testResults['esco']}
          />
        </div>
      </SettingsCard>

      {/* O*NET API Section */}
      <SettingsCard
        title="O*NET API"
        description="Occupational Information Network (requires API key)"
        saveMessage={saveMessages['onet']}
        isSaving={saving['onet']}
        onSave={() =>
          saveSection('onet', ['ONET_BASE_URL', 'ONET_API_KEY'])
        }
      >
        <div className="space-y-4">
          <SettingsField
            label="Base URL"
            value={settings['ONET_BASE_URL'] || ''}
            onChange={(v) => updateSetting('ONET_BASE_URL', v)}
            placeholder="https://api-v2.onetcenter.org"
          />
          <ApiKeyField
            label="API Key"
            value={settings['ONET_API_KEY'] || ''}
            onChange={(v) => updateSetting('ONET_API_KEY', v)}
            onTest={() =>
              testConnection('onet', {
                url: settings['ONET_BASE_URL'] || '',
                apiKey: settings['ONET_API_KEY'] || '',
              })
            }
            isTesting={testing['onet']}
            testResult={testResults['onet']}
            placeholder="your-api-key"
          />
        </div>
      </SettingsCard>

      {/* Lightcast API Section */}
      <SettingsCard
        title="Lightcast API"
        description="Skills and labor market data (requires OAuth credentials)"
        saveMessage={saveMessages['lightcast']}
        isSaving={saving['lightcast']}
        onSave={() =>
          saveSection('lightcast', [
            'LIGHTCAST_AUTH_URL',
            'LIGHTCAST_BASE_URL',
            'LIGHTCAST_CLIENT_ID',
            'LIGHTCAST_CLIENT_SECRET',
          ])
        }
      >
        <div className="space-y-4">
          <SettingsField
            label="Auth URL"
            value={settings['LIGHTCAST_AUTH_URL'] || ''}
            onChange={(v) => updateSetting('LIGHTCAST_AUTH_URL', v)}
            placeholder="https://auth.emsicloud.com/connect/token"
          />
          <SettingsField
            label="Base URL"
            value={settings['LIGHTCAST_BASE_URL'] || ''}
            onChange={(v) => updateSetting('LIGHTCAST_BASE_URL', v)}
            placeholder="https://emsiservices.com/skills/versions/latest"
          />
          <SettingsField
            label="Client ID"
            value={settings['LIGHTCAST_CLIENT_ID'] || ''}
            onChange={(v) => updateSetting('LIGHTCAST_CLIENT_ID', v)}
            placeholder="your-client-id"
          />
          <ApiKeyField
            label="Client Secret"
            value={settings['LIGHTCAST_CLIENT_SECRET'] || ''}
            onChange={(v) => updateSetting('LIGHTCAST_CLIENT_SECRET', v)}
            onTest={() =>
              testConnection('lightcast', {
                authUrl: settings['LIGHTCAST_AUTH_URL'] || '',
                clientId: settings['LIGHTCAST_CLIENT_ID'] || '',
                clientSecret: settings['LIGHTCAST_CLIENT_SECRET'] || '',
              })
            }
            isTesting={testing['lightcast']}
            testResult={testResults['lightcast']}
            placeholder="your-client-secret"
          />
        </div>
      </SettingsCard>
    </div>
  );
}

// ============================================================
// Reusable Components
// ============================================================

function SettingsCard({
  title,
  description,
  children,
  saveMessage,
  isSaving,
  onSave,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  saveMessage?: string;
  isSaving?: boolean;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span
              className={`text-xs ${saveMessage === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}
            >
              {saveMessage}
            </span>
          )}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600"
      />
    </div>
  );
}

function ApiKeyField({
  label,
  value,
  onChange,
  onTest,
  isTesting,
  testResult,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onTest: () => void;
  isTesting?: boolean;
  testResult?: TestResult;
  placeholder?: string;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 pr-10 text-sm text-white placeholder-gray-600"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          onClick={onTest}
          disabled={isTesting}
          className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test'}
        </button>
      </div>
      {testResult && (
        <div
          className={`mt-1 text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}
        >
          {testResult.ok ? '\u2705' : '\u274C'} {testResult.message}
        </div>
      )}
    </div>
  );
}

function TestButton({
  label,
  onTest,
  isTesting,
  testResult,
}: {
  label: string;
  onTest: () => void;
  isTesting?: boolean;
  testResult?: TestResult;
}) {
  return (
    <div>
      <button
        onClick={onTest}
        disabled={isTesting}
        className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-50"
      >
        {isTesting ? 'Testing...' : label}
      </button>
      {testResult && (
        <span
          className={`ml-2 text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}
        >
          {testResult.ok ? '\u2705' : '\u274C'} {testResult.message}
        </span>
      )}
    </div>
  );
}
