import assert from 'node:assert/strict';
import { ChannelType, Collection, type Guild } from 'discord.js';
import { buildArabicPermissionOperations } from '../intelligence/arabic_nlp.js';
import { planCompoundDiscordRequest } from '../intelligence/compound_planner.js';
import { ContextEngine } from '../intelligence/context_engine.js';
import { EntityRegistry } from '../intelligence/entity_registry.js';
import { MemoryManager } from '../intelligence/memory_manager.js';
import { applyExplicitTargets, resolveExplicitToolTargets } from '../services/toolTargeting.js';

function createGuild(): Guild {
  const guildId = '999999999999999999';
  const channels = new Collection<string, any>([
    ['1513737591793520903', {
      id: '1513737591793520903',
      name: 'private-voice',
      type: ChannelType.GuildVoice,
      parentId: null,
    }],
    ['1513737591793520904', {
      id: '1513737591793520904',
      name: 'TestRoom',
      type: ChannelType.GuildVoice,
      parentId: '1513737591793520905',
    }],
    ['1513737591793520905', {
      id: '1513737591793520905',
      name: 'VIP',
      type: ChannelType.GuildCategory,
      parentId: null,
    }],
  ]);
  const roles = new Collection<string, any>([
    [guildId, { id: guildId, name: '@everyone' }],
    ['1513737591793520906', { id: '1513737591793520906', name: 'خاص' }],
  ]);
  return {
    id: guildId,
    name: 'Verification Guild',
    memberCount: 10,
    channels: { cache: channels },
    roles: { cache: roles },
  } as unknown as Guild;
}

function verifyCriticalPermissionScenario(guild: Guild): void {
  const operations = buildArabicPermissionOperations(
    '1513737591793520903 الكل يشوفون الروم بس ما يقدرون يخشونه فقط اللي معه رتبة خاص يقدر يدخل ويتكلم ويفتح سكرين',
    guild
  );
  assert.deepEqual(operations[0]?.allow, ['ViewChannel']);
  assert.deepEqual(operations[0]?.deny, ['Connect']);
  assert.ok(operations[1]?.allow.includes('ViewChannel'));
  assert.ok(operations[1]?.allow.includes('Connect'));
  assert.ok(operations[1]?.allow.includes('Speak'));
  assert.ok(operations[1]?.allow.includes('Stream'));
}

function verifyEntityMemory(guild: Guild): void {
  const memory = new MemoryManager();
  const conversationChannelId = '1513737591793520999';
  memory.rememberEntities(conversationChannelId, [{
    guildId: guild.id,
    type: 'channel',
    id: '1513737591793520904',
    name: 'TestRoom',
    sourceTool: 'create_channels',
    createdAt: Date.now(),
  }]);
  const targets = resolveExplicitToolTargets(
    guild,
    'ابي البرمشن حق الروم الكل يشوف بس ما يدخل',
    memory.getRecentEntities(conversationChannelId)
  );
  assert.deepEqual(targets.channelIds, ['1513737591793520904']);
  memory.clearHistory(conversationChannelId);
  memory.destroy();
}

function verifyAtomicChannelWorkflow(): void {
  const steps = planCompoundDiscordRequest(
    'سو لي روم تكست اسمه rules وحط الكل يشوف بس ما يكتب'
  );
  assert.equal(steps.length, 1);
  assert.equal(steps[0]?.tool, 'create_channels');
  assert.deepEqual(steps[0]?.args.permissions, [{
    id: '@everyone',
    allow: ['ViewChannel'],
    deny: ['SendMessages'],
  }]);
}

function verifyLanguagePersistence(guild: Guild): void {
  const channelId = '1513737591793520998';
  const context = ContextEngine.getOrCreate(channelId, guild.id);
  ContextEngine.addTurn(channelId, {
    role: 'user',
    content: 'كيف حالك',
    timestamp: Date.now(),
    userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'ar');
  ContextEngine.addTurn(channelId, {
    role: 'user',
    content: 'Can you help me?',
    timestamp: Date.now(),
    userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'en');
  ContextEngine.addTurn(channelId, {
    role: 'user',
    content: 'ارجع عربي',
    timestamp: Date.now(),
    userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'ar');
  ContextEngine.clear(channelId);
}

function verifyImplicitCategoryChain(guild: Guild): void {
  EntityRegistry.clearGuild(guild.id);
  EntityRegistry.register({
    guildId: guild.id,
    type: 'category',
    id: '1513737591793520905',
    name: 'VIP',
    sourceTool: 'create_channels',
    conversationChannelId: '1513737591793520997',
  });
  const targets = resolveExplicitToolTargets(guild, 'سو فيها روم تكست اسمه vip-chat');
  const targeted = applyExplicitTargets(
    'create_channels',
    { type: 'text', names: ['vip-chat'] },
    targets
  );
  assert.equal(targeted.args.categoryId, '1513737591793520905');
}

function main(): void {
  const guild = createGuild();
  verifyCriticalPermissionScenario(guild);
  verifyEntityMemory(guild);
  verifyAtomicChannelWorkflow();
  verifyLanguagePersistence(guild);
  verifyImplicitCategoryChain(guild);
  console.log('[Verify] 5/5 critical scenarios passed.');
}

main();
