/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  Ù†Ø¸Ø§Ù… Ø§Ù„Ø±Ù‚Ø§Ø¨Ø© ÙˆØ§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø°Ø§ØªÙŠØ© Ø§Ù„Ù…ØªÙ‚Ø¯Ù… - Advanced Autonomous Monitor
 *  ÙŠÙ‚ÙˆÙ… Ø¨Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø´Ø§ØªØŒ ÙƒØ´Ù Ø§Ù„Ø³Ø¨Ø§Ù…ØŒ Ø±ØµØ¯ Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ§Øª Ø§Ù„Ù…Ø®Ø§Ù„ÙØ©ØŒ Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø®Ø§Ø¯Ù… Ù…Ù† Ø§Ù„Ù‡Ø¬Ù…Ø§Øª (Anti-Raid)ØŒ
 *  ÙˆÙØ­Øµ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ù…Ø¹ Ø£Ø±Ø´ÙØ© ÙƒØ§ÙØ© Ø§Ù„Ø­Ø±ÙƒØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ø£Ù…Ù†ÙŠØ©.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import { Client, Events, GuildMember, Message, TextChannel, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { generateAIResponse, AIMessage } from '../services/ai.js';

// ============================================================
//  Ù†Ø¸Ø§Ù… Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª ÙÙŠ Ø§Ù„Ø°Ø§ÙƒØ±Ø© (Warn Database)
// ============================================================
interface WarnRecord { count: number; lastWarn: number; reasons: string[]; }
const warnings = new Map<string, WarnRecord>();

export function getWarningCount(userId: string): number {
  return warnings.get(userId)?.count ?? 0;
}

export function addWarning(userId: string, reason: string = 'Ù…Ø®Ø§Ù„ÙØ© Ø¹Ø§Ù…Ø©'): number {
  const r = warnings.get(userId) ?? { count: 0, lastWarn: Date.now(), reasons: [] };
  r.count++;
  r.lastWarn = Date.now();
  r.reasons.push(reason);
  warnings.set(userId, r);
  return r.count;
}
export function clearUserWarnings(userId: string): void {
  warnings.delete(userId);
}

export function getUserWarningRecord(userId: string): { count: number; lastWarn: number; reasons: string[]; } | undefined {
  return warnings.get(userId);
}


// ============================================================
//  Ø³Ø¬Ù„ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙˆØ§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ§Ù„Ø£Ø±Ø´ÙØ© Ø§Ù„Ø¹Ø§Ù…Ø© (Audit Log Store)
// ============================================================
interface ModLog {
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  reason: string;
  channelId: string;
}
export const moderationLog: ModLog[] = [];

// ============================================================
//  Ù†Ø¸Ø§Ù… ØªØ­Ø¯ÙŠØ¯ ÙˆÙƒØ´Ù Ø§Ù„Ø³Ø¨Ø§Ù… (Spam Detector / Rate Limiter)
// ============================================================
interface SpamRecord { count: number; lastReset: number; warned: boolean; }
const spamTracker = new Map<string, SpamRecord>();

export function isSpamming(userId: string): boolean {
  const now = Date.now();
  const r = spamTracker.get(userId) ?? { count: 0, lastReset: now, warned: false };
  if (now - r.lastReset > 5000) { 
    r.count = 1; 
    r.lastReset = now; 
    r.warned = false; 
  } else {
    r.count++;
  }
  spamTracker.set(userId, r);
  return r.count > 6;
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ù…Ù†Ø¹ Ù‡Ø¬Ù…Ø§Øª Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ø§Ù„Ù…ØªÙƒØ±Ø± (Anti-Raid Shield System)
// ============================================================
export class AntiRaidShield {
  private static joinLog: number[] = [];
  private static lockDownActive = false;
  private static MAX_JOINS_LIMIT = 5; // Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø§Ù†Ø¶Ù…Ø§Ù… ÙÙŠ Ø§Ù„Ù†Ø§ÙØ°Ø© Ø§Ù„Ø²Ù…Ù†ÙŠØ©
  private static WINDOW_MS = 10000; // 10 Ø«ÙˆØ§Ù†Ù

  /**
   * ØªØ³Ø¬ÙŠÙ„ Ø§Ù†Ø¶Ù…Ø§Ù… Ø¬Ø¯ÙŠØ¯ ÙˆÙØ­Øµ Ù‡Ù„ Ø§Ù„Ø³ÙŠØ±ÙØ± ØªØ­Øª Ø§Ù„Ù‡Ø¬ÙˆÙ…
   */
  static registerJoin(): boolean {
    const now = Date.now();
    this.joinLog.push(now);
    
    // ÙÙ„ØªØ±Ø© Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù…Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø§ÙØ°Ø©
    this.joinLog = this.joinLog.filter(t => now - t <= this.WINDOW_MS);

    if (this.joinLog.length > this.MAX_JOINS_LIMIT) {
      this.lockDownActive = true;
      return true; // ØªÙ… Ø±ØµØ¯ Ù‡Ø¬ÙˆÙ…
    }
    return false;
  }

  static isLockdown(): boolean {
    return this.lockDownActive;
  }

  static liftLockdown(): void {
    this.lockDownActive = false;
    this.joinLog = [];
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… ÙØ­Øµ Ø§Ù„Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ© ÙˆØ±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ§Øª (Invite Link Blocker)
// ============================================================
export class InviteLinkFilter {
  // ØªØ¹Ø¨ÙŠØ± Ù†Ù…Ø·ÙŠ Ù„Ù„ØªØ¹Ø±Ù Ø¹Ù„Ù‰ Ø±ÙˆØ§Ø¨Ø· Ø¯Ø¹ÙˆØ§Øª Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ø§Ù„Ù…Ø®ØªÙ„ÙØ©
  private static discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9\-]+/gi;

  /**
   * ÙØ­Øµ Ù‡Ù„ Ø§Ù„Ù†Øµ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ÙƒÙˆØ¯ Ø¯Ø¹ÙˆØ© Ù„Ø³ÙŠØ±ÙØ± Ø¢Ø®Ø±
   */
  static containsInvite(text: string): boolean {
    return this.discordInviteRegex.test(text);
  }
}

// ============================================================
//  ÙØ­Øµ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ (AI Prompt Guard)
// ============================================================
interface ModerationResult {
  isOffensive: boolean;
  category: 'clean' | 'mild' | 'offensive' | 'severe';
  reason: string;
  suggestedAction: 'none' | 'warn' | 'delete' | 'mute' | 'ban';
}

async function analyzeContentWithAI(text: string, authorName: string): Promise<ModerationResult> {
  try {
    const body = {
      messages: [
        {
          role: 'system',
          content: `Ø£Ù†Øª Ù†Ø¸Ø§Ù… Ù…Ø±Ø§Ù‚Ø¨Ø© Ù…Ø­ØªÙˆÙ‰ Ø°ÙƒÙŠ ÙˆÙ…Ø­ØªØ±Ù Ù„Ø³ÙŠØ±ÙØ± Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯. Ù…Ù‡Ù…ØªÙƒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆØªØ­Ø¯ÙŠØ¯ Ù‡Ù„ ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰:
- Ø³Ø¨Ø§Ø¨ Ø£Ùˆ Ø´ØªØ§Ø¦Ù… (Ø¹Ø±Ø¨ÙŠØ© Ø£Ùˆ Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø£Ùˆ Ø£ÙŠ Ù„ØºØ©)
- ØªÙ‡Ø¯ÙŠØ¯Ø§Øª Ø£Ùˆ ØªØ­Ø±ÙŠØ¶ Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù†Ù
- Ù…Ø­ØªÙˆÙ‰ Ù…Ø³ÙŠØ¡ Ù„Ù„Ø¢Ø¯Ø§Ø¨ Ø§Ù„Ø¹Ø§Ù…Ø©
- ØªØ­Ø±Ø´ ÙˆÙ…Ø¶Ø§ÙŠÙ‚Ø§Øª Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø¢Ø®Ø±ÙŠÙ†
- Ø¹Ù†ØµØ±ÙŠØ©ØŒ ØªÙ…ÙŠÙŠØ² Ø£Ùˆ Ø·Ø§Ø¦ÙÙŠØ©
- Ù…Ø­ØªÙˆÙ‰ ØºÙŠØ± Ù„Ø§Ø¦Ù‚ Ø£Ùˆ Ø¥Ø¨Ø§Ø­ÙŠ

Ø£Ø¬Ø¨ Ø¨Ù€ JSON ÙÙ‚Ø· Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ù†Øµ ØªÙØ³ÙŠØ±ÙŠ Ø¥Ø¶Ø§ÙÙŠ. Ù…Ø«Ø§Ù„ Ù„Ù„Ø±Ø¯ÙˆØ¯ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©:
{"isOffensive": false, "category": "clean", "reason": "Ø±Ø³Ø§Ù„Ø© Ø¹Ø§Ø¯ÙŠØ© ÙˆØ·Ø¨ÙŠØ¹ÙŠØ©", "suggestedAction": "none"}
{"isOffensive": true, "category": "offensive", "reason": "ØªØ­ØªÙˆÙŠ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¹Ù„Ù‰ Ø³Ø¨Ø§Ø¨ Ø¨Ø°ÙŠØ¡", "suggestedAction": "delete"}

Ø§Ù„ÙØ¦Ø§Øª Ø§Ù„Ù…ØªØ§Ø­Ø©: clean, mild, offensive, severe
Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ù…ØªØ§Ø­Ø©: none, warn, delete, mute, ban`,
        },
        {
          role: 'user',
          content: `Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…: ${authorName}\nØ§Ù„Ø±Ø³Ø§Ù„Ø©: "${text}"`,
        },
      ],
      max_tokens: 150,
      temperature: 0,
    };

    const aiMessage = await generateAIResponse(
      [body.messages[1] as AIMessage],
      {
        intent: 'smart',
        systemPrompt: body.messages[0].content ?? '',
        toolsEnabled: false,
        temperature: 0,
        maxTokens: 150,
      }
    );
    const content = aiMessage.content?.trim() ?? '';

    // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ù€ JSON Ù…Ù† Ø§Ù„Ø±Ø¯
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) throw new Error('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø±Ø¯ JSON ØµØ§Ù„Ø­');

    const result = JSON.parse(jsonMatch[0]) as ModerationResult;
    return result;
  } catch (err) {
    console.error('[AI Moderation Error] Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ù„ÙŠÙ„ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø³Ø§Ù„Ø©:', err);
    // ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ù„Ø®Ø·Ø£: Ø¥Ø±Ø¬Ø§Ø¹ Ù†ØªÙŠØ¬Ø© Ø¢Ù…Ù†Ø© ØªØ¬Ù†Ø¨Ø§Ù‹ Ù„Ù„Ø£Ø®Ø·Ø§Ø¡ Ø§Ù„Ø¹Ø´ÙˆØ§Ø¦ÙŠØ©
    return { isOffensive: false, category: 'clean', reason: 'ÙØ´Ù„ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø¨Ø³Ø¨Ø¨ Ø®Ø·Ø£ Ø¨Ø§Ù„Ø´Ø¨ÙƒØ©', suggestedAction: 'none' };
  }
}

// ============================================================
//  Ø¥ÙŠØ¬Ø§Ø¯ ÙˆØªØ­Ø¯ÙŠØ¯ Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ØªØ±Ø­ÙŠØ¨ (Utility Channel Finders)
// ============================================================
export function findLogChannel(guild: any): TextChannel | null {
  return guild.channels.cache.find(
    (ch: any) =>
      ch.isTextBased() &&
      ['Ø³Ø¬Ù„', 'Ø³Ø¬Ù„-Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª', 'log', 'logs', 'audit-log', 'Ù„ÙˆØ­Ø©-Ø§Ù„ØªØ­ÙƒÙ…', 'Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨'].some(
        (name) => (ch.name as string).toLowerCase().includes(name)
      )
  ) as TextChannel | null;
}

export function findWelcomeChannel(guild: any): TextChannel | null {
  return (
    guild.systemChannel ??
    guild.channels.cache.find(
      (ch: any) =>
        ch.isTextBased() &&
        ['welcome', 'Ø§Ù„ØªØ±Ø­ÙŠØ¨', 'ØªØ±Ø­ÙŠØ¨', 'general', 'Ø¹Ø§Ù…', 'Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø¹Ø§Ù…Ø©'].some(
          (name) => (ch.name as string).toLowerCase().includes(name)
        )
    )
  ) as TextChannel | null;
}

// ============================================================
//  Ù…Ø¹Ø§Ù„Ø¬Ø© ÙˆØªÙ†ÙÙŠØ° Ø§Ù„Ø¹Ù‚ÙˆØ¨Ø§Øª ÙˆØ§Ù„Ø¬Ø²Ø§Ø¡Ø§Øª Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© (Rule Enforcer)
// ============================================================
async function takeModerationAction(
  message: Message,
  result: ModerationResult
): Promise<void> {
  const member = message.member;
  if (!member) return;

  const channel = message.channel as TextChannel;

  // Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙˆØ±Ø§Ù‹ ÙƒØ¥Ø¬Ø±Ø§Ø¡ Ø£ÙˆÙ„ÙŠ
  if (result.suggestedAction !== 'none') {
    await message.delete().catch(() => null);
  }

  if (result.suggestedAction === 'none') return;

  const warnCount = addWarning(message.author.id, result.reason);

  const actionLabels: Record<string, string> = {
    warn: 'âš ï¸ ØªØ­Ø°ÙŠØ± Ø¥Ø¯Ø§Ø±ÙŠ',
    delete: 'ðŸ—‘ï¸ Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø©',
    mute: 'ðŸ”‡ ÙƒØªÙ… Ù…Ø¤Ù‚Øª',
    ban: 'ðŸ”¨ Ø­Ø¸Ø± Ù†Ù‡Ø§Ø¦ÙŠ',
  };

  const colorMap: Record<string, number> = {
    mild: 0xF39C12,
    offensive: 0xE74C3C,
    severe: 0xFF0000,
  };

  const embed = new EmbedBuilder()
    .setColor(colorMap[result.category] ?? 0xE74C3C)
    .setTitle(`${actionLabels[result.suggestedAction] ?? 'âš ï¸ ØªØ­Ø°ÙŠØ±'} - Ù…Ø®Ø§Ù„ÙØ© Ø§Ù„Ù…Ø¹Ø§ÙŠÙŠØ±`)
    .setDescription(`ÙŠØ§ ${member}ØŒ ØªÙ… Ø­Ø°Ù Ø±Ø³Ø§Ù„ØªÙƒ Ù„Ù…Ø®Ø§Ù„ÙØªÙ‡Ø§ Ø§Ù„Ø¢Ø¯Ø§Ø¨ Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆÙ‚ÙˆØ§Ù†ÙŠÙ† Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ø±Ø³Ù…ÙŠØ©.`)
    .addFields(
      { name: 'ðŸ¤– Ø³Ø¨Ø¨ Ø§Ù„Ù…Ø®Ø§Ù„ÙØ© Ø§Ù„Ù…ÙƒØªØ´Ù', value: result.reason, inline: false },
      { name: 'ðŸ”¢ Ø¹Ø¯Ø¯ ØªØ­Ø°ÙŠØ±Ø§ØªÙƒ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ', value: `${warnCount}/3 ØªØ­Ø°ÙŠØ±Ø§Øª`, inline: true },
      { name: 'ðŸ“Š Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø®Ø·ÙˆØ±Ø© Ø§Ù„Ù…Ø¹ÙŠÙ†', value: result.category.toUpperCase(), inline: true },
    )
    .setFooter({ text: 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ù…Ø§ÙŠØ© ÙˆØ§Ù„Ø±Ù‚Ø§Ø¨Ø© Ø§Ù„Ø°ÙƒÙŠ - Opus Guard' })
    .setTimestamp();

  const warnMsg = await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);
  if (warnMsg) {
    setTimeout(() => warnMsg.delete().catch(() => null), 15_000);
  }

  // ÙÙŠ Ø­Ø§Ù„ ÙˆØµÙˆÙ„ Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª Ù„Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ø£Ùˆ ÙƒØ§Ù† Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ Ù‡Ùˆ Ø§Ù„ÙƒØªÙ… Ø£Ùˆ ÙƒØ§Ù†Øª Ø§Ù„Ù…Ø®Ø§Ù„ÙØ© Ø´Ø¯ÙŠØ¯Ø© Ø¬Ø¯Ø§Ù‹
  if (warnCount >= 3 || result.suggestedAction === 'mute' || result.category === 'severe') {
    const duration = result.category === 'severe' ? 60 * 60 * 1000 : 15 * 60 * 1000; // Ø³Ø§Ø¹Ø© Ù„Ù„Ø§Ù†ØªÙ‡Ø§ÙƒØ§Øª Ø§Ù„Ø®Ø·ÙŠØ±Ø© Ùˆ15 Ø¯Ù‚ÙŠÙ‚Ø© Ù„Ù„Ø¹Ø§Ø¯ÙŠØ©
    try {
      await member.timeout(duration, `ØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ù…Ø®Ø§Ù„ÙØ§Øª: ${result.reason}`);
      
      // ØªØµÙÙŠØ± Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª Ø¨Ø¹Ø¯ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¹Ù‚ÙˆØ¨Ø© Ø§Ù„ÙƒØªÙ…
      clearUserWarnings(message.author.id);

      const muteEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('ðŸ”‡ ÙƒØªÙ… ÙˆØ¹Ø²Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠ')
        .setDescription(`ØªÙ… ÙƒØªÙ… Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø®Ø§Ù„Ù ${member} ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ù…Ø¯Ø© ${duration / 60000} Ø¯Ù‚ÙŠÙ‚Ø© Ù„Ø¶Ù…Ø§Ù† Ø³Ù„Ø§Ù…Ø© Ø§Ù„Ø´Ø§Øª.`)
        .addFields({ name: 'ðŸ“ Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ù…Ø¬Ù…Ø¹', value: `ØªØ±Ø§ÙƒÙ… Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª (${result.reason})` })
        .setTimestamp();

      await channel.send({ embeds: [muteEmbed] }).catch(() => null);
    } catch (e: any) {
      console.warn(`[Moderator] ØªØ¹Ø°Ø± ÙƒØªÙ… Ø§Ù„Ø¹Ø¶Ùˆ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹: ${e.message}`);
    }
  }

  // ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù…Ø®Ø§Ù„ÙØ© ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ø¹Ø§Ù…
  moderationLog.push({
    timestamp: new Date(),
    userId: message.author.id,
    username: message.author.tag,
    action: result.suggestedAction,
    reason: result.reason,
    channelId: message.channelId,
  });

  // Ø¥Ø±Ø³Ø§Ù„ ØªÙ‚Ø±ÙŠØ± ÙÙˆØ±ÙŠ Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ø³Ø¬Ù„Ø§Øª (Logs)
  const logChannel = findLogChannel(message.guild!);
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0x992D22)
      .setTitle('ðŸš¨ ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø±Ù‚Ø§Ø¨Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ù„Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ')
      .addFields(
        { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø®Ø§Ù„Ù', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
        { name: 'ðŸ“º Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ø®Ø§Ù„ÙØ©', value: `<#${message.channelId}>`, inline: true },
        { name: 'ðŸ¤– Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„Ù…Ù‚ØªØ±Ø­', value: result.suggestedAction.toUpperCase(), inline: true },
        { name: 'ðŸ“ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø­Ø°ÙˆÙØ©', value: `\`\`\`${message.content.slice(0, 500) || '(Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù†Øµ)'}\`\`\`` },
        { name: 'ðŸ” Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ù…ÙˆØ¶Ø­ Ù„Ù„ØªØ­Ù„ÙŠÙ„', value: result.reason },
      )
      .setTimestamp();
    await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
  }
}

// ============================================================
//  ØªÙ‡ÙŠØ¦Ø© ÙˆØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ù„Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆØ§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† (Core Monitor Initialization)
// ============================================================
export function startAutonomousMonitor(client: Client): void {
  console.log('ðŸ¤– [Opus] Ø¨Ø¯Ø¡ ØªØ´ØºÙŠÙ„ Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ø§Ù„Ù…ØªÙ‚Ø¯Ù… Ø¨Ù†Ø¬Ø§Ø­ âœ…');

  // 1. Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù†Ø¶Ù…Ø§Ù… Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø¬Ø¯Ø¯ ÙˆØ§Ù„ØªØ±Ø­ÙŠØ¨ ÙˆÙ…ÙƒØ§ÙØ­Ø© Ø§Ù„ØºØ²Ùˆ (Anti-Raid)
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const isAttackDetected = AntiRaidShield.registerJoin();
    const logChannel = findLogChannel(member.guild);

    if (isAttackDetected) {
      console.warn(`ðŸš¨ [Anti-Raid] ØªÙ… Ø±ØµØ¯ Ù‡Ø¬ÙˆÙ… Ø§Ù†Ø¶Ù…Ø§Ù… Ù…ÙƒØ«Ù Ø¹Ù„Ù‰ Ø§Ù„Ø³ÙŠØ±ÙØ±! ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ù…Ø§ÙŠØ©...`);
      if (logChannel) {
        const raidAlertEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('ðŸš¨ Ø¥Ù†Ø°Ø§Ø± Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø³ÙŠØ±ÙØ± - Anti-Raid Mode')
          .setDescription(
            `ØªÙ… Ø±ØµØ¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù†Ø¶Ù…Ø§Ù… Ù…ÙƒØ«ÙØ© Ù„Ù„Ø­Ø³Ø§Ø¨Ø§Øª ÙÙŠ ÙØªØ±Ø© Ù‚ØµÙŠØ±Ø©.\n` +
            `ØªÙ… ØªÙØ¹ÙŠÙ„ ÙˆØ¶Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ ÙˆØ¹Ø²Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ù†Ø¶Ù…Ø© Ø­Ø¯ÙŠØ«Ø§Ù‹.`
          )
          .setTimestamp();
        await logChannel.send({ embeds: [raidAlertEmbed] }).catch(() => null);
      }
    }

    const channel = findWelcomeChannel(member.guild);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('ðŸŽ‰ Ø¹Ø¶Ùˆ Ø¬Ø¯ÙŠØ¯ ÙÙŠ Ù…Ø¬ØªÙ…Ø¹Ù†Ø§!')
      .setDescription(
        `Ø£Ù‡Ù„Ø§Ù‹ ÙˆØ³Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙŠØ§ **${member.user.username}** ÙÙŠ Ø®Ø§Ø¯Ù… **${member.guild.name}**!\n\n` +
        `ÙŠØ³Ø¹Ø¯Ù†Ø§ ØªÙˆØ§Ø¬Ø¯Ùƒ ÙˆÙ†ØªÙ…Ù†Ù‰ Ù„Ùƒ Ø±Ø­Ù„Ø© Ù…Ù…ØªØ¹Ø© Ù…Ø¹Ù†Ø§ ðŸš€`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ðŸ“… Ø¹Ù…Ø± Ø§Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ø´Ø®ØµÙŠ', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'ðŸ‘¥ ØªØ±ØªÙŠØ¨Ùƒ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±', value: `${member.guild.memberCount.toLocaleString('ar-EG')}`, inline: true },
      )
      .setFooter({ text: `Ø§Ù„Ø±Ù…Ø² Ø§Ù„ØªØ¹Ø±ÙŠÙÙŠ: ${member.id}` })
      .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [welcomeEmbed] }).catch(() => null);
  });

  // 2. Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…ÙƒØªÙˆØ¨Ø© ÙˆØªØ­Ù„ÙŠÙ„Ù‡Ø§ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ ÙˆÙƒØ´Ù Ø§Ù„Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¶Ø§Ø±Ø© ÙˆØ§Ù„Ø³Ø¨Ø§Ù…
  const analysisCache = new Map<string, number>();

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild || !message.member) return;

    // Ø§Ø³ØªØ«Ù†Ø§Ø¡ Ø·Ø§Ù‚Ù… Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ù…Ù† Ø§Ù„Ø±Ù‚Ø§Ø¨Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©
    if (message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return;
    }

    const content = message.content.trim();
    if (!content || content.length < 2) return;

    // Ø£ÙˆÙ„Ø§Ù‹: Ø±ØµØ¯ ÙˆÙ…Ù†Ø¹ Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ§Øª Ù„Ø®ÙˆØ§Ø¯Ù… Ø£Ø®Ø±Ù‰
    if (InviteLinkFilter.containsInvite(content)) {
      await message.delete().catch(() => null);
      
      const inviteEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('ðŸš« Ù…Ù†Ø¹ Ù†Ø´Ø± Ø§Ù„Ø±ÙˆØ§Ø¨Ø·')
        .setDescription(`ÙŠØ§ ${message.member}ØŒ ÙŠÙ…Ù†Ø¹ Ù…Ù†Ø¹Ø§Ù‹ Ø¨Ø§ØªØ§Ù‹ Ù†Ø´Ø± Ø±ÙˆØ§Ø¨Ø· Ø¯Ø¹ÙˆØ§Øª Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ ÙÙŠ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù…ÙƒØ§ÙØ­Ø© Ø§Ù„ØªØ±ÙˆÙŠØ¬ Ø§Ù„Ø¹Ø´ÙˆØ§Ø¦ÙŠ.`)
        .setTimestamp();
      
      const inviteMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [inviteEmbed] }).catch(() => null);
      if (inviteMsg) {
        setTimeout(() => inviteMsg.delete().catch(() => null), 8000);
      }

      // Ø¥Ø±Ø³Ø§Ù„ Ø¨Ù„Ø§Øº ÙÙŠ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ
      const logChannel = findLogChannel(message.guild);
      if (logChannel) {
        const inviteLog = new EmbedBuilder()
          .setColor(0xE67E22)
          .setTitle('ðŸ›¡ï¸ Ù…Ø­Ø§ÙˆÙ„Ø© Ù†Ø´Ø± Ø±Ø§Ø¨Ø· Ø¯Ø¹ÙˆØ© Ù…Ø®ÙÙŠ')
          .addFields(
            { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
            { name: 'ðŸ“º Ø§Ù„Ù‚Ù†Ø§Ø©', value: `<#${message.channelId}>`, inline: true },
            { name: 'ðŸ“ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø§Ø¨Ø·', value: `\`\`\`${content}\`\`\`` }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [inviteLog] }).catch(() => null);
      }
      return;
    }

    // Ø«Ø§Ù†ÙŠØ§Ù‹: ÙØ­Øµ ÙˆÙƒØ´Ù Ø§Ù„Ø³Ø¨Ø§Ù… ÙˆØ§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…ØªÙƒØ±Ø±Ø© Ø§Ù„Ø³Ø±ÙŠØ¹Ø©
    if (isSpamming(message.author.id)) {
      const spamRecord = spamTracker.get(message.author.id)!;
      if (!spamRecord.warned) {
        spamRecord.warned = true;
        const embed = new EmbedBuilder()
          .setColor(0xF39C12)
          .setTitle('ðŸš¨ Ø¥Ù†Ø°Ø§Ø± Ø³Ø¨Ø§Ù… ÙˆØ¥ØºØ±Ø§Ù‚ Ø´Ø§Øª')
          .setDescription(`ÙŠØ§ ${message.member}ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆÙ‚Ù Ø¹Ù† Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø¨Ø³Ø±Ø¹Ø© ÙƒØ¨ÙŠØ±Ø© Ù„ØªØ¬Ù†Ø¨ Ø§Ù„ØªØ¹Ø±Ø¶ Ù„ÙƒØªÙ… ÙÙˆØ±ÙŠ!`)
          .setTimestamp();
        
        const spamMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [embed] }).catch(() => null);
        if (spamMsg) {
          setTimeout(() => spamMsg.delete().catch(() => null), 7000);
        }
      }
      // Ù…Ø³Ø­ Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø³Ø¨Ø§Ù… Ø§Ù„Ù…ÙƒØ±Ø±Ø© ÙÙˆØ±Ø§Ù‹
      await message.delete().catch(() => null);
      return;
    }

    // ØªØ¬Ù†Ø¨ Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ API Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø¨Ø´ÙƒÙ„ Ù…ÙØ±Ø· (Throttle: ØªØ­Ù„ÙŠÙ„ ÙˆØ§Ø­Ø¯ ÙƒÙ„ Ø«Ø§Ù†ÙŠØªÙŠÙ† Ù„ÙƒÙ„ Ù…Ø³ØªØ®Ø¯Ù…)
    const lastAnalysis = analysisCache.get(message.author.id) ?? 0;
    const now = Date.now();
    if (now - lastAnalysis < 2000) return;
    
    // ÙØ­Øµ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø°Ø§Øª Ø§Ù„Ø­Ø¬Ù… Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ù„ØªÙØ§Ø¯ÙŠ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¬Ù…Ù„ Ø§Ù„Ø¨Ø³ÙŠØ·Ø© Ù…Ø«Ù„ "Ù‡Ù„Ø§" Ø£Ùˆ "Ø´ÙƒØ±Ø§"
    if (content.length < 5) return;
    analysisCache.set(message.author.id, now);

    // Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„ÙØ¹Ù„ÙŠ Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
    const result = await analyzeContentWithAI(content, message.author.username);

    if (result.isOffensive && result.suggestedAction !== 'none') {
      await takeModerationAction(message, result);
    }
  });

  // 3. Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØªØ³Ø¬ÙŠÙ„ Ø¹Ù…Ù„ÙŠØ§Øª Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ (Message Delete Auditor)
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const logChannel = findLogChannel(message.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('ðŸ—‘ï¸ Ø£Ø±Ø´ÙØ© Ø­Ø°Ù Ø±Ø³Ø§Ù„Ø©')
      .addFields(
        { name: 'ðŸ‘¤ ÙƒØ§ØªØ¨ Ø§Ù„Ø±Ø³Ø§Ù„Ø©', value: message.author?.tag ?? 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ', inline: true },
        { name: 'ðŸ“º Ù‚Ù†Ø§Ø© Ø§Ù„ÙƒØªØ§Ø¨Ø©', value: `<#${message.channelId}>`, inline: true },
        { name: 'ðŸ“ Ù†Øµ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø­Ø°ÙˆÙØ©', value: `\`\`\`${message.content?.slice(0, 800) || '(Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù†Øµ Ù„Ù„Ø±Ø³Ø§Ù„Ø© Ø£Ùˆ Ù…ÙŠØ¯ÙŠØ§ ÙÙ‚Ø·)'}\`\`\`` }
      )
      .setFooter({ text: `Ø§Ù„Ù…Ø¹Ø±Ù Ø§Ù„Ø±Ù‚Ù…ÙŠ Ù„Ù„Ù…Ø±Ø³Ù„: ${message.author?.id ?? 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  });

  // 4. Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØªØ³Ø¬ÙŠÙ„ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ (Message Update Auditor)
  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (!oldMsg.content || !newMsg.content || oldMsg.content === newMsg.content) return;

    const logChannel = findLogChannel(newMsg.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('âœï¸ Ø£Ø±Ø´ÙØ© ØªØ¹Ø¯ÙŠÙ„ Ø±Ø³Ø§Ù„Ø©')
      .addFields(
        { name: 'ðŸ‘¤ Ø§Ù„ÙƒØ§ØªØ¨ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„', value: newMsg.author?.tag ?? 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ', inline: true },
        { name: 'ðŸ“º Ù‚Ù†Ø§Ø© Ø§Ù„Ø±Ø³Ø§Ù„Ø©', value: `<#${newMsg.channelId}>`, inline: true },
        { name: 'ðŸ“ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù‚Ø¨Ù„ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„', value: `\`\`\`${oldMsg.content.slice(0, 450)}\`\`\`` },
        { name: 'ðŸ“ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¨Ø¹Ø¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„', value: `\`\`\`${newMsg.content.slice(0, 450)}\`\`\`` }
      )
      .setFooter({ text: `Ø§Ù„Ù…Ø¹Ø±Ù Ø§Ù„Ø±Ù‚Ù…ÙŠ Ù„Ù„Ù…Ø±Ø³Ù„: ${newMsg.author?.id ?? 'ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  });

  // 5. Ù…Ø±Ø§Ù‚Ø¨Ø© Ø¯Ø®ÙˆÙ„ ÙˆØ®Ø±ÙˆØ¬ Ø§Ù„ØºØ±Ù Ø§Ù„ØµÙˆØªÙŠØ© ÙˆØ£Ù†Ø´Ø·Ø© Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ (Voice State Auditor)
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (newState.member?.user.bot) return;
    
    const guild = newState.guild ?? oldState.guild;
    const logChannel = findLogChannel(guild);
    if (!logChannel) return;

    if (!oldState.channelId && newState.channelId) {
      // Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ù‚Ù†Ø§Ø© ØµÙˆØªÙŠØ©
      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('ðŸŽ¤ Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ù‚Ù†Ø§Ø© ØµÙˆØªÙŠØ©')
        .setDescription(`Ø¯Ø®Ù„ Ø§Ù„Ø¹Ø¶Ùˆ **${newState.member?.user.tag}** Ø¥Ù„Ù‰ ØµØ§Ù„ÙˆÙ† Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„ØµÙˆØªÙŠØ© Ø¨Ù†Ø¬Ø§Ø­.`)
        .addFields(
          { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…ØªØµÙ„', value: `${newState.member?.displayName}`, inline: true },
          { name: 'ðŸ”Š Ø§Ø³Ù… Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„ØµÙˆØªÙŠØ©', value: `<#${newState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldState.channelId && !newState.channelId) {
      // Ù…ØºØ§Ø¯Ø±Ø© Ù‚Ù†Ø§Ø© ØµÙˆØªÙŠØ©
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('ðŸš¶ Ù…ØºØ§Ø¯Ø±Ø© Ù‚Ù†Ø§Ø© ØµÙˆØªÙŠØ©')
        .setDescription(`Ø®Ø±Ø¬ Ø§Ù„Ø¹Ø¶Ùˆ **oldState.member?.user.tag** Ø£Ùˆ Ø§Ù†Ù‚Ø·Ø¹ Ø§ØªØµØ§Ù„Ù‡ Ø¨Ø§Ù„ØµØ§Ù„ÙˆÙ† Ø§Ù„ØµÙˆØªÙŠ.`)
        .addFields(
          { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…ØºØ§Ø¯Ø±', value: `${oldState.member?.displayName}`, inline: true },
          { name: 'ðŸ”Š Ø§Ø³Ù… Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…ØºØ§Ø¯ÙŽØ±Ø©', value: `<#${oldState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      // Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ø¨ÙŠÙ† Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„ØµÙˆØªÙŠØ©
      const embed = new EmbedBuilder()
        .setColor(0xF39C12)
        .setTitle('ðŸ”€ Ø§Ù†ØªÙ‚Ø§Ù„ Ø¨ÙŠÙ† Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„ØµÙˆØªÙŠØ©')
        .setDescription(`Ø§Ù†ØªÙ‚Ù„ Ø§Ù„Ø¹Ø¶Ùˆ **${newState.member?.user.tag}** Ù…Ù† ØµØ§Ù„ÙˆÙ† Ø¥Ù„Ù‰ Ø¢Ø®Ø±.`)
        .addFields(
          { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ', value: `${newState.member?.displayName}`, inline: true },
          { name: 'ðŸ”Š Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©', value: `<#${oldState.channelId}>`, inline: true },
          { name: 'ðŸ”Š Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©', value: `<#${newState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
  });
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ø§Ù„ÙØ­ÙˆØµØ§Øª ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø°Ø§ØªÙŠ Ù„ÙˆØ­Ø¯Ø© Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© (Self-Diagnostics Suite)
// ============================================================
export function runMonitorDiagnostics(): { success: boolean; log: string[] } {
  const log: string[] = [];
  let success = true;

  try {
    log.push('[Diagnostic-Monitor] Ø¨Ø¯Ø¡ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ØªØ´ØºÙŠÙ„ ÙˆØ­Ø¯Ø© Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ§Ù„Ø­Ù…Ø§ÙŠØ©...');

    // 1. Ø§Ø®ØªØ¨Ø§Ø± ÙƒØ§Ø´Ù Ø§Ù„Ø³Ø¨Ø§Ù… ÙˆØ§Ù„Ù…Ø¹Ø¯Ù„
    const testUserId = 'mock_user_123';
    let spamResult = false;
    for (let i = 0; i < 8; i++) {
      spamResult = isSpamming(testUserId);
    }
    if (!spamResult) {
      log.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 1: ÙƒØ§Ø´Ù Ø§Ù„Ø³Ø¨Ø§Ù… Ù„Ù… ÙŠØ³Ø¬Ù„ ØªØ¬Ø§ÙˆØ²Ø§Ù‹ Ù„Ù„Ù…Ø¹Ø¯Ù„.');
      success = false;
    } else {
      log.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 1: ÙƒØ§Ø´Ù Ø§Ù„Ø³Ø¨Ø§Ù… Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ ÙŠØ¹Ù…Ù„ Ø¨Ø¯Ù‚Ø©.');
    }

    // 2. Ø§Ø®ØªØ¨Ø§Ø± ØªØµÙÙŠØ© Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ§Øª Ø§Ù„Ù…Ù…Ù†ÙˆØ¹Ø©
    const sampleInvite = 'Ø§Ù†Ø¶Ù… Ù„Ø³ÙŠØ±ÙØ±Ù†Ø§ Ù‡Ù†Ø§: https://discord.gg/test-invite-link';
    if (!InviteLinkFilter.containsInvite(sampleInvite)) {
      log.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 2: ÙÙ„ØªØ± Ø§Ù„Ø¯Ø¹ÙˆØ§Øª Ù„Ù… ÙŠØ­Ø¯Ø¯ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ© Ø§Ù„ØµØ§Ù„Ø­.');
      success = false;
    } else {
      log.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 2: ÙÙ„ØªØ± Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ø¯Ø¹ÙˆØ§Øª ÙŠØªØ¹Ø±Ù Ø¹Ù„ÙŠÙ‡Ø§ Ø¨Ù†Ø¬Ø§Ø­.');
    }

    // 3. Ø§Ø®ØªØ¨Ø§Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª ÙˆØªØ±Ø§ÙƒÙ…Ù‡Ø§
    const dummyUserId = 'dummy_user_999';
    clearUserWarnings(dummyUserId);
    addWarning(dummyUserId, 'Ø¥Ø²Ø¹Ø§Ø¬ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡');
    addWarning(dummyUserId, 'Ø§Ø³ØªØ®Ø¯Ø§Ù… ÙƒÙ„Ù…Ø§Øª ØºÙŠØ± Ù„Ø§Ø¦Ù‚Ø©');
    const totalWarns = getWarningCount(dummyUserId);
    if (totalWarns !== 2) {
      log.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 3: Ù†Ø¸Ø§Ù… ØªØ±Ø§ÙƒÙ… ÙˆØ­Ø³Ø§Ø¨ ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ØºÙŠØ± Ø¯Ù‚ÙŠÙ‚.');
      success = false;
    } else {
      log.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 3: Ù†Ø¸Ø§Ù… Ø§Ø­ØªØ³Ø§Ø¨ ÙˆØªØ±Ø§ÙƒÙ… Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª ÙŠØ¹Ù…Ù„ Ø¨Ù†Ø¬Ø§Ø­.');
    }

    // 4. Ø§Ø®ØªØ¨Ø§Ø± ØªØµÙÙŠØ± Ø³Ø¬Ù„ ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡
    clearUserWarnings(dummyUserId);
    if (getWarningCount(dummyUserId) !== 0) {
      log.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 4: Ù†Ø¸Ø§Ù… ØªÙØ±ÙŠØº ÙˆØªØµÙÙŠØ± ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù„Ù… ÙŠÙ†Ø¬Ø­.');
      success = false;
    } else {
      log.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 4: Ù†Ø¸Ø§Ù… ØªØµÙÙŠØ± Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª ÙŠØ¹Ù…Ù„ Ø¨Ø¯ÙˆÙ† Ø£Ø®Ø·Ø§Ø¡.');
    }

    // 5. Ø§Ø®ØªØ¨Ø§Ø± Ø¯Ø±Ø¹ Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø³ÙŠØ±ÙØ± Ù…Ù† Ù‡Ø¬Ù…Ø§Øª Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… (Anti-Raid)
    AntiRaidShield.liftLockdown();
    let raidDetected = false;
    for (let i = 0; i < 10; i++) {
      if (AntiRaidShield.registerJoin()) {
        raidDetected = true;
      }
    }
    if (!raidDetected || !AntiRaidShield.isLockdown()) {
      log.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 5: Ø¯Ø±Ø¹ Anti-Raid Ù„Ù… ÙŠÙƒØªØ´Ù Ù…Ø­Ø§ÙƒØ§Ø© Ù‡Ø¬ÙˆÙ… Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù….');
      success = false;
    } else {
      log.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 5: Ø¯Ø±Ø¹ Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø³ÙŠØ±ÙØ± Anti-Raid ÙŠØ¹Ù…Ù„ Ø¨Ù†Ø¬Ø§Ø­ Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¶ØºØ·.');
    }

    // Ø¥Ù†Ù‡Ø§Ø¡ Ø§Ù„ØªØ´Ø®ÙŠØµ ÙˆØ±ÙØ¹ Ø§Ù„Ù†ØªØ§Ø¦Ø¬
    log.push(`[Diagnostic-Monitor] Ø§Ù†ØªÙ‡Øª Ø§Ù„ÙØ­ÙˆØµØ§Øª Ø¨Ù†Ø¬Ø§Ø­. Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„Ø¹Ø§Ù…Ø©: ${success ? 'Ù†Ø§Ø¬Ø­' : 'ÙØ§Ø´Ù„'}`);
  } catch (error: any) {
    success = false;
    log.push(`âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ ÙØ§Ø¯Ø­ Ø£Ø«Ù†Ø§Ø¡ ØªØ´ØºÙŠÙ„ ØªØ´Ø®ÙŠØµ Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©: ${error.message}`);
  }

  return { success, log };
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© ÙˆØ§Ù„Ø£Ù…Ù† (Role & Permission Guard)
// ============================================================
export class RolePermsGuard {
  /**
   * ÙØ­Øµ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù…Ù…Ù†ÙˆØ­Ø© Ù„Ù„Ø±ØªØ¨Ø© ÙˆØªØ­Ø¯ÙŠØ¯ Ù…Ø¯Ù‰ Ø®Ø·ÙˆØ±ØªÙ‡Ø§
   */
  static isDangerousRole(permissionsBitfield: bigint): boolean {
    const dangerousPerms = [
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageWebhooks,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers
    ];

    for (const perm of dangerousPerms) {
      if ((permissionsBitfield & perm) === perm) {
        return true;
      }
    }
    return false;
  }

  /**
   * Ø¥Ø±Ø³Ø§Ù„ ØªÙ†Ø¨ÙŠÙ‡ Ø£Ù…Ù†ÙŠ Ø¹Ù†Ø¯ ØªØ¹Ø¯ÙŠÙ„ ØµÙ„Ø§Ø­ÙŠØ§Øª Ø±ØªØ¨Ø© Ø£Ùˆ Ù…Ù†Ø­Ù‡Ø§ ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ©
   */
  static async auditRoleUpdate(
    guild: any,
    oldRole: any,
    newRole: any,
    executorName: string
  ): Promise<void> {
    const logChannel = findLogChannel(guild);
    if (!logChannel) return;

    const oldDangerous = this.isDangerousRole(oldRole.permissions.bitfield);
    const newDangerous = this.isDangerousRole(newRole.permissions.bitfield);

    if (!oldDangerous && newDangerous) {
      const securityEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('ðŸš¨ ØªØ­Ø°ÙŠØ± Ø£Ù…Ù†ÙŠ: ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…Ù…Ù†ÙˆØ­Ø© Ø±ØªØ¨Ø©')
        .setDescription(
          `ØªÙ… ØªØ­Ø¯ÙŠØ« ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø±ØªØ¨Ø© **${newRole.name}** Ù„ØªØ´Ù…Ù„ ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ø®Ø·ÙŠØ±Ø©.\n` +
          `**Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ Ø¹Ù† Ø§Ù„ØªØ¹Ø¯ÙŠÙ„:** ${executorName}`
        )
        .addFields(
          { name: 'Ø±Ù‚Ù… Ø§Ù„Ø±ØªØ¨Ø© (ID)', value: `\`${newRole.id}\``, inline: true },
          { name: 'Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ù…Ø¹ÙŠÙ†', value: `${newRole.hexColor}`, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [securityEmbed] }).catch(() => null);
    }
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ù…Ù†Ø¹ ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù…ØªØ·Ø§Ø¨Ù‚ (Message Deduplicator)
// ============================================================
interface UserHistoryEntry {
  contentHash: string;
  timestamp: number;
}
const userMessageHistory = new Map<string, UserHistoryEntry[]>();

export class MessageDeduplicator {
  /**
   * ÙØ­Øµ ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ø­ØªÙˆÙ‰ ÙˆØ­Ø¸Ø± Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø·Ø§Ø¨Ù‚Ø© Ø§Ù„Ù…ÙƒØ±Ø±Ø© ÙÙŠ Ù‚Ù†ÙˆØ§Øª Ù…Ø®ØªÙ„ÙØ©
   */
  static isDuplicate(userId: string, content: string, limitCount: number = 3): boolean {
    const now = Date.now();
    const cleanContent = content.trim().toLowerCase();
    if (cleanContent.length < 10) return false; // ØªØ¬Ø§Ù‡Ù„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù‚ØµÙŠØ±Ø©

    const hash = cleanContent; // ØªØ¨Ø³ÙŠØ· Ù„ØªØ¬Ù†Ø¨ ØªØ¹Ù‚ÙŠØ¯ Ø§Ù„Ù‡Ø´
    const history = userMessageHistory.get(userId) ?? [];

    // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© (Ø£ÙƒØ¨Ø± Ù…Ù† 60 Ø«Ø§Ù†ÙŠØ©)
    const validHistory = history.filter(h => now - h.timestamp <= 60000);

    const matches = validHistory.filter(h => h.contentHash === hash);
    validHistory.push({ contentHash: hash, timestamp: now });
    userMessageHistory.set(userId, validHistory);

    return matches.length >= limitCount;
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª ÙˆØ§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ØºÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© (Shadow Ban System)
// ============================================================
const shadowBannedUsers = new Set<string>();

export class ShadowBanSystem {
  static add(userId: string): void {
    shadowBannedUsers.add(userId);
  }

  static remove(userId: string): void {
    shadowBannedUsers.delete(userId);
  }

  static isShadowBanned(userId: string): boolean {
    return shadowBannedUsers.has(userId);
  }

  /**
   * Ù…Ø¹Ø§Ù„Ø¬Ø© Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ù†Ø¯Ø±Ø¬ÙŠÙ† ØªØ­Øª Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª (Ø­Ø°Ù Ø±Ø³Ø§Ø¦Ù„Ù‡Ù… ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨ØµÙ…Øª Ø¯ÙˆÙ† ØªÙ†Ø¨ÙŠÙ‡)
   */
  static async handleMessage(message: Message): Promise<boolean> {
    if (this.isShadowBanned(message.author.id)) {
      await message.delete().catch(() => null);
      return true; // ØªÙ…Øª Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© Ø¨Ù†Ø¬Ø§Ø­
    }
    return false;
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØªØµÙÙŠØ© Ø§Ù„Ù…Ø±ÙÙ‚Ø§Øª ÙˆØ§Ù„ÙˆØ³Ø§Ø¦Ø· (Media Filter System)
// ============================================================
export class MediaFilterSystem {
  private static MAX_ATTACHMENT_SIZE_MB = 15; // 15 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª ÙƒØ­Ø¯ Ø£Ù‚ØµÙ‰ Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡

  /**
   * ÙØ­Øµ Ø­Ø¬Ù… Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø±ÙÙ‚Ø© ÙˆØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ø¹Ø¶Ùˆ Ø¥Ø°Ø§ ØªØ¬Ø§ÙˆØ²Øª Ø§Ù„Ø­Ø¯
   */
  static async validateAttachments(message: Message): Promise<boolean> {
    if (message.attachments.size === 0) return true;

    let totalSize = 0;
    message.attachments.forEach(attachment => {
      totalSize += attachment.size;
    });

    const sizeInMB = totalSize / (1024 * 1024);

    if (sizeInMB > this.MAX_ATTACHMENT_SIZE_MB) {
      await message.delete().catch(() => null);
      const limitEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('âš ï¸ Ø­Ø¬Ù… Ø§Ù„Ù…Ø±ÙÙ‚Ø§Øª ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­')
        .setDescription(
          `ÙŠØ§ ${message.member}ØŒ Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ù…Ø±ÙÙ‚Ø§Øª Ù‡Ùˆ \`${this.MAX_ATTACHMENT_SIZE_MB}MB\`.\n` +
          `ØªÙ… Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù„Ø­ÙØ¸ Ø³Ø¹Ø© ØªØ­Ù…ÙŠÙ„ Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø®Ø§Ø¯Ù….`
        )
        .setTimestamp();
      
      const response = await (message.channel as any).send({ content: `${message.member}`, embeds: [limitEmbed] }).catch(() => null);
      if (response) {
        setTimeout(() => response.delete().catch(() => null), 8000);
      }
      return false;
    }
    return true;
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ù…ÙƒØ§ÙØ­Ø© ØªØ³Ø±ÙŠØ¨ Ø§Ù„ØªÙˆÙƒÙ†Ø§Øª ÙˆØ§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© (Credential Protection)
// ============================================================
export class CredentialProtection {
  private static tokenRegex = /[a-zA-Z0-9_\-]{24,28}\.[a-zA-Z0-9_\-]{6}\.[a-zA-Z0-9_\-]{27,38}/g;

  /**
   * ÙØ­Øµ Ø§Ù„Ø´Ø§Øª Ù„Ù…Ù†Ø¹ ØªØ³Ø±ÙŠØ¨ Ø±Ù…ÙˆØ² Ø§Ù„Ø§ØªØµØ§Ù„ Ø§Ù„Ø®Ø§ØµØ© Ø¨Ø§Ù„Ø¨ÙˆØªØ§Øª (Bot Tokens)
   */
  static async scanForLeaks(message: Message): Promise<boolean> {
    if (this.tokenRegex.test(message.content)) {
      await message.delete().catch(() => null);

      const alertEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('ðŸš¨ ØªØ­Ø°ÙŠØ±: ØªØ³Ø±ÙŠØ¨ Ø±Ù…Ø² Ø§ØªØµØ§Ù„ Ø¨ÙˆØª (Bot Token Leak)')
        .setDescription(
          `ÙŠØ§ ${message.member}ØŒ ØªÙ… Ø±ØµØ¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§ØªØµØ§Ù„ Ø¨ÙˆØª Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯.\n` +
          `ØªÙ… Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙˆØ±Ø§Ù‹ Ù„Ø­Ù…Ø§ÙŠØ© Ø£Ù…Ø§Ù† Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆØ§Ù„Ø¨ÙˆØªØ§Øª Ø§Ù„ØªØ§Ø¨Ø¹Ø© Ù„Ù‡.`
        )
        .setTimestamp();

      const msg = await (message.channel as any).send({ content: `${message.member}`, embeds: [alertEmbed] }).catch(() => null);
      if (msg) {
        setTimeout(() => msg.delete().catch(() => null), 10000);
      }

      // Ø¥Ø±Ø³Ø§Ù„ ØªÙ†Ø¨ÙŠÙ‡ ÙÙŠ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ
      const logChannel = findLogChannel(message.guild);
      if (logChannel) {
        const securityAlert = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('ðŸš¨ Ø®Ø±Ù‚ Ø£Ù…Ù†ÙŠ: ØªØ³Ø±ÙŠØ¨ Ø±Ù…Ø² Ø§ØªØµØ§Ù„ Ø¨ÙˆØª')
          .addFields(
            { name: 'ðŸ‘¤ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…ØªØ³Ø¨Ø¨', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
            { name: 'ðŸ“º Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ø¯ÙØ©', value: `<#${message.channelId}>`, inline: true },
            { name: 'ðŸ“ Ù†ÙˆØ¹ Ø§Ù„ØªØ³Ø±ÙŠØ¨ Ø§Ù„Ù…ÙƒØªØ´Ù', value: 'Discord Bot Token Pattern' }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [securityAlert] }).catch(() => null);
      }
      return true; // ØªÙ… Ø±ØµØ¯ ØªØ³Ø±ÙŠØ¨
    }
    return false;
  }
}

// ============================================================
//  Ù…Ø¹Ø¬Ù… ØªØµÙÙŠØ© Ø§Ù„Ø£Ù„ÙØ§Ø¸ ÙˆØ§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø­Ø¸ÙˆØ±Ø© (Bad Word Dictionary)
// ============================================================
export class BadWordDictionary {
  private static bannedWords: Set<string> = new Set([
    'ÙƒØ³Ø§Ø®ØªÙƒ', 'Ù…Ù†ÙŠÙˆÙƒ', 'ÙƒØ³Ù…Ùƒ', 'Ù‚Ø­Ø¨Ø©', 'Ø´Ø±Ù…ÙˆØ·Ø©', 'Ø¹Ø±Øµ', 'Ø®ÙˆÙ„',
    'fack', 'bitch', 'asshole', 'dick', 'pussy'
  ]);

  static isBanned(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      // Ø¥Ø²Ø§Ù„Ø© Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù„ØªØ´ÙƒÙŠÙ„ ÙˆØ§Ù„Ø­Ø±ÙˆÙ Ø§Ù„Ø²Ø§Ø¦Ø¯Ø©
      const cleanWord = word
        .replace(/[\u064B-\u065F]/g, '') // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØªØ´ÙƒÙŠÙ„ Ø§Ù„Ø¹Ø±Ø¨ÙŠ
        .replace(/(.)\1+/g, '$1');       // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØªÙƒØ±Ø§Ø± (Ù…Ø«Ø§Ù„: ÙƒØ³Ù…Ù…Ù…Ùƒ -> ÙƒØ³Ù…Ùƒ)
      
      if (this.bannedWords.has(cleanWord)) {
        return true;
      }
    }
    return false;
  }

  static addWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  static removeWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ø§Ù„Ø±Ø¯ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø© (Auto Responder System)
// ============================================================
interface AutoResponse {
  keywords: string[];
  reply: string;
}

export class AutoResponder {
  private static responses: AutoResponse[] = [
    {
      keywords: ['ÙƒÙŠÙ', 'Ø§Ø´ØªØ±ÙŠ', 'Ù…ØªØ¬Ø±', 'Ø§Ù„Ø·Ù„Ø¨'],
      reply: 'ðŸ›’ Ù„Ø´Ø±Ø§Ø¡ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ù† Ù…ØªØ¬Ø±Ù†Ø§ Ø§Ù„Ù…ØªÙ…ÙŠØ²ØŒ ÙŠØ±Ø¬Ù‰ ÙØªØ­ ØªØ°ÙƒØ±Ø© Ø¯Ø¹Ù… Ù…Ø§Ù„ÙŠ ÙÙŠ Ù‚Ù†Ø§Ø© ðŸŽ«-ØªØ°Ø§ÙƒØ±-Ø§Ù„Ø¯Ø¹Ù… ÙˆØ³ÙŠÙ‚ÙˆÙ… Ø§Ù„Ù…Ø´Ø±Ù Ø§Ù„Ù…Ø®ØªØµ Ø¨Ø®Ø¯Ù…ØªÙƒ ÙÙˆØ±Ø§Ù‹.'
    },
    {
      keywords: ['Ù‚ÙˆØ§Ù†ÙŠÙ†', 'Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†', 'Ù‚Ø§Ù†ÙˆÙ†'],
      reply: 'ðŸ“œ ÙŠØ±Ø¬Ù‰ Ù‚Ø±Ø§Ø¡Ø© ÙˆØ§Ø­ØªØ±Ø§Ù… Ù‚ÙˆØ§Ù†ÙŠÙ† Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ù…ØªÙˆØ§Ø¬Ø¯Ø© ÙÙŠ Ù‚Ù†Ø§Ø© ðŸ“œ-Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ† Ù„ØªØ¬Ù†Ø¨ Ø§Ù„ØªØ¹Ø±Ø¶ Ù„Ø£ÙŠ Ø¹Ù‚ÙˆØ¨Ø§Øª Ø¥Ø¯Ø§Ø±ÙŠØ©.'
    },
    {
      keywords: ['Ù…Ø³Ø§Ø¹Ø¯Ø©', 'ÙƒÙŠÙ', 'Ø§Ø³ÙˆÙŠ', 'Ø·Ø±ÙŠÙ‚Ø©'],
      reply: 'ðŸ’¡ Ø¥Ø°Ø§ ÙƒÙ†Øª Ø¨Ø­Ø§Ø¬Ø© Ù„Ù„Ù…Ø³Ø§Ø¹Ø¯Ø©ØŒ ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…ØªØ§Ø­Ø© Ø£Ùˆ ÙƒØªØ§Ø¨Ø© Ø§Ø³ØªÙØ³Ø§Ø±Ùƒ Ù‡Ù†Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ø£Ùˆ Ø§Ù„ØªØ­Ø¯Ø« Ù„Ø£Ø­Ø¯ Ø§Ù„Ù…Ø´Ø±ÙÙŠÙ† Ø§Ù„Ù…ØªÙˆØ§Ø¬Ø¯ÙŠÙ†.'
    }
  ];

  /**
   * Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø±Ø¯ ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„Ø±Ø³Ø§Ù„Ø©
   */
  static findResponse(text: string): string | null {
    const cleanText = text.toLowerCase();
    for (const item of this.responses) {
      // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù…Ø·Ø§Ø¨Ù‚Ø© ÙƒØ§ÙØ© Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…ÙØªØ§Ø­ÙŠØ© ÙÙŠ Ø§Ù„Ø¬Ù…Ù„Ø©
      const matchesAll = item.keywords.every(kw => cleanText.includes(kw));
      if (matchesAll) {
        return item.reply;
      }
    }
    return null;
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… ØªØªØ¨Ø¹ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø´Ø§Ø¦Ø¹Ø© ÙˆØ§Ù„Ù…ÙˆØ§Ø¶ÙŠØ¹ Ø§Ù„Ù†Ø´Ø·Ø© (Word Frequency Tracker)
// ============================================================
const wordFrequencyMap = new Map<string, number>();

export class WordFrequencyTracker {
  /**
   * ØªØªØ¨Ø¹ Ø§Ù„ÙƒÙ„Ù…Ø© ÙˆØ²ÙŠØ§Ø¯Ø© ØªÙƒØ±Ø§Ø±Ù‡Ø§
   */
  static trackMessage(text: string): void {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 4) continue; // ØªØ¬Ø§Ù‡Ù„ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù‚ØµÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹
      const current = wordFrequencyMap.get(word) ?? 0;
      wordFrequencyMap.set(word, current + 1);
    }
  }

  /**
   * Ø¬Ù„Ø¨ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø£ÙƒØ«Ø± Ø´ÙŠÙˆØ¹Ø§Ù‹ ÙˆØªÙƒØ±Ø§Ø±Ø§Ù‹ Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±
   */
  static getTrendingWords(limit: number = 5): Array<{ word: string; count: number }> {
    const sorted = [...wordFrequencyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([word, count]) => ({ word, count }));
  }

  /**
   * ØªØµÙÙŠØ± ÙˆØªØ·Ù‡ÙŠØ± Ø°Ø§ÙƒØ±Ø© Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©
   */
  static clearCache(): void {
    wordFrequencyMap.clear();
  }
}

// ============================================================
//  ØªÙ‚Ø±ÙŠØ± Ø­Ø§Ù„Ø© Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ù…Ø§ÙŠØ© ÙˆØ§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© (AutoMod Summary Report)
// ============================================================
export class AutoModSummaryReport {
  /**
   * ØªÙˆÙ„ÙŠØ¯ ØªÙ‚Ø±ÙŠØ± ÙÙ†ÙŠ Ø´Ø§Ù…Ù„ Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª
   */
  static generateAutomatedSummary(guild: any): string {
    const totalWarns = [...warnings.values()].reduce((sum, w) => sum + w.count, 0);
    const trending = WordFrequencyTracker.getTrendingWords(3).map(w => `${w.word} (${w.count})`).join(', ');

    return `ðŸ›¡ï¸ **ØªÙ‚Ø±ÙŠØ± Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø°ÙƒÙŠ Ù„Ø®Ø§Ø¯Ù… ${guild.name}**
â€¢ Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: ${moderationLog.length} Ù…Ø®Ø§Ù„ÙØ©
â€¢ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø¹Ø¯Ø¯ Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©: ${totalWarns} ØªØ­Ø°ÙŠØ±
â€¢ Ø­Ø§Ù„Ø© ÙˆØ¶Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ© (Anti-Raid): ${AntiRaidShield.isLockdown() ? 'âš ï¸ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦' : 'âœ… Ø¢Ù…Ù† ÙˆÙ…Ø³ØªÙ‚Ø±'}
â€¢ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…ØªØ¯Ø§ÙˆÙ„Ø© Ø§Ù„Ù…ÙƒØªØ´ÙØ©: ${trending || 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ÙƒØ§ÙÙŠØ©'}
â€¢ ØªÙ… Ø§Ù„Ø§Ø³ØªØ®Ø±Ø§Ø¬ ÙÙŠ: ${new Date().toLocaleString('ar-EG')}`;
  }
}

// ============================================================
//  Ù†Ø¸Ø§Ù… ØªØ·Ù‡ÙŠØ± ÙˆØªØ­Ø³ÙŠÙ† Ø§Ù„Ù†ØµÙˆØµ Ø§Ù„Ø£Ù…Ù† (Advanced Content Sanitizer)
// ============================================================
export class AdvancedContentSanitizer {
  private static homoglyphsMap: Record<string, string> = {
    'Ð°': 'a', 'Ðµ': 'e', 'Ð¾': 'o', 'Ñ€': 'p', 'Ø³': 's', 'Ø´': 'sh',
    'Ø§': 'a', 'Ø£': 'a', 'Ø¥': 'a', 'Ø¢': 'a', 'Ù‰': 'y', 'ÙŠ': 'y',
    'Ø©': 'h', 'Ù‡': 'h'
  };

  /**
   * Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø±Ù…ÙˆØ² Ø§Ù„ØªØ¹Ø¨ÙŠØ±ÙŠØ© Ø§Ù„Ù…Ø®ÙÙŠØ© ÙˆØ§Ù„Ù…Ø³Ø§ÙØ§Øª Ø§Ù„ØµÙØ±ÙŠØ© Ù„Ù…Ù†Ø¹ ØªØ¬Ø§ÙˆØ² Ø§Ù„ÙÙ„Ø§ØªØ±
   */
  static removeZeroWidthChars(text: string): string {
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Ù…Ø³Ø­ zero-width spaces
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // Ù…Ø³Ø­ control characters
  }

  /**
   * Ù…Ø¹Ø§Ù„Ø¬Ø© ÙˆØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø­Ø±ÙˆÙ Ø§Ù„Ù…ØªØ´Ø§Ø¨Ù‡Ø© Ø¨ØµØ±ÙŠØ§Ù‹ (Homoglyphs) Ø¥Ù„Ù‰ Ù†Ø¸ÙŠØ±Ø§ØªÙ‡Ø§ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©
   */
  static normalizeHomoglyphs(text: string): string {
    let normalized = '';
    for (const char of text) {
      normalized += this.homoglyphsMap[char] ?? char;
    }
    return normalized;
  }

  /**
   * ØªØ·Ù‡ÙŠØ± Ø§Ù„Ù†Øµ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„ÙØ­Øµ Ø§Ù„Ø£Ù…Ù†ÙŠ Ø§Ù„Ø¯Ù‚ÙŠÙ‚
   */
  static sanitizeAll(text: string): string {
    const withoutZeroWidth = this.removeZeroWidthChars(text);
    return this.normalizeHomoglyphs(withoutZeroWidth).trim();
  }
}



