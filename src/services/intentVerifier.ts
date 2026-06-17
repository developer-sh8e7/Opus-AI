/**
 * Intent Verifier
 *
 * After the AI tool-call loop completes, verifies that all detected user-intent
 * types (e.g., DELETE_CHANNEL, SET_PERMISSIONS) were addressed by at least one
 * tool execution. If an intent type was detected in the user's message but no
 * matching tool was executed, the verifier flags the gap so the caller can
 * re-engage the AI to complete the missing step.
 *
 * Talk.md:2 pattern: user said "delete all rooms except الو + create store"
 * but only create_channels ran — the DELETE_CHANNEL intent was silently dropped.
 */

import type { ArabicIntent } from '../intelligence/arabic_nlp.js';
import { INTENT_PATTERNS } from '../intelligence/arabic_nlp.js';

/**
 * Mapping from user intent type to the tool name(s) that satisfy that intent.
 */
const INTENT_TO_TOOLS: Record<ArabicIntent, string[]> = {
  CREATE_CHANNEL: ['create_channels', 'build_custom_server', 'execute_community_build'],
  DELETE_CHANNEL: ['delete_channels'],
  SET_PERMISSIONS: ['edit_permissions', 'bulk_permission_update'],
  BAN_USER: ['manage_members'],
  KICK_USER: ['manage_members'],
  TIMEOUT_USER: ['manage_members'],
  GIVE_ROLE: ['manage_roles'],
  BULK_DELETE: ['delete_channels'],
  REBUILD_SERVER: ['create_channels', 'delete_channels', 'edit_permissions', 'manage_roles'],
  UNKNOWN: [],
};

const INTENT_DESCRIPTIONS: Record<ArabicIntent, string> = {
  CREATE_CHANNEL: 'إنشاء القنوات',
  DELETE_CHANNEL: 'حذف القنوات',
  SET_PERMISSIONS: 'تعديل الصلاحيات',
  BAN_USER: 'حظر الأعضاء',
  KICK_USER: 'طرد الأعضاء',
  TIMEOUT_USER: 'كتم/تايم أوت الأعضاء',
  GIVE_ROLE: 'إعطاء الرتب',
  BULK_DELETE: 'حذف جميع الرومات',
  REBUILD_SERVER: 'إعادة بناء السيرفر',
  UNKNOWN: '',
};

export interface MissingIntent {
  intent: ArabicIntent;
  description: string;
}

/**
 * Detect ALL matching intents in a user message (not just the first match).
 * Each intent pattern is tested independently against the text.
 */
export function detectAllIntents(text: string): ArabicIntent[] {
  const results: ArabicIntent[] = [];
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      results.push(intent as ArabicIntent);
    }
  }
  return results;
}

/**
 * Verify that all detected user intents were addressed by executed tools.
 *
 * @param detectedIntents - All intent types detected from the user's message.
 * @param executedToolNames - The list of tool names that were executed.
 * @returns Array of missing intents. Empty means all intents were addressed.
 */
export function findMissingIntents(
  detectedIntents: ArabicIntent[],
  executedToolNames: string[]
): MissingIntent[] {
  const missing: MissingIntent[] = [];

  for (const intent of detectedIntents) {
    if (intent === 'UNKNOWN') continue;
    const requiredTools = INTENT_TO_TOOLS[intent];
    if (!requiredTools || requiredTools.length === 0) continue;
    const wasAddressed = executedToolNames.some((name) => requiredTools.includes(name));
    if (!wasAddressed) {
      missing.push({
        intent,
        description: INTENT_DESCRIPTIONS[intent] || intent,
      });
    }
  }

  return missing;
}

/**
 * Build a system-prompt context string describing missing intents.
 * Injected into the next AI request so the model can complete the missed step.
 */
export function buildMissingIntentPrompt(missing: MissingIntent[]): string {
  if (missing.length === 0) return '';

  const steps = missing.map((m) => `- ${m.description}`).join('\n');

  return [
    '[MISSING_STEPS]',
    'The following requested actions were not completed in the previous step:',
    steps,
    '',
    'Please complete these actions now. Use get_server_info if you need current channel/role data.',
    '[/MISSING_STEPS]',
  ].join('\n');
}
