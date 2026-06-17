import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory
dotenv.config();

/**
 * Interface representing the validated application configuration.
 */
export interface Config {
  discordToken: string;
  clientId: string;
  guildId: string;
  authorizedRoleId: string;
  qwenApiKey: string;
  qwenModel: string;
  qwenApiBaseUrl: string;
  cerebrasApiKey: string;
  cerebrasModel: string;
  aiTimeoutMs: number;
  aiMaxRetries: number;
}

function useAllowedModel(value: string | undefined, allowedModel: string, variableName: string): string {
  if (!value || value === allowedModel) return allowedModel;
  console.warn(`[Config] Ignoring unsupported ${variableName}="${value}". Using "${allowedModel}".`);
  return allowedModel;
}

/**
 * Validates and retrieves environment variables.
 * @throws Error if any required environment variable is missing.
 */
export function getEnvConfig(): Config {
  const missingVars: string[] = [];

  const discordToken = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;
  const authorizedRoleId = process.env.AUTHORIZED_ROLE_ID;
  const qwenApiKey = process.env.QWEN_API_KEY;
  const qwenModel = process.env.QWEN_MODEL || 'qwen3.6-plus';
  const qwenApiBaseUrl = process.env.QWEN_API_BASE_URL || 'https://opencode.ai/zen/v1';
  const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
  const cerebrasModel = useAllowedModel(process.env.CEREBRAS_MODEL, 'zai-glm-4.7', 'CEREBRAS_MODEL');
  const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 25000);
  const aiMaxRetries = Number(process.env.AI_MAX_RETRIES || 2);

  if (!discordToken) missingVars.push('DISCORD_TOKEN');
  if (!clientId) missingVars.push('CLIENT_ID');
  if (!guildId) missingVars.push('GUILD_ID');
  if (!authorizedRoleId) missingVars.push('AUTHORIZED_ROLE_ID');
  if (!qwenApiKey) missingVars.push('QWEN_API_KEY (OpenCode Zen)');
  if (!Number.isFinite(aiTimeoutMs) || aiTimeoutMs <= 0) missingVars.push('AI_TIMEOUT_MS');
  if (!Number.isInteger(aiMaxRetries) || aiMaxRetries < 0) missingVars.push('AI_MAX_RETRIES');

  if (missingVars.length > 0) {
    throw new Error(`تعذر تشغيل البوت بسبب فقدان متغيرات البيئة التالية: ${missingVars.join(', ')}`);
  }

  return {
    discordToken: discordToken!,
    clientId: clientId!,
    guildId: guildId!,
    authorizedRoleId: authorizedRoleId!,
    qwenApiKey: qwenApiKey!,
    qwenModel,
    qwenApiBaseUrl,
    cerebrasApiKey: cerebrasApiKey!,
    cerebrasModel,
    aiTimeoutMs,
    aiMaxRetries,
  };
}

export const config = getEnvConfig();
