/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  Ø¨Ø§Ù†ÙŠ ÙˆÙ…ØµÙ…Ù… Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª Ø§Ù„Ø°ÙƒÙŠ Ø§Ù„Ù…ØªØ·ÙˆØ± - Advanced Server & Community Builder
 *  ÙŠÙ‚ÙˆÙ… Ø¨Ø¨Ù†Ø§Ø¡ Ø³ÙŠØ±ÙØ±Ø§Øª Ù…ØªÙƒØ§Ù…Ù„Ø© Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø£Ùˆ Ù‚ÙˆØ§Ù„Ø¨ Ù…Ø¹ØªÙ…Ø¯Ø©
 *  ÙŠØ¯Ø¹Ù… Ø¥Ø¯Ø§Ø±Ø© ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø© ÙˆÙ‡ÙŠØ§ÙƒÙ„ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…Ø²ÙŠÙ†Ø© Ø¨Ø§Ù„Ø¥ÙŠÙ…ÙˆØ¬ÙŠ ÙˆØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ù†Ø§Ø¡
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import {
  Guild,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  OverwriteResolvable,
  Role,
  CategoryChannel,
} from 'discord.js';
import {
  createRulesEmbed,
  createWelcomeEmbed,
} from '../utils/embed_generator.js';
import { generateAIResponse, AIMessage } from '../services/ai.js';

// ============================================================
//  Ù…Ø³Ø§Ø¹Ø¯Ø§Øª Ø§Ù„ØªØ£Ø®ÙŠØ± Ø§Ù„Ø²Ù…Ù†ÙŠ ÙˆØ§Ù„ÙˆÙ‚Øª
// ============================================================
async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
//  ÙˆØ§Ø¬Ù‡Ø§Øª Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ ÙˆÙ‡ÙŠØ§ÙƒÙ„ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª
// ============================================================
export interface ChannelBlueprint {
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  sendEmbed?: 'rules' | 'welcome' | 'info' | 'faq' | 'tickets';
  readOnly?: boolean;
  staffOnly?: boolean;
  userLimit?: number;
  rateLimitPerUser?: number; // Ø§Ù„Ø¨Ø·Ø¡ ÙÙŠ Ø§Ù„ÙƒØªØ§Ø¨Ø© (Slowmode)
}

export interface CategoryBlueprint {
  name: string;
  staffOnly?: boolean;
  channels: ChannelBlueprint[];
}

export interface RoleBlueprint {
  name: string;
  color: number;
  hoist: boolean;
  permissions: bigint[];
  mentionable?: boolean;
}

export interface ServerBlueprint {
  serverType: string;
  categories: CategoryBlueprint[];
  roles: RoleBlueprint[];
  description: string;
}

// ============================================================
//  Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ø«Ø§Ø¨ØªØ© ÙˆØ§Ù„Ù…Ø²ÙŠÙ†Ø© (Static Blueprints)
// ============================================================
export const DETAILED_BLUEPRINTS: Record<string, ServerBlueprint> = {
  gaming: {
    serverType: 'Ø³ÙŠØ±ÙØ± Ø£Ù„Ø¹Ø§Ø¨ ØªØ±ÙÙŠÙ‡ÙŠ (Gaming Server)',
    description: 'Ù‚Ø§Ù„Ø¨ Ø³ÙŠØ±ÙØ± Ø£Ù„Ø¹Ø§Ø¨ Ø§Ø­ØªØ±Ø§ÙÙŠ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ØºØ±Ù ØªÙˆØ§ØµÙ„ØŒ Ø¨Ø·ÙˆÙ„Ø§ØªØŒ ÙˆØ±ÙˆÙ…Ø§Øª ØµÙˆØªÙŠØ© Ø°Ø§Øª Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ©.',
    roles: [
      { name: 'ðŸ‘‘â”ƒØ§Ù„Ù…Ø¤Ø³Ø³', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: 'ðŸ›¡ï¸â”ƒØ§Ù„Ø¥Ø¯Ø§Ø±Ø©', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.MuteMembers] },
      { name: 'âš¡â”ƒØ§Ù„Ù…Ø´Ø±ÙÙŠÙ†', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MoveMembers] },
      { name: 'ðŸŽ–ï¸â”ƒÙ…Ù†Ø¸Ù… Ø§Ù„Ø¨Ø·ÙˆÙ„Ø§Øª', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone] },
      { name: 'ðŸŽ®â”ƒÙ„Ø§Ø¹Ø¨ Ù…Ø­ØªØ±Ù', color: 0x1ABC9C, hoist: true, permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Speak] },
      { name: 'ðŸ‘¤â”ƒÙ„Ø§Ø¹Ø¨ÙŠÙ† Ø§Ù„Ø³ÙŠØ±ÙØ±', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ],
    categories: [
      {
        name: 'ðŸ“¢â”ƒØ§Ù„ØªØ±Ø­ÙŠØ¨ ÙˆØ§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª',
        channels: [
          { name: 'ðŸ“‹â”ƒØ§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: 'ðŸ“¢â”ƒØ§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª', type: 'text', readOnly: true },
          { name: 'ðŸ‘‹â”ƒØ§Ù„ØªØ±Ø­ÙŠØ¨-ÙˆØ§Ù„ØªÙˆØ¯ÙŠØ¹', type: 'text', sendEmbed: 'welcome', readOnly: true },
          { name: 'ðŸ†â”ƒØ§Ù„Ø¨Ø·ÙˆÙ„Ø§Øª-ÙˆØ§Ù„ÙØ§Ø¦Ø²ÙŠÙ†', type: 'text', readOnly: true }
        ]
      },
      {
        name: 'ðŸ’¬â”ƒØ§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ø¹Ø§Ù…Ø©',
        channels: [
          { name: 'ðŸ’¬â”ƒØ´Ø§Øª-Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨', type: 'text', topic: 'Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø£ÙÙƒØ§Ø±' },
          { name: 'ðŸ–¼ï¸â”ƒÙ…ÙŠØ¯ÙŠØ§-ÙˆÙ„Ù‚Ø·Ø§Øª-Ø§Ù„Ø´Ø§Ø´Ø©', type: 'text', topic: 'Ø´Ø§Ø±ÙƒÙ†Ø§ ØµÙˆØ± Ù„Ù‚Ø·Ø§Øª Ù„Ø¹Ø¨Ùƒ ÙˆØ§Ù„Ø¬Ù„Ø¯' },
          { name: 'ðŸ¤–â”ƒØ£ÙˆØ§Ù…Ø±-Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨', type: 'text', rateLimitPerUser: 3 },
          { name: 'ðŸ’¡â”ƒØ§Ù‚ØªØ±Ø§Ø­Ø§Øª-Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡', type: 'text', rateLimitPerUser: 5 }
        ]
      },
      {
        name: 'ðŸŽ™ï¸â”ƒØ§Ù„Ø±ÙˆÙ…Ø§Øª Ø§Ù„ØµÙˆØªÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©',
        channels: [
          { name: 'ðŸ”Šâ”ƒØµÙˆØªÙŠ-Ø¹Ø§Ù…-1', type: 'voice', userLimit: 15 },
          { name: 'ðŸ”Šâ”ƒØµÙˆØªÙŠ-Ø¹Ø§Ù…-2', type: 'voice', userLimit: 15 },
          { name: 'ðŸŽ™ï¸â”ƒØ§Ø³ØªØ±Ø§Ø­Ø©-Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡', type: 'voice', userLimit: 5 }
        ]
      },
      {
        name: 'ðŸŽ®â”ƒØ±ÙˆÙ…Ø§Øª Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨ Ø§Ù„ØªÙ†Ø§ÙØ³ÙŠØ©',
        channels: [
          { name: 'âš”ï¸â”ƒÙØ§Ù„ÙˆØ±Ø§Ù†Øª-Squad', type: 'voice', userLimit: 5 },
          { name: 'ðŸš—â”ƒÙ‚Ø±Ø§Ù†Ø¯-GTA-V', type: 'voice', userLimit: 10 },
          { name: 'â›ï¸â”ƒÙ…Ø§ÙŠÙ†ÙƒØ±Ø§ÙØª-Craft', type: 'voice', userLimit: 20 },
          { name: 'ðŸ”«â”ƒØ¨Ø¨Ø¬ÙŠ-PUBG', type: 'voice', userLimit: 4 }
        ]
      },
      {
        name: 'ðŸ›¡ï¸â”ƒØ§Ù„Ø¥Ø´Ø±Ø§Ù ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø©',
        staffOnly: true,
        channels: [
          { name: 'ðŸ“Šâ”ƒØºØ±ÙØ©-Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©', type: 'text', staffOnly: true },
          { name: 'ðŸ“â”ƒØ³Ø¬Ù„Ø§Øª-Ø§Ù„Ø±Ù‚Ø§Ø¨Ø©', type: 'text', staffOnly: true },
          { name: 'ðŸŽ™ï¸â”ƒØ§Ø¬ØªÙ…Ø§Ø¹-Ø§Ù„Ø³ØªØ§Ù', type: 'voice', staffOnly: true }
        ]
      }
    ]
  },
  store: {
    serverType: 'Ù…ØªØ¬Ø± ØªØ¬Ø§Ø±ÙŠ (Online Store Server)',
    description: 'Ù‚Ø§Ù„Ø¨ Ù…ØªØ¬Ø± Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ø¨ÙŠØ¹ Ø§Ù„Ø³Ù„Ø¹ Ø£Ùˆ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ù…Ø¹ Ø±ÙˆÙ…Ø§Øª Ù…Ø®ØµØµØ© Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„ØªØ°Ø§ÙƒØ± Ø§Ù„Ù…Ø¶Ù…ÙˆÙ†Ø©.',
    roles: [
      { name: 'ðŸ‘‘â”ƒØµØ§Ø­Ø¨ Ø§Ù„Ù…ØªØ¬Ø±', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: 'ðŸ’¼â”ƒØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
      { name: 'ðŸ¤â”ƒØ®Ø¯Ù…Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers] },
      { name: 'ðŸ’Žâ”ƒØ¹Ù…ÙŠÙ„ ÙÙŠ Ø¢ÙŠ Ø¨ÙŠ', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: 'ðŸ‘¤â”ƒØ²Ø¨Ø§Ø¦Ù† Ø§Ù„Ø³ÙŠØ±ÙØ±', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ],
    categories: [
      {
        name: 'â„¹ï¸â”ƒÙ…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…ØªØ¬Ø±',
        channels: [
          { name: 'ðŸ“‹â”ƒØ§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†-ÙˆØ§Ù„Ø´Ø±ÙˆØ·', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: 'ðŸ“¢â”ƒØ¥Ø¹Ù„Ø§Ù†Ø§Øª-Ø§Ù„Ù…ØªØ¬Ø±', type: 'text', readOnly: true },
          { name: 'â­â”ƒØ¢Ø±Ø§Ø¡-ÙˆØªÙ‚ÙŠÙŠÙ…-Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡', type: 'text', topic: 'Ø´Ø§Ø±ÙƒÙ†Ø§ Ø±Ø£ÙŠÙƒ Ø¨Ø§Ù„Ø®Ø¯Ù…Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø´Ø±Ø§Ø¡' },
          { name: 'ðŸ’³â”ƒØ·Ø±Ù‚-Ø§Ù„Ø¯ÙØ¹-ÙˆØ§Ù„Ø´Ø­Ù†', type: 'text', readOnly: true }
        ]
      },
      {
        name: 'ðŸ›’â”ƒØ£Ù‚Ø³Ø§Ù… Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ø¹Ø±ÙˆØ¶Ø©',
        channels: [
          { name: 'ðŸŽâ”ƒØ¹Ø±ÙˆØ¶-Ø§Ù„ÙŠÙˆÙ…', type: 'text', readOnly: true },
          { name: 'ðŸŽ®â”ƒØ­Ø³Ø§Ø¨Ø§Øª-Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨', type: 'text', readOnly: true },
          { name: 'ðŸ’Žâ”ƒØ§Ø´ØªØ±Ø§ÙƒØ§Øª-ÙˆØ´Ø­Ù†Ø§Øª', type: 'text', readOnly: true },
          { name: 'ðŸ“±â”ƒØ£ÙƒÙˆØ§Ø¯-ÙˆØ¨Ø±Ù…Ø¬ÙŠØ§Øª', type: 'text', readOnly: true }
        ]
      },
      {
        name: 'ðŸ“©â”ƒÙ‚Ø³Ù… Ø§Ù„Ø´Ø±Ø§Ø¡ ÙˆÙØªØ­ ØªØ°Ø§ÙƒØ±',
        channels: [
          { name: 'ðŸŽŸï¸â”ƒØ·Ù„Ø¨-Ø´Ø±Ø§Ø¡-Ø¬Ø¯ÙŠØ¯', type: 'text', sendEmbed: 'tickets', topic: 'Ø§ÙØªØ­ ØªØ°ÙƒØ±Ø© Ø´Ø±Ø§Ø¡ Ù‡Ù†Ø§ Ù„Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¯Ø¹Ù…' },
          { name: 'ðŸ’¬â”ƒØ§Ù„Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø¹Ø§Ù…Ø©', type: 'text' },
          { name: 'â“â”ƒØ£Ø³Ø¦Ù„Ø©-Ø´Ø§Ø¦Ø¹Ø©-FAQ', type: 'text', readOnly: true }
        ]
      },
      {
        name: 'ðŸ’¼â”ƒÙØ±ÙŠÙ‚ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„Ù…Ø§Ù„ÙŠØ©',
        staffOnly: true,
        channels: [
          { name: 'ðŸ“Šâ”ƒÙ„ÙˆØ­Ø©-Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª', type: 'text', staffOnly: true },
          { name: 'ðŸ’°â”ƒØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±-Ø§Ù„Ù…Ø§Ù„ÙŠØ©', type: 'text', staffOnly: true },
          { name: 'ðŸŽ™ï¸â”ƒÙ†Ù‚Ø§Ø´-Ø§Ù„Ø³ØªØ§Ù', type: 'voice', staffOnly: true }
        ]
      }
    ]
  },
  clan: {
    serverType: 'ÙƒÙ„Ø§Ù† ÙˆÙØ±ÙŠÙ‚ Ù…Ù†Ø§ÙØ³ (Clan / Esports Server)',
    description: 'Ø³ÙŠØ±ÙØ± ØªÙƒØªÙŠÙƒÙŠ Ù„Ù„ÙØ±Ù‚ Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© ÙˆØ§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© ÙŠØ¯Ø¹Ù… Ø§Ù„ØªØ®Ø·ÙŠØ· ÙˆØ§Ù„Ø§Ø³ØªÙ…Ø§Ø¹ ÙˆØ±ÙˆÙ…Ø§Øª Ù…ØºÙ„Ù‚Ø© Ù„Ù„ØªØ¯Ø±ÙŠØ¨.',
    roles: [
      { name: 'ðŸ‘‘â”ƒÙ‚Ø§Ø¦Ø¯ Ø§Ù„ÙƒÙ„Ø§Ù†', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: 'ðŸ›¡ï¸â”ƒÙ†Ø§Ø¦Ø¨ Ø§Ù„Ù‚Ø§Ø¦Ø¯', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers] },
      { name: 'ðŸŽ¯â”ƒÙƒØ§Ø¨ØªÙ† Ø§Ù„ÙØ±ÙŠÙ‚', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Speak] },
      { name: 'â­â”ƒØ§Ù„Ù„Ø§Ø¹Ø¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ', color: 0x1ABC9C, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: 'ðŸŽ–ï¸â”ƒØ§Ù„Ø§Ø­ØªÙŠØ§Ø·', color: 0x34495E, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: 'ðŸ‘¤â”ƒÙ…Ø´Ø¬Ø¹ÙŠÙ† Ø§Ù„ÙƒÙ„Ø§Ù†', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel] }
    ],
    categories: [
      {
        name: 'ðŸ“¢â”ƒØ§Ù„Ù…Ø±ÙƒØ² Ø§Ù„Ø¥Ø¹Ù„Ø§Ù…ÙŠ Ù„Ù„ÙƒÙ„Ø§Ù†',
        channels: [
          { name: 'ðŸ“‹â”ƒØªØ¹Ù„ÙŠÙ…Ø§Øª-Ø§Ù„ÙƒÙ„Ø§Ù†', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: 'ðŸ“¢â”ƒØ£Ø®Ø¨Ø§Ø±-ÙˆØªØ­Ø¯ÙŠØ«Ø§Øª', type: 'text', readOnly: true },
          { name: 'ðŸ‘‹â”ƒÙ…Ø´Ø¬Ø¹ÙŠÙ†-Ø¬Ø¯Ø¯', type: 'text', sendEmbed: 'welcome', readOnly: true }
        ]
      },
      {
        name: 'ðŸ’¬â”ƒØ§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø¹Ø§Ù… Ù„Ù„Ø¯Ø±Ø¯Ø´Ø©',
        channels: [
          { name: 'ðŸ’¬â”ƒØ´Ø§Øª-Ø§Ù„Ù…Ø´Ø¬Ø¹ÙŠÙ†', type: 'text' },
          { name: 'ðŸ†â”ƒØ¥Ù†Ø¬Ø§Ø²Ø§Øª-Ø§Ù„ÙØ±ÙŠÙ‚', type: 'text', readOnly: true },
          { name: 'ðŸ¤–â”ƒØ£ÙˆØ§Ù…Ø±-Ø§Ù„ÙƒÙ„Ø§Ù†', type: 'text' }
        ]
      },
      {
        name: 'ðŸŽ¯â”ƒØºØ±ÙØ© Ø§Ù„ØªØ¯Ø±ÙŠØ¨ ÙˆØ§Ù„ØªØ­Ø¶ÙŠØ±',
        channels: [
          { name: 'ðŸ“Šâ”ƒØ§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ§Øª-ÙˆØªÙƒØªÙŠÙƒ', type: 'text', staffOnly: true },
          { name: 'ðŸŽ™ï¸â”ƒÙÙˆÙŠØ³-Ø§Ù„ØªØ¯Ø±ÙŠØ¨-Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ', type: 'voice', userLimit: 5 },
          { name: 'ðŸŽ™ï¸â”ƒÙÙˆÙŠØ³-Ø§Ù„ØªØ¯Ø±ÙŠØ¨-Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ', type: 'voice', userLimit: 5 },
          { name: 'ðŸ”Šâ”ƒØ§Ø³ØªØ±Ø§Ø­Ø©-ÙØ±ÙŠÙ‚-Ø§Ù„ÙƒÙ„Ø§Ù†', type: 'voice', userLimit: 10 }
        ]
      },
      {
        name: 'ðŸ›¡ï¸â”ƒØ´Ø¤ÙˆÙ† Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„ÙƒÙ„Ø§Ù†',
        staffOnly: true,
        channels: [
          { name: 'ðŸ“Šâ”ƒØ´Ø§Øª-Ø§Ù„Ù‚Ø§Ø¯Ø©', type: 'text', staffOnly: true },
          { name: 'ðŸ“â”ƒÙ…Ø­Ø¶Ø±-Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹Ø§Øª', type: 'text', staffOnly: true }
        ]
      }
    ]
  }
};

// ============================================================
//  Ø¨Ù†Ø§Ø¡ ÙˆØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø¨Ù„ÙˆØ¨Ø±ÙŠÙ†Øª Ø§Ù„Ù…Ø®ØµØµ Ø¹Ø¨Ø± Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
// ============================================================
async function generateBlueprintWithAI(description: string, guildName: string): Promise<ServerBlueprint> {
  const prompt = `Ø£Ù†Øª Ù…ØµÙ…Ù… Ø³ÙŠØ±ÙØ±Ø§Øª Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ø®Ø¨ÙŠØ± ÙˆÙ…ØµÙ…Ù… Ù…Ø¬ØªÙ…Ø¹Ø§Øª Ø®Ø§Ø±Ù‚.
Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙŠØ±ÙŠØ¯ Ø¥Ù†Ø´Ø§Ø¡ Ø³ÙŠØ±ÙØ± Ø¨Ù‡Ø°Ø§ Ø§Ù„ÙˆØµÙ Ø§Ù„Ù„ØºÙˆÙŠ: "${description}"

Ø§Ø³Ù… Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ø­Ø§Ù„ÙŠ: "${guildName}"

Ù‚Ù… Ø¨ØªØµÙ…ÙŠÙ… Ø³ÙŠØ±ÙØ± Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ù…ØªÙƒØ§Ù…Ù„ ÙˆØ¬Ù…ÙŠÙ„ ÙˆÙ…Ù†Ø¸Ù… Ù„Ù„ØºØ§ÙŠØ©. Ø£Ø¬Ø¨ Ø¨Ù€ JSON ÙÙ‚Ø· Ø¨Ù‡Ø°Ø§ Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¯Ù‚ÙŠÙ‚:

{
  "serverType": "Ø§Ø³Ù… Ù†ÙˆØ¹ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©",
  "description": "ÙˆØµÙ Ù…Ø®ØªØµØ± Ù„Ù„Ø¬Ù…Ù‡ÙˆØ± ÙˆØ§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ù…Ù‚ØªØ±Ø­",
  "categories": [
    {
      "name": "Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø© Ù…Ø¹ Ø¥ÙŠÙ…ÙˆØ¬ÙŠ Ù…Ù…ÙŠØ² Ù…ØªÙ†Ø§Ø³Ù‚",
      "staffOnly": false,
      "channels": [
        {
          "name": "Ø§Ø³Ù… Ø§Ù„Ù‚Ù†Ø§Ø© Ù…Ø¹ Ø¥ÙŠÙ…ÙˆØ¬ÙŠ ÙŠÙØµÙ„ Ø¨ÙŠÙ†Ù‡Ù…Ø§ Ø´Ø±Ø·Ø© Ø£Ùˆ Ø±Ù…Ø²",
          "type": "text",
          "topic": "ÙˆØµÙ Ø¯Ù‚ÙŠÙ‚ Ù„Ù…ÙˆØ¶ÙˆØ¹ Ø§Ù„Ù‚Ù†Ø§Ø© ÙˆÙ…Ø±Ø§Ø¯ ÙƒØªØ§Ø¨ØªÙ‡ ÙÙŠÙ‡Ø§",
          "sendEmbed": "rules",
          "readOnly": false,
          "staffOnly": false
        }
      ]
    }
  ],
  "roles": [
    {
      "name": "Ø§Ø³Ù… Ø§Ù„Ø±ØªØ¨Ø© Ù…Ø¹ Ø¥ÙŠÙ…ÙˆØ¬ÙŠ Ø¬Ø°Ø§Ø¨",
      "color": 16766720,
      "hoist": true,
      "mentionable": false
    }
  ]
}

Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¨Ù†Ø§Ø¡ ÙˆØ§Ù„ØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ø¥Ø¬Ø¨Ø§Ø±ÙŠØ©:
1. Ø§Ù„ÙØ¦Ø§Øª ÙˆØ§Ù„Ù‚Ù†ÙˆØ§Øª Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆÙ…Ø²ÙŠÙ†Ø© Ø¨Ø±Ù…ÙˆØ² ØªØ¹Ø¨ÙŠØ±ÙŠØ© Ø±Ø§Ù‚ÙŠØ© ÙˆÙ…ØªØ·Ø§Ø¨Ù‚Ø© (Ù…Ø«Ù„: ðŸ“‹â”ƒØ§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†ØŒ ðŸ’¬â”ƒØ§Ù„Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø¹Ø§Ù…Ø©).
2. Ø£ÙˆÙ„ ÙØ¦Ø© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† ÙØ¦Ø© Ø§Ù„ØªØ±Ø­ÙŠØ¨ ÙˆØ§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©. ÙˆØ§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ ÙÙŠÙ‡Ø§ ØªØ­Ù…Ù„ Ø®ÙŠØ§Ø± (sendEmbed: "rules") ÙˆÙ‚Ù†Ø§Ø© Ø§Ù„ØªØ±Ø­ÙŠØ¨ (sendEmbed: "welcome").
3. Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ† ÙˆØ§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† (readOnly: true) Ù„ØªÙØ§Ø¯ÙŠ Ø§Ù„ÙÙˆØ¶Ù‰.
4. Ø§Ù„Ø³ÙŠØ±ÙØ± ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ÙØ¦Ø© Ø®Ø§ØµØ© Ø¨Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆÙØ±ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ ØªÙƒÙˆÙ† (staffOnly: true).
5. ØµÙ…Ù… Ù…Ø§ Ø¨ÙŠÙ† 4 Ø¥Ù„Ù‰ 6 ÙØ¦Ø§Øª Ø±Ø¦ÙŠØ³ÙŠØ©ØŒ ÙˆÙ…Ø§ Ø¨ÙŠÙ† 3 Ø¥Ù„Ù‰ 5 Ù‚Ù†ÙˆØ§Øª Ø¯Ø§Ø®Ù„ ÙƒÙ„ ÙØ¦Ø© Ù„ØªØ£Ù…ÙŠÙ† Ø³ÙŠØ±ÙØ± ØºÙ†ÙŠ.
6. ØµÙ…Ù… Ù…Ø§ Ø¨ÙŠÙ† 4 Ø¥Ù„Ù‰ 8 Ø±ØªØ¨ Ø¥Ø¯Ø§Ø±ÙŠØ© ÙˆØ§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© Ù…Ù„ÙˆÙ†Ø© Ù…ØªÙ†Ø§Ø³Ù‚Ø©. Ø§Ù„Ø£Ù„ÙˆØ§Ù† Ø§Ù„Ù…ÙƒØªÙˆØ¨Ø© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø£Ø±Ù‚Ø§Ù… Ø¹Ø´Ø±ÙŠØ© ØµØ­ÙŠØ­Ø© (Decimal) ØªÙ…Ø«Ù„ ÙƒÙˆØ¯ Ø§Ù„Ù„ÙˆÙ† Hex (Ù…Ø«Ø§Ù„: Ø§Ù„Ø°Ù‡Ø¨ÙŠ #FFD700 ÙŠØªÙ… ÙƒØªØ§Ø¨ØªÙ‡ ÙƒÙ€ 16766720).
7. Ù„Ø§ ØªØ¶Ø¹ Ù…Ø³Ø§ÙØ§Øª ÙÙŠ Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù†ØµÙŠØ© ÙˆØ§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø´Ø±Ø·Ø© (-) Ø¯Ø§Ø¦Ù…Ø§Ù‹ Ù„Ù„ÙØµÙ„ Ø¨ÙŠÙ† Ø§Ù„ÙƒÙ„Ù…Ø§Øª.
8. Ù†ÙˆØ¹ Ø§Ù„Ù‚Ù†Ø§Ø© Ø¥Ù…Ø§ "text" Ø£Ùˆ "voice" ÙÙ‚Ø·.
9. ÙØ¦Ø© Ø§Ù„ØµÙˆØªÙŠØ§Øª ÙˆØ§Ù„Ø¯Ø±Ø¯Ø´Ø§Øª Ø§Ù„ØµÙˆØªÙŠØ© ÙŠØ¬Ø¨ Ø£Ù† ØªØ¶Ù… Ù‚Ù†ÙˆØ§Øª ØµÙˆØªÙŠØ© (type: "voice") ÙÙ‚Ø·.

Ø£Ø¬Ø¨ Ø¨Ø§Ù„Ù€ JSON ÙÙ‚Ø· Ø¯ÙˆÙ† ÙˆØ¶Ø¹ Ø£ÙŠ Ù†ØµÙˆØµ Ø£Ùˆ ØªØ¹Ù„ÙŠÙ‚Ø§Øª Ø¨Ø±Ù…Ø¬ÙŠØ© Ø®Ø§Ø±Ø¬ Ù‡ÙŠÙƒÙ„ Ø§Ù„Ù€ JSON Ù„ÙƒÙŠ Ù„Ø§ ÙŠÙ†ÙƒØ³Ø± Ù…Ø­Ø±Ùƒ ÙÙƒ Ø§Ù„ØªØ±Ù…ÙŠØ².`;

  try {
    const aiMessage = await generateAIResponse(
      [{ role: 'user', content: prompt } as AIMessage],
      {
        intent: 'smart',
        systemPrompt: 'أنت مصمم سيرفرات ديسكورد محترف وتجيب بـ JSON فقط.',
        toolsEnabled: false,
        temperature: 0.7,
        maxTokens: 3000,
      }
    );
    const content = aiMessage.content?.trim() ?? '';

    // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø¬ÙŠØ³ÙˆÙ† Ù…Ù† Ø§Ù„Ø±Ø¯
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON match found in AI response text');

    const blueprint = JSON.parse(jsonMatch[0]) as ServerBlueprint;
    console.log(`[Builder] AI Blueprint successfully generated: ${blueprint.serverType}`);
    return blueprint;
  } catch (err) {
    console.error('[Builder] AI generation failed, falling back to static blueprint or template...', err);
    return getDefaultBlueprint(description);
  }
}

// ============================================================
//  Ø§Ù„Ø¨Ù„ÙˆØ¨Ø±ÙŠÙ†Øª Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ (Fallback Blueprint)
// ============================================================
export function getDefaultBlueprint(description: string): ServerBlueprint {
  // Ù…Ø·Ø§Ø¨Ù‚Ø© ØªÙØ§ØµÙŠÙ„ Ø¨Ø³ÙŠØ·Ø© Ù„Ù„Ø§Ø®ØªÙŠØ§Ø±
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('Ù‚ÙŠÙ…Ù†Ù‚') || lowerDesc.includes('Ù„Ø¹Ø¨') || lowerDesc.includes('Ø§Ù„Ø¹Ø§Ø¨') || lowerDesc.includes('gaming')) {
    return DETAILED_BLUEPRINTS.gaming;
  }
  if (lowerDesc.includes('Ù…ØªØ¬Ø±') || lowerDesc.includes('Ø¨ÙŠØ¹') || lowerDesc.includes('Ø´ÙˆØ¨') || lowerDesc.includes('store')) {
    return DETAILED_BLUEPRINTS.store;
  }
  if (lowerDesc.includes('ÙƒÙ„Ø§Ù†') || lowerDesc.includes('ØªÙŠÙ…') || lowerDesc.includes('ÙØ±ÙŠÙ‚') || lowerDesc.includes('clan')) {
    return DETAILED_BLUEPRINTS.clan;
  }

  // Ù‚Ø§Ù„Ø¨ Ù…Ø¬ØªÙ…Ø¹ÙŠ Ø§ÙØªØ±Ø§Ø¶ÙŠ Ù…ØªÙƒØ§Ù…Ù„
  return {
    serverType: description,
    description: `Ø³ÙŠØ±ÙØ± Ù…Ø¬ØªÙ…Ø¹ÙŠ Ø°ÙƒÙŠ Ù…Ø®ØµØµ Ù„Ù„Ø¯Ø±Ø¯Ø´Ø© ÙˆØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø£ÙÙƒØ§Ø± Ù„Ù€: ${description}`,
    categories: [
      {
        name: 'ðŸ“¢â”ƒØ§Ù„ØªØ±Ø­ÙŠØ¨ ÙˆØ§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',
        channels: [
          { name: 'ðŸ“‹â”ƒØ§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†-ÙˆØ§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: 'ðŸ“¢â”ƒØ¥Ø¹Ù„Ø§Ù†Ø§Øª-Ø§Ù„Ø®Ø§Ø¯Ù…', type: 'text', readOnly: true },
          { name: 'ðŸ‘‹â”ƒØ§Ù„ØªØ±Ø­ÙŠØ¨-Ø¨Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡', type: 'text', sendEmbed: 'welcome', readOnly: true },
        ],
      },
      {
        name: 'ðŸ’¬â”ƒØ§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹',
        channels: [
          { name: 'ðŸ’¬â”ƒØ§Ù„Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø¹Ø§Ù…Ø©', type: 'text', topic: 'Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø³ÙˆØ§Ù„Ù ÙˆØ§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„ÙƒÙ„ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡' },
          { name: 'ðŸ–¼ï¸â”ƒØ§Ù„ØµÙˆØ±-ÙˆØ§Ù„Ù…ÙŠØ¯ÙŠØ§', type: 'text', topic: 'Ø´Ø§Ø±ÙƒÙ†Ø§ Ø¥Ø¨Ø¯Ø§Ø¹Ø§ØªÙƒ ÙˆØµÙˆØ±Ùƒ Ø§Ù„ÙŠÙˆÙ…ÙŠØ©' },
          { name: 'ðŸ¤–â”ƒØ£ÙˆØ§Ù…Ø±-Ø§Ù„Ø¨ÙˆØªØ§Øª', type: 'text', topic: 'Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø¨ÙˆØªØ§Øª Ø§Ù„ØªØ±ÙÙŠÙ‡ÙŠØ© ÙˆØ§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠØ©' },
        ],
      },
      {
        name: 'ðŸŽ™ï¸â”ƒØ§Ù„ØµØ§Ù„ÙˆÙ†Ø§Øª Ø§Ù„ØµÙˆØªÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©',
        channels: [
          { name: 'ðŸŽ¤â”ƒØ¯ÙŠÙˆØ§Ù†ÙŠØ©-Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡', type: 'voice', userLimit: 20 },
          { name: 'ðŸŽµâ”ƒØ¬Ù„Ø³Ø©-Ù…ÙˆØ³ÙŠÙ‚Ù‰-ÙˆØ·Ø±Ø¨', type: 'voice', userLimit: 10 },
          { name: 'ðŸŽ™ï¸â”ƒØºØ±ÙØ©-Ø´Ø®ØµÙŠÙ†-ÙÙ‚Ø·', type: 'voice', userLimit: 2 },
        ],
      },
      {
        name: 'ðŸ›¡ï¸â”ƒØºØ±ÙØ© ÙØ±ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„',
        staffOnly: true,
        channels: [
          { name: 'ðŸ“Šâ”ƒØ¥Ø¯Ø§Ø±Ø©-Ø§Ù„Ø®Ø§Ø¯Ù…', type: 'text', staffOnly: true },
          { name: 'ðŸ“â”ƒØ³Ø¬Ù„-Ø§Ù„Ø±Ù‚Ø§Ø¨Ø©-ÙˆØ§Ù„Ø£Ø¹Ø·Ø§Ù„', type: 'text', staffOnly: true },
        ],
      },
    ],
    roles: [
      { name: 'ðŸ‘‘â”ƒØ§Ù„Ù…Ø¤Ø³Ø³', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: 'ðŸ›¡ï¸â”ƒØ§Ù„Ø¥Ø¯Ø§Ø±Ø©', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
      { name: 'âš¡â”ƒØ§Ù„Ù…Ø´Ø±ÙÙŠÙ†', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers] },
      { name: 'ðŸ‘¤â”ƒØ¹Ø¶Ùˆ Ø§Ù„Ø³ÙŠØ±ÙØ±', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  };
}

// ============================================================
//  Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ø¨Ø´ÙƒÙ„ ÙƒØ§Ù…Ù„
// ============================================================
async function clearExistingChannels(guild: Guild, protectedId: string, log: string[]): Promise<void> {
  const toDelete = guild.channels.cache.filter((ch) => ch.id !== protectedId);
  let count = 0;
  for (const [, ch] of toDelete) {
    try {
      await ch.delete('Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨Ù†Ø§Ø¡ ÙˆØ§Ù„ØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ø´Ø§Ù…Ù„ - Opus Bot');
      count++;
      await delay(250);
    } catch (e: any) {
      console.warn(`[Builder] ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ù‚Ù†Ø§Ø© ${ch.name}: ${e.message}`);
    }
  }
  log.push(`ðŸ—‘ï¸ ØªÙ… Ù…Ø³Ø­ ÙˆØªÙ†Ø¸ÙŠÙ ${count} Ù‚Ù†Ø§Ø©/ÙØ¦Ø© Ø³Ø§Ø¨Ù‚Ø© Ø¨Ù†Ø¬Ø§Ø­.`);
}

// ============================================================
//  Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© ÙˆØªØ¬Ù†Ø¨ Ø­Ø°Ù Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø§Ù„Ø¹Ù„ÙŠØ§
// ============================================================
async function clearExistingRoles(guild: Guild, log: string[]): Promise<void> {
  const botPos = guild.members.me?.roles.highest.position ?? 0;
  const toDelete = guild.roles.cache.filter(
    (r) => !r.managed && r.id !== guild.id && r.position < botPos
  );
  let count = 0;
  for (const [, r] of toDelete) {
    try {
      await r.delete('ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø±ØªØ¨ ÙˆØ¨Ù†Ø§Ø¡ Ø§Ù„Ø³ÙŠØ±ÙØ± - Opus Bot');
      count++;
      await delay(250);
    } catch (e: any) {
      console.warn(`[Builder] ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø±ØªØ¨Ø© ${r.name}: ${e.message}`);
    }
  }
  log.push(`ðŸ—‘ï¸ ØªÙ… ØªÙ†Ø¸ÙŠÙ ${count} Ø±ØªØ¨Ø© Ø³Ø§Ø¨Ù‚Ø© Ø¨Ù†Ø¬Ø§Ø­.`);
}

// ============================================================
//  Ø¥Ù†Ø´Ø§Ø¡ Ø±ØªØ¨ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙˆÙ‡ÙŠÙƒÙ„ØªÙ‡Ø§
// ============================================================
async function buildRoles(guild: Guild, roleBlueprints: RoleBlueprint[], log: string[]): Promise<Map<string, Role>> {
  const created = new Map<string, Role>();

  // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ØªØ¨ ØªÙ†Ø§Ø²Ù„ÙŠØ§Ù‹ Ù„Ø¶Ù…Ø§Ù† ØªØ±ØªÙŠØ¨ Ø§Ù„Ù‡Ø±Ù… Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„ØµØ­ÙŠØ­
  for (let i = roleBlueprints.length - 1; i >= 0; i--) {
    const rb = roleBlueprints[i];
    try {
      let perms = BigInt(0);
      if (rb.permissions) {
        for (const p of rb.permissions) perms |= BigInt(p);
      }

      const role = await guild.roles.create({
        name: rb.name,
        color: rb.color ?? 0x99AAB5,
        hoist: rb.hoist ?? false,
        mentionable: rb.mentionable ?? false,
        permissions: perms,
        reason: 'Ø¨Ù†Ø§Ø¡ Ø±ØªØ¨ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯ - Opus Bot',
      });

      created.set(rb.name, role);
      log.push(`  âœ… ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ØªØ¨Ø©: ${rb.name}`);
      await delay(300);
    } catch (err: any) {
      log.push(`  âŒ ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ØªØ¨Ø© ${rb.name}: ${err.message}`);
    }
  }
  return created;
}

// ============================================================
//  ØªØµÙÙŠØ© Ø±ØªØ¨ ÙØ±ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø©
// ============================================================
function getStaffRoles(allRoles: Map<string, Role>, blueprint: ServerBlueprint): Role[] {
  // Ø£ÙˆÙ„ Ø±ØªØ¨ØªÙŠÙ† ÙÙŠ Ø§Ù„ØªØ±ØªÙŠØ¨ Ù†Ø¹ØªØ¨Ø±Ù‡Ù…Ø§ Ø±ØªØ¨ Ø·Ø§Ù‚Ù… Ø§Ù„Ø¹Ù…Ù„ ÙˆØ§Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠÙ†
  const roleNames = blueprint.roles.slice(0, 2).map((r) => r.name);
  return roleNames.map((n) => allRoles.get(n)).filter(Boolean) as Role[];
}

// ============================================================
//  Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ¦Ø§Øª ÙˆÙ‚Ù†ÙˆØ§ØªÙ‡Ø§ ÙˆØ¥Ø¹Ø¯Ø§Ø¯ ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© ÙˆØ§Ù„ÙƒØªØ§Ø¨Ø©
// ============================================================
async function buildCategoriesAndChannels(
  guild: Guild,
  blueprint: ServerBlueprint,
  staffRoles: Role[],
  log: string[]
): Promise<void> {
  for (const catBp of blueprint.categories) {
    const catPerms: OverwriteResolvable[] = [];
    
    // Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø®Ø§ØµØ© Ø¨Ù€ StaffOnly
    if (catBp.staffOnly) {
      catPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
      for (const sr of staffRoles) {
        catPerms.push({
          id: sr.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }
    }

    let category: CategoryChannel;
    try {
      category = await guild.channels.create({
        name: catBp.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: catPerms.length > 0 ? catPerms : undefined,
        reason: 'Ø¨Ù†Ø§Ø¡ ÙØ¦Ø§Øª Ø§Ù„Ø³ÙŠØ±ÙØ± - Opus Bot',
      }) as CategoryChannel;
      log.push(`ðŸ“ ÙØ¦Ø©: ${catBp.name}`);
      await delay(300);
    } catch (err: any) {
      log.push(`âŒ ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ ÙØ¦Ø© ${catBp.name}: ${err.message}`);
      continue;
    }

    for (const chBp of catBp.channels) {
      const chPerms: OverwriteResolvable[] = [];

      if (catBp.staffOnly || chBp.staffOnly) {
        chPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
        for (const sr of staffRoles) {
          chPerms.push({
            id: sr.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          });
        }
      } else if (chBp.readOnly) {
        chPerms.push({
          id: guild.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        });
      }

      try {
        const channelType = chBp.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;

        const ch = await guild.channels.create({
          name: chBp.name,
          type: channelType,
          parent: category.id,
          topic: chBp.topic,
          userLimit: chBp.userLimit,
          rateLimitPerUser: chBp.rateLimitPerUser,
          permissionOverwrites: chPerms.length > 0 ? chPerms : undefined,
          reason: 'Ø¨Ù†Ø§Ø¡ Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø³ÙŠØ±ÙØ± - Opus Bot',
        });

        log.push(`  âœ… ${chBp.type === 'voice' ? 'ðŸ”Š' : 'ðŸ’¬'} ${chBp.name}`);
        await delay(250);

        // Ø¥Ø±Ø³Ø§Ù„ ÙƒØ±ÙˆØª Ø§Ù„ØªØ±Ø­ÙŠØ¨ ÙˆØ§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†
        if (chBp.sendEmbed && chBp.type === 'text') {
          try {
            const textCh = ch as TextChannel;
            if (chBp.sendEmbed === 'rules') {
              const embeds = createRulesEmbed();
              const rulesEmbeds = Array.isArray(embeds) ? embeds : [embeds];
              for (const e of rulesEmbeds) {
                await textCh.send({ embeds: [e] });
                await delay(250);
              }
              log.push(`    ðŸ“œ ØªÙ… ØªØ¹ÙŠÙŠÙ† Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ† ÙˆØ§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©.`);
            } else if (chBp.sendEmbed === 'welcome') {
              const e = createWelcomeEmbed(guild.name);
              await textCh.send({ embeds: [e] });
              log.push(`    ðŸ‘‹ ØªÙ… ØªØ¹ÙŠÙŠÙ† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ±Ø­ÙŠØ¨ Ø¨Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø¬Ø¯Ø¯.`);
            }
          } catch (e: any) {
            console.error(`[Builder] ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ ÙƒØ§Ø±Øª Ø§Ù„ØªØ±Ø­ÙŠØ¨/Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†: ${e.message}`);
          }
        }
      } catch (err: any) {
        log.push(`  âŒ ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ù‚Ù†Ø§Ø© ${chBp.name}: ${err.message}`);
      }
    }
  }
}

// ============================================================
//  Ø§Ù„Ø£Ø¯Ø§Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©: Ø¨Ù†Ø§Ø¡ Ø³ÙŠØ±ÙØ± Ù…Ø®ØµØµ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
// ============================================================
export async function buildCustomServer(
  guild: Guild,
  description: string,
  protectedChannelId: string
): Promise<{ success: boolean; message: string; details: string[] }> {
  const log: string[] = [];
  log.push(`ðŸ¤– Ø¬Ø§Ø±ÙŠ ØªØµÙ…ÙŠÙ… Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª Ù„Ù„ÙˆØµÙ: "${description}"...`);

  try {
    // Ø§Ù„Ù…Ø±Ø­Ù„Ø© 1: ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø¨Ù„ÙˆØ¨Ø±ÙŠÙ†Øª Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
    log.push('\nðŸ“ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰: ØªÙˆÙ„ÙŠØ¯ Ù‡ÙŠÙƒÙ„ Ø§Ù„Ù‚Ù†ÙˆØ§Øª ÙˆØ§Ù„Ø±ØªØ¨...');
    const blueprint = await generateBlueprintWithAI(description, guild.name);
    log.push(`âœ… ØªÙ… Ø§Ù„ØªÙˆÙ„ÙŠØ¯ Ø¨Ù†Ø¬Ø§Ø­: ${blueprint.serverType}`);
    log.push(`ðŸ“ ØªÙØ§ØµÙŠÙ„: ${blueprint.description}`);
    log.push(`ðŸ“Š Ø§Ù„Ù‡ÙŠÙƒÙ„ÙŠØ©: ${blueprint.categories.length} ÙØ¦Ø© Ø±Ø¦ÙŠØ³ÙŠØ© | ${blueprint.roles.length} Ø±ØªØ¨Ø©.`);

    // Ø§Ù„Ù…Ø±Ø­Ù„Ø© 2: Ù…Ø³Ø­ ÙˆØªÙ†Ø¸ÙŠÙ Ø§Ù„Ù‚Ù†ÙˆØ§Øª
    log.push('\nðŸ“ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ©: Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© ÙˆØ§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©...');
    await clearExistingChannels(guild, protectedChannelId, log);

    // Ø§Ù„Ù…Ø±Ø­Ù„Ø© 3: Ù…Ø³Ø­ ÙˆØªÙ†Ø¸ÙŠÙ Ø§Ù„Ø±ØªØ¨
    log.push('\nðŸ“ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù„Ø«Ø©: Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©...');
    await clearExistingRoles(guild, log);

    // Ø§Ù„Ù…Ø±Ø­Ù„Ø© 4: Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø±ØªØ¨
    log.push('\nðŸ“ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø±Ø§Ø¨Ø¹Ø©: Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙˆØµÙ„Ø§Ø­ÙŠØ§ØªÙ‡Ø§...');
    const createdRoles = await buildRoles(guild, blueprint.roles, log);

    // Ø§Ù„Ù…Ø±Ø­Ù„Ø© 5: Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ¦Ø§Øª ÙˆØ§Ù„Ù‚Ù†ÙˆØ§Øª
    const staffRoles = getStaffRoles(createdRoles, blueprint);
    log.push('\nðŸ“ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø®Ø§Ù…Ø³Ø©: Ø¨Ù†Ø§Ø¡ Ø§Ù„ÙØ¦Ø§Øª ÙˆØ§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„ØµÙˆØªÙŠØ© ÙˆØ§Ù„ÙƒØªØ§Ø¨ÙŠØ© Ø§Ù„Ù…Ù†Ø³Ù‚Ø©...');
    await buildCategoriesAndChannels(guild, blueprint, staffRoles, log);

    const totalChannelsCount = blueprint.categories.reduce((acc, cat) => acc + cat.channels.length, 0);
    const successMessage = `âœ… ØªÙ… Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡ Ø¨Ù†Ø¬Ø§Ø­ Ù…Ù† Ø¨Ù†Ø§Ø¡ ÙˆØªØµÙ…ÙŠÙ… Ø³ÙŠØ±ÙØ± "${blueprint.serverType}"!\n` +
      `ðŸ“ ${blueprint.categories.length} ÙØ¦Ø© | ðŸ’¬ ${totalChannelsCount} Ù‚Ù†Ø§Ø© | ðŸŽ­ ${blueprint.roles.length} Ø±ØªØ¨Ø© Ù…Ù„ÙˆÙ†Ø©.`;

    log.push('\n' + successMessage);
    return { success: true, message: successMessage, details: log };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    log.push(`\nðŸ’¥ Ø­Ø¯Ø« Ø®Ø·Ø£ ÙØ§Ø¯Ø­ Ø£Ø«Ù†Ø§Ø¡ Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø¨Ù†Ø§Ø¡: ${errorMsg}`);
    return { success: false, message: `âŒ ÙØ´Ù„ Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø¨Ø§Ù„ÙƒØ§Ù…Ù„: ${errorMsg}`, details: log };
  }
}

// ============================================================
//  Ø§Ù„Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø¬Ø§Ù‡Ø² Ù…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©
// ============================================================
export async function executeCommunityBuild(
  guild: Guild,
  blueprintType: 'community' | 'store' | 'gaming' | 'clan',
  protectedChannelId: string,
  options?: { serverName?: string }
): Promise<{ success: boolean; message: string; details: string[] }> {
  const typeDescriptions: Record<string, string> = {
    community: 'Ù…Ø¬ØªÙ…Ø¹ Ø¹Ø§Ù… Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„Ø§Øª Ø¯Ø±Ø¯Ø´Ø© ÙˆÙÙˆÙŠØ³',
    store: 'Ù…ØªØ¬Ø± ØªØ¬Ø§Ø±ÙŠ Ø¨ÙŠØ¹ Ø­Ø³Ø§Ø¨Ø§Øª ÙˆØªØ°Ø§ÙƒØ± ØªÙˆØ§ØµÙ„',
    gaming: 'Ø³ÙŠØ±ÙØ± Ù‚ÙŠÙ…Ù†Ù‚ Ø£Ù„Ø¹Ø§Ø¨ ÙˆØ¨Ø·ÙˆÙ„Ø§Øª ØªØ±ÙÙŠÙ‡ÙŠØ©',
    clan: 'ÙƒÙ„Ø§Ù† ÙˆØªÙŠÙ… Ù…Ù†Ø§ÙØ³Ø§Øª Ø±ÙˆÙ…Ø§Øª Ù„Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ù…ØºÙ„Ù‚',
  };

  const selectedDesc = typeDescriptions[blueprintType] || blueprintType;
  return buildCustomServer(guild, selectedDesc, protectedChannelId);
}

// ============================================================
//  Ù†Ø¸Ø§Ù… Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø°Ø§ØªÙŠ Ù„Ø¨Ø§Ù†ÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª (Self-Tests)
// ============================================================
export function runCommunityBuilderDiagnostics(): { success: boolean; reports: string[] } {
  const reports: string[] = [];
  let success = true;

  try {
    reports.push('[Diagnostic] Ø¨Ø¯Ø¡ ÙØ­Øµ Ø¨Ø§Ù†ÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª Ø§Ù„Ø°ÙƒÙŠ...');

    // Ø§Ø®ØªØ¨Ø§Ø± 1: ÙØ­Øµ ÙˆØ¬ÙˆØ¯ Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ÙˆØ«Ø¨Ø§Øª Ø­Ø¬Ù…Ù‡Ø§
    const gamingBp = DETAILED_BLUEPRINTS.gaming;
    const storeBp = DETAILED_BLUEPRINTS.store;

    if (!gamingBp || !storeBp) {
      reports.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 1: Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ØºÙŠØ± Ù…Ø¹Ø±Ù‘ÙØ© Ø¨Ø§Ù„Ø´ÙƒÙ„ Ø§Ù„Ø³Ù„ÙŠÙ….');
      success = false;
    } else {
      reports.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 1: Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù…ØªÙˆÙØ±Ø© ÙˆØµØ­ÙŠØ­Ø©.');
    }

    // Ø§Ø®ØªØ¨Ø§Ø± 2: ÙØ­Øµ Ø§Ù„Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ
    const fallbackBp = getDefaultBlueprint('Ù‚ÙŠÙ…Ù†Ù‚ Ø§Ù„Ø¹Ø§Ø¨');
    if (fallbackBp.serverType !== DETAILED_BLUEPRINTS.gaming.serverType) {
      reports.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 2: Ù…Ø­Ø±Ùƒ Ø§Ù„Ù€ Fallback Ù„Ù… ÙŠØ®ØªØ± Ù‚Ø§Ù„Ø¨ Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.');
      success = false;
    } else {
      reports.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 2: Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨ Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© ÙŠØ¹Ù…Ù„ Ø¨Ø°ÙƒØ§Ø¡ ÙˆØ¯Ù‚Ø©.');
    }

    // Ø§Ø®ØªØ¨Ø§Ø± 3: Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø±ØªØ¨ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© ÙˆÙ‡ÙŠÙƒÙ„ÙŠØªÙ‡Ø§
    if (fallbackBp.roles.length === 0 || !fallbackBp.roles.some(r => r.name.includes('Ø§Ù„Ù…Ø¤Ø³Ø³'))) {
      reports.push('âŒ ÙØ´Ù„ Ø§Ø®ØªØ¨Ø§Ø± 3: Ø±ØªØ¨ Ø§Ù„Ø¨Ù„ÙˆØ¨Ø±ÙŠÙ†Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù…ÙÙ‚ÙˆØ¯Ø© Ø£Ùˆ Ù„Ø§ ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø±ØªØ¨Ø© Ø§Ù„Ù…Ø¤Ø³Ø³.');
      success = false;
    } else {
      reports.push('âœ… Ù†Ø¬Ø§Ø­ Ø§Ø®ØªØ¨Ø§Ø± 3: Ù‡ÙŠÙƒÙ„ÙŠØ© Ø§Ù„Ø±ØªØ¨ ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ù…Ø¹Ø±Ù‘ÙØ© Ø¨Ø£Ø³Ù„ÙˆØ¨ Ù…Ø«Ø§Ù„ÙŠ.');
    }

    reports.push(`[Diagnostic] Ø§Ù†ØªÙ‡Ù‰ Ø§Ù„ÙØ­Øµ Ø¨Ù†Ø¬Ø§Ø­. Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„Ø¹Ø§Ù…Ø©: ${success ? 'Ù†Ø§Ø¬Ø­' : 'ÙØ§Ø´Ù„'}`);
  } catch (e: any) {
    success = false;
    reports.push(`âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ ÙØ§Ø¯Ø­ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ÙØ­Øµ: ${e.message}`);
  }

  return { success, reports };
}
