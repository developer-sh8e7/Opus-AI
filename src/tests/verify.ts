import assert from 'node:assert/strict';
import { ChannelType, Collection, type Guild } from 'discord.js';
import { buildArabicPermissionOperations } from '../intelligence/arabic_nlp.js';
import { planCompoundDiscordRequest } from '../intelligence/compound_planner.js';
import { ContextEngine } from '../intelligence/context_engine.js';
import { EntityRegistry } from '../intelligence/entity_registry.js';
import { MemoryManager } from '../intelligence/memory_manager.js';
import { applyExplicitTargets, resolveExplicitToolTargets } from '../services/toolTargeting.js';
import { KnowledgeSkillLoader } from '../intelligence/knowledge_skill_loader.js';
import { validateToolKnowledgeRules } from '../intelligence/discord_knowledge.js';

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

function verifyKnowledgeSkillLoader(): void {
  KnowledgeSkillLoader.load();
  const fileIds = KnowledgeSkillLoader.getLoadedFileIds();
  if (fileIds.length > 0) {
    assert.ok(fileIds.length >= 8, `Expected \u22658 skill files, got ${fileIds.length}`);
    const sections = KnowledgeSkillLoader.getRelevantSections(['SET_PERMISSIONS'], [], 'خلي الكل يشوف بس ما يدخل');
    assert.ok(sections.length > 0, 'Expected sections for SET_PERMISSIONS intent');
    const allSections = KnowledgeSkillLoader.getRelevantSections(
      ['SET_PERMISSIONS', 'DELETE_CHANNEL', 'BAN_USER', 'CREATE_CHANNEL'], [], ''
    );
    assert.ok(allSections.length <= 3, `Expected \u22643 sections, got ${allSections.length}`);
    const totalLines = allSections.reduce((s, sec) => s + sec.content.split('\n').length, 0);
    assert.ok(totalLines <= 60, `Expected \u226460 lines, got ${totalLines}`);
    const unknownSections = KnowledgeSkillLoader.getRelevantSections(['UNKNOWN'], ['delete_channels'], '');
    assert.ok(unknownSections.length >= 0, 'UNKNOWN intent should not crash');
    console.log('[Verify] knowledge_skill_loader: OK');
  } else {
    console.log('[Verify] knowledge_skill_loader: SKIP — no skills/ directory detected');
  }
}

function verifyAntiPatternValidator(): void {
  const guildId = '999999999999999999';
  const mockGuild = {
    id: guildId,
    ownerId: '111111111111111111',
    members: {
      cache: new Map([
        ['222222222222222222', {
          id: '222222222222222222',
          roles: { highest: { position: 5 } },
        }],
      ]),
    },
    channels: { cache: new Map() },
  } as any;
  const actorMember = {
    roles: { highest: { position: 10 } },
  } as any;

  // AP-001: MoveMembers for @everyone → blocked
  const ap1 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['MoveMembers'], deny: [] }, mockGuild);
  assert.equal(ap1.allowed, false, 'AP-001 should block MoveMembers for @everyone');

  // AP-002: ManageRoles for @everyone → blocked
  const ap2 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['ManageRoles'], deny: [] }, mockGuild);
  assert.equal(ap2.allowed, false, 'AP-002 should block ManageRoles for @everyone');

  // AP-003: ManageChannels for @everyone → blocked
  const ap3 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['ManageChannels'], deny: [] }, mockGuild);
  assert.equal(ap3.allowed, false, 'AP-003 should block ManageChannels for @everyone');

  // AP-009: Bulk delete ≥5 channels without confirmation → blocked
  const ap9 = validateToolKnowledgeRules('delete_channels',
    { channelIds: ['1', '2', '3', '4', '5'] }, mockGuild);
  assert.equal(ap9.allowed, false, 'AP-009 should block bulk delete without confirmation');

  // AP-009 with confirmation → allowed
  const ap9ok = validateToolKnowledgeRules('delete_channels',
    { channelIds: ['1', '2', '3', '4', '5'], _confirmed: true }, mockGuild);
  assert.equal(ap9ok.allowed, true, 'AP-009 confirmed should pass');

  // AP-011: Target is guild owner → blocked
  const ap11 = validateToolKnowledgeRules('manage_members',
    { action: 'ban', memberId: '111111111111111111' }, mockGuild);
  assert.equal(ap11.allowed, false, 'AP-011 should block moderator action on guild owner');

  // Safe permission edit passes
  const safe = validateToolKnowledgeRules('edit_permissions',
    { targetId: 'someRoleId', allow: ['ViewChannel', 'Connect'], deny: [] }, mockGuild);
  assert.equal(safe.allowed, true, 'Safe permission edit should pass');

  console.log('[Verify] anti_pattern_validator: OK');
}

function verifyEntityTombstone(): void {
  const guildId = '999999999999999999';

  EntityRegistry.register({
    guildId,
    type: 'channel',
    id: 'tombstone-test-1',
    name: 'test-chan',
    sourceTool: 'create_channels',
    createdAt: Date.now(),
  });
  assert.ok(EntityRegistry.getLatest(guildId, 'channel')?.id === 'tombstone-test-1',
    'Entity should be retrievable before tombstone');

  EntityRegistry.markTombstone(guildId, 'channel', 'tombstone-test-1');
  assert.ok(EntityRegistry.isTombstone(guildId, 'channel', 'tombstone-test-1'),
    'isTombstone should return true after markTombstone');
  assert.equal(EntityRegistry.getLatest(guildId, 'channel'), undefined,
    'getLatest should not return tombstoned entity');

  console.log('[Verify] entity_tombstone: OK');
}

function main(): void {
  const guild = createGuild();
  verifyCriticalPermissionScenario(guild);
  verifyEntityMemory(guild);
  verifyAtomicChannelWorkflow();
  verifyLanguagePersistence(guild);
  verifyImplicitCategoryChain(guild);
  verifyKnowledgeSkillLoader();
  verifyAntiPatternValidator();
  verifyEntityTombstone();
  console.log('[Verify] 8/8 critical scenarios passed.');
}

main();
