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
  aiProvider: 'groq';
  ollamaEnabled: boolean;
  groqApiKey: string;
  groqModel: string;
  groqFastModel: string;
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
  const aiProvider = process.env.AI_PROVIDER || 'groq';
  const ollamaEnabled = process.env.OLLAMA_ENABLED === 'true';
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = useAllowedModel(process.env.GROQ_MODEL, 'llama-3.3-70b-versatile', 'GROQ_MODEL');
  const groqFastModel = useAllowedModel(process.env.GROQ_FAST_MODEL, 'llama-3.1-8b-instant', 'GROQ_FAST_MODEL');
  const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
  const cerebrasModel = useAllowedModel(process.env.CEREBRAS_MODEL, 'zai-glm-4.7', 'CEREBRAS_MODEL');
  const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 25000);
  const aiMaxRetries = Number(process.env.AI_MAX_RETRIES || 2);

  if (!discordToken) missingVars.push('DISCORD_TOKEN');
  if (!clientId) missingVars.push('CLIENT_ID');
  if (!guildId) missingVars.push('GUILD_ID');
  if (!authorizedRoleId) missingVars.push('AUTHORIZED_ROLE_ID');
  if (!groqApiKey) missingVars.push('GROQ_API_KEY');
  if (!cerebrasApiKey) missingVars.push('CEREBRAS_API_KEY');
  if (aiProvider !== 'groq') missingVars.push('AI_PROVIDER=groq');
  if (ollamaEnabled) missingVars.push('OLLAMA_ENABLED=false');
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
    aiProvider: 'groq',
    ollamaEnabled: false,
    groqApiKey: groqApiKey!,
    groqModel,
    groqFastModel,
    cerebrasApiKey: cerebrasApiKey!,
    cerebrasModel,
    aiTimeoutMs,
    aiMaxRetries,
  };
}

export const config = getEnvConfig();
