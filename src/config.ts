import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { PRODUCT_NAME } from './branding.js';
import { installEnglishConsoleOutput } from './utils/consoleOutput.js';

installEnglishConsoleOutput();

const ENV_PATH = path.join(process.cwd(), '.env');

dotenv.config({ path: ENV_PATH });

export interface Config {
  discordToken: string;
  clientId: string;
  guildId: string;
  authorizedRoleId: string;
  groqApiKey: string;
  groqModel: string;
  groqApiBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  cerebrasApiKey: string;
  cerebrasModel: string;
  cerebrasApiBaseUrl: string;
  aiTimeoutMs: number;
  aiMaxRetries: number;
  runtimeMode: 'local' | 'railway' | 'production';
  envPath: string;
}

export interface StartupDiagnostics {
  runtimeMode: Config['runtimeMode'];
  envPath: string;
  envFileExists: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  invalid: string[];
  aiProviderConfigured: boolean;
  databaseStatus: string;
  railwayDetected: boolean;
}

function detectRuntimeMode(): Config['runtimeMode'] {
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) return 'railway';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

export function getEnvConfig(): Config {
  return {
    discordToken: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    authorizedRoleId: process.env.AUTHORIZED_ROLE_ID || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    groqApiBaseUrl: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.Model_Google || 'gemini-2.0-flash-exp',
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
    cerebrasModel: process.env.CEREBRAS_MODEL || 'llama-3.3-70b',
    cerebrasApiBaseUrl: process.env.CEREBRAS_API_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions',
    aiTimeoutMs: readNumber('AI_TIMEOUT_MS', 25_000),
    aiMaxRetries: Math.max(0, Math.trunc(readNumber('AI_MAX_RETRIES', 2))),
    runtimeMode: detectRuntimeMode(),
    envPath: ENV_PATH,
  };
}

export function getStartupDiagnostics(cfg: Config = config): StartupDiagnostics {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const invalid: string[] = [];

  if (!cfg.discordToken) missingRequired.push('DISCORD_TOKEN');
  if (!cfg.clientId) missingRecommended.push('CLIENT_ID');
  if (!cfg.guildId) missingRecommended.push('GUILD_ID');
  if (!cfg.authorizedRoleId) missingRecommended.push('AUTHORIZED_ROLE_ID (optional; without it only admins/owner can use sensitive commands)');
  if (!cfg.groqApiKey) missingRecommended.push('GROQ_API_KEY (optional for login; required for AI replies)');
  if (cfg.groqApiKey && !/^gsk_[A-Za-z0-9_-]{20,}$/.test(cfg.groqApiKey)) invalid.push('GROQ_API_KEY format (Groq keys usually start with gsk_)');
  if (!cfg.geminiApiKey) missingRecommended.push('GEMINI_API_KEY (optional for primary AI provider)');
  if (!cfg.cerebrasApiKey) missingRecommended.push('CEREBRAS_API_KEY (optional fallback provider)');
  if (!Number.isFinite(cfg.aiTimeoutMs) || cfg.aiTimeoutMs <= 0) invalid.push('AI_TIMEOUT_MS');
  if (!Number.isInteger(cfg.aiMaxRetries) || cfg.aiMaxRetries < 0) invalid.push('AI_MAX_RETRIES');

  return {
    runtimeMode: cfg.runtimeMode,
    envPath: cfg.envPath,
    envFileExists: fs.existsSync(cfg.envPath),
    missingRequired,
    missingRecommended,
    invalid,
    aiProviderConfigured: Boolean(cfg.geminiApiKey) || Boolean(cfg.groqApiKey),
    databaseStatus: fs.existsSync(path.join(process.cwd(), 'data')) ? 'data/ found; local memory enabled' : 'data/ will be created automatically for local memory',
    railwayDetected: Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID),
  };
}

export function formatLocalSetupChecklist(diag: StartupDiagnostics = getStartupDiagnostics()): string {
  const lines = [
    `${PRODUCT_NAME} local startup checklist`,
    `Mode: ${diag.runtimeMode}${diag.railwayDetected ? ' (Railway detected but not required for local mode)' : ''}`,
    `.env: ${diag.envFileExists ? diag.envPath : `${diag.envPath} not found`}`,
  ];

  if (diag.missingRequired.length > 0) {
    lines.push('', 'Missing required local variables:');
    for (const name of diag.missingRequired) lines.push(`- ${name}`);
  }

  if (diag.missingRecommended.length > 0) {
    lines.push('', 'Recommended local variables:');
    for (const name of diag.missingRecommended) lines.push(`- ${name}`);
  }

  if (diag.invalid.length > 0) {
    lines.push('', 'Invalid values:');
    for (const name of diag.invalid) lines.push(`- ${name}`);
  }

  lines.push(
    '',
    'Fix:',
    '1. cp .env.example .env',
    '2. Open .env and add DISCORD_TOKEN plus any optional local values.',
    '3. npm run dev',
    '',
    'Railway is optional later only; it is not required for local development now.'
  );

  return lines.join('\n');
}

export const config = getEnvConfig();
