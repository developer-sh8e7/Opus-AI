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
  groqApiKey: string;
  groqModel: string;
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
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!discordToken) missingVars.push('DISCORD_TOKEN');
  if (!clientId) missingVars.push('CLIENT_ID');
  if (!guildId) missingVars.push('GUILD_ID');
  if (!authorizedRoleId) missingVars.push('AUTHORIZED_ROLE_ID');
  if (!groqApiKey) missingVars.push('GROQ_API_KEY');

  if (missingVars.length > 0) {
    throw new Error(`تعذر تشغيل البوت بسبب فقدان متغيرات البيئة التالية: ${missingVars.join(', ')}`);
  }

  return {
    discordToken: discordToken!,
    clientId: clientId!,
    guildId: guildId!,
    authorizedRoleId: authorizedRoleId!,
    groqApiKey: groqApiKey!,
    groqModel,
  };
}

export const config = getEnvConfig();
