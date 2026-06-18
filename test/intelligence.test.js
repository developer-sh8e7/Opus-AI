const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { ChannelType, Collection, EmbedBuilder } = require('discord.js');
const { ContextEngine } = require('../dist/intelligence/context_engine.js');
const { EntityRegistry } = require('../dist/intelligence/entity_registry.js');
const { MemoryManager } = require('../dist/intelligence/memory_manager.js');
const { WorkflowEngine } = require('../dist/intelligence/workflow_engine.js');
const { planCompoundDiscordRequest } = require('../dist/intelligence/compound_planner.js');
const {
  applyArabicPermissionsToToolArgs,
  buildArabicPermissionOperations,
  detectArabicIntent,
} = require('../dist/intelligence/arabic_nlp.js');
const {
  applyExplicitTargets,
  resolveExplicitToolTargets,
} = require('../dist/services/toolTargeting.js');
const { SkillRegistry } = require('../dist/skills/skill_registry.js');
const { AIRequestLimiter } = require('../dist/utils/aiRateLimiter.js');
const { getConversationReply } = require('../dist/services/conversation.js');
const {
  currentMessageAllowsTools,
  selectToolNames,
} = require('../dist/services/toolIntent.js');
const {
  ADVANCED_DISCORD_ACTIONS,
  ADVANCED_ACTION_GROUPS,
} = require('../dist/utils/advancedDiscordActions.js');
const {
  getChannelTypeReference,
  getPermissionReference,
} = require('../dist/intelligence/discord_knowledge.js');
const {
  installLegacyEmbedRepair,
  repairLegacyText,
} = require('../dist/utils/textEncoding.js');
const {
  normalizeFunctionTags,
  stripRawToolMarkup,
} = require('../dist/utils/functionTagNormalizer.js');

function createGuild() {
  const channels = new Collection([
    ['100', { id: '100', name: 'general', type: ChannelType.GuildText, parentId: null }],
    ['200', { id: '200', name: 'TestRoom', type: ChannelType.GuildVoice, parentId: '300' }],
    ['300', { id: '300', name: 'VIP', type: ChannelType.GuildCategory, parentId: null }],
    ['400', { id: '400', name: 'الو', type: ChannelType.GuildText, parentId: null }],
    ['1513737591793520903', {
      id: '1513737591793520903',
      name: 'private-voice',
      type: ChannelType.GuildVoice,
      parentId: null,
    }],
  ]);
  const roles = new Collection([
    ['500', { id: '500', name: 'مشرف' }],
    ['501', { id: '501', name: 'خاص' }],
    ['999', { id: '999', name: '@everyone' }],
  ]);
  return {
    id: '999',
    name: 'Test Guild',
    memberCount: 10,
    channels: { cache: channels },
    roles: { cache: roles },
  };
}

test('context switches language based on the latest user message', () => {
  const context = ContextEngine.getOrCreate('language-channel', '999');
  ContextEngine.addTurn('language-channel', {
    role: 'user', content: 'كيف حالك', timestamp: Date.now(), userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'ar');
  ContextEngine.addTurn('language-channel', {
    role: 'user', content: 'can you help me?', timestamp: Date.now(), userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'en');
  ContextEngine.addTurn('language-channel', {
    role: 'user', content: 'ارجع كلمني عربي', timestamp: Date.now(), userId: '1',
  });
  assert.equal(ContextEngine.getDominantLanguage(context, '1'), 'ar');
});

test('recent channel and category resolve implicit Arabic references', () => {
  const guild = createGuild();
  EntityRegistry.clearGuild(guild.id);
  EntityRegistry.register({ guildId: guild.id, type: 'category', id: '300', name: 'VIP' });
  EntityRegistry.register({ guildId: guild.id, type: 'channel', id: '200', name: 'TestRoom' });

  const roomTargets = resolveExplicitToolTargets(guild, 'ابي البرمشن حق الروم الكل يشوف بس ما يدخل');
  assert.deepEqual(roomTargets.channelIds, ['200']);

  const categoryTargets = resolveExplicitToolTargets(guild, 'سو فيها روم تكست اسمه vip-chat');
  const call = applyExplicitTargets('create_channels', { type: 'text', names: ['vip-chat'] }, categoryTargets);
  assert.equal(call.args.categoryId, '300');
});

test('session memory preserves created entity IDs for follow-up requests', () => {
  const memory = new MemoryManager();
  const channelId = `entity-memory-${Date.now()}`;
  memory.rememberEntities(channelId, [
    {
      guildId: '999',
      type: 'category',
      id: '701',
      name: 'المتجر',
      sourceTool: 'create_channels',
      createdAt: Date.now() - 2,
    },
    {
      guildId: '999',
      type: 'role',
      id: '702',
      name: 'عملاء',
      sourceTool: 'manage_roles',
      createdAt: Date.now() - 1,
    },
  ]);

  assert.equal(memory.resolveEntity(channelId, 'category', 'المتجر')?.id, '701');
  assert.equal(memory.resolveEntity(channelId, 'role')?.id, '702');
  assert.deepEqual(memory.getLastEntityIds(channelId), {
    last_channel_id: undefined,
    last_role_id: '702',
    last_category_id: '701',
  });
  assert.match(memory.buildEntityContext(channelId), /role:عملاء:702/);
  assert.match(memory.buildEntityContext(channelId), /last_role_id=702/);

  const targets = resolveExplicitToolTargets(
    createGuild(),
    'حط الرول في هالكاتقوري',
    memory.getRecentEntities(channelId)
  );
  assert.deepEqual(targets.categoryIds, ['701']);
  assert.deepEqual(targets.roleIds, ['702']);

  memory.clearHistory(channelId);
  memory.destroy();
});

test('advanced creation results are registered in the current conversation', () => {
  const guild = createGuild();
  EntityRegistry.clearGuild(guild.id);
  const entities = EntityRegistry.registerToolResult(
    guild,
    'thread_operations',
    { action: 'thread_create', channelId: '100', name: 'support' },
    { success: true, data: { id: '600', name: 'support' } },
    'conversation-1'
  );

  assert.equal(entities[0]?.type, 'thread');
  assert.equal(entities[0]?.conversationChannelId, 'conversation-1');
  assert.match(
    EntityRegistry.injectIntoPrompt(guild.id, 'conversation-1'),
    /thread:support:600:source=thread_operations:thread_create:session=current/
  );
});

test('Arabic permissions are applied atomically to channel creation', () => {
  const args = applyArabicPermissionsToToolArgs(
    'create_channels',
    { type: 'text', names: ['rules'] },
    'سو روم rules وخلي الكل يقرأ بس ما يكتب',
    '999'
  );
  assert.deepEqual(args.permissions, [{
    id: '999',
    allow: ['ViewChannel'],
    deny: ['SendMessages'],
  }]);
  assert.equal(detectArabicIntent('سو لي روم فويس اسمه TestRoom'), 'CREATE_CHANNEL');
});

test('workflow resolves values from previous steps and honors multi-dependencies', async () => {
  const calls = [];
  const result = await WorkflowEngine.execute([
    { id: 'create', tool: 'create_channels', args: { names: ['Room1'] } },
    { id: 'role', tool: 'manage_roles', args: { roleData: { name: 'VIP' } } },
    {
      id: 'permissions',
      tool: 'edit_permissions',
      dependsOn: ['create', 'role'],
      args: { channelId: '$create.channelId', targetId: '$role.roleId' },
    },
  ], async (tool, args) => {
    calls.push({ tool, args });
    if (tool === 'create_channels') return { success: true, channelId: '987654321' };
    if (tool === 'manage_roles') return { success: true, roleId: '555' };
    return { success: true };
  });
  assert.equal(result.success, true);
  assert.equal(calls[2].args.channelId, '987654321');
  assert.equal(calls[2].args.targetId, '555');
});

test('workflow parser accepts only structured tool JSON', () => {
  const steps = WorkflowEngine.parseFromAIResponse(JSON.stringify([
    { id: 'create', tool: 'create_channels', params: { names: ['Room1'] } },
    { tool: 'edit_permissions', dependsOn: 'create', params: { channelId: '$create.channelId' } },
  ]));
  assert.equal(steps.length, 2);
  assert.equal(steps[1].dependsOn, 'create');
  assert.deepEqual(WorkflowEngine.parseFromAIResponse('ordinary chat reply'), []);
});

test('compound Arabic server request becomes a five-step dependent workflow', () => {
  const steps = planCompoundDiscordRequest(
    'سوّ كاتقوري اسمها VIP وحط فيها روم تكست وروم فويس وسوّ رتبة VIP تشوف كل شيء فيها'
  );
  assert.equal(steps.length, 5);
  assert.equal(steps[0].tool, 'create_channels');
  assert.equal(steps[1].args.categoryId, '$create_category.channelId');
  assert.equal(steps[2].args.categoryId, '$create_category.channelId');
  assert.equal(steps[3].tool, 'manage_roles');
  assert.equal(steps[4].args.targetId, '$create_role.roleId');
  assert.equal(steps[4].args.channelId, '$create_category.channelId');
});

test('complex Arabic voice permissions map without contradictory flags', () => {
  const text = '\u0627\u0644\u0643\u0644 \u064a\u0634\u0648\u0641 \u0627\u0644\u0631\u0648\u0645 \u0628\u0633 \u0645\u062d\u062f \u064a\u0642\u062f\u0631 \u064a\u062f\u062e\u0644\u0647 \u0628\u0633 \u0627\u0630\u0627 \u062f\u062e\u0644\u0648\u0647 \u064a\u0642\u062f\u0631\u0648\u0646 \u064a\u062a\u0643\u0644\u0645\u0648\u0646 \u0648\u064a\u0641\u062a\u062d\u0648\u0646 \u0633\u0643\u0631\u064a\u0646 \u0634\u064a\u0631';
  const args = applyArabicPermissionsToToolArgs('edit_permissions', {}, text, '999');
  assert.deepEqual(args.allow.sort(), ['Speak', 'Stream', 'ViewChannel'].sort());
  assert.deepEqual(args.deny, ['Connect']);
  assert.equal(args.targetId, '999');
});

test('explicit Arabic permission sentence resolves everyone and named role without questions', () => {
  const guild = createGuild();
  const text = '1513737591793520903 الكل يشوفه ما يدخله إلا رتبة خاص تدخل وتتكلم وتفتح سكرين';
  const operations = buildArabicPermissionOperations(text, guild);

  assert.deepEqual(operations, [
    {
      channelId: '1513737591793520903',
      targetId: '999',
      targetType: 'role',
      allow: ['ViewChannel'],
      deny: ['Connect'],
    },
    {
      channelId: '1513737591793520903',
      targetId: '501',
      targetType: 'role',
      allow: ['ViewChannel', 'Connect', 'Speak', 'Stream'],
      deny: [],
    },
  ]);
});

test('Gulf يخش phrasing keeps the room visible and grants the exception role voice access', () => {
  const guild = createGuild();
  const text = '1513737591793520903 كل الناس يشوفون الروم بس ما يقدرون يخشونه فقط اللي معه رتبة خاص يقدر يدخله ويتكلم ويفتح سكرين = video';
  const operations = buildArabicPermissionOperations(text, guild);

  assert.deepEqual(operations, [
    {
      channelId: '1513737591793520903',
      targetId: '999',
      targetType: 'role',
      allow: ['ViewChannel'],
      deny: ['Connect'],
    },
    {
      channelId: '1513737591793520903',
      targetId: '501',
      targetType: 'role',
      allow: ['ViewChannel', 'Connect', 'Speak', 'Stream', 'UseEmbeddedActivities'],
      deny: [],
    },
  ]);
});

test('single channel create-and-permission request is planned without AI guessing', () => {
  const steps = planCompoundDiscordRequest(
    'سو لي روم تكست اسمه rules وحط الكل يشوف بس ما يكتب'
  );
  assert.equal(steps.length, 1);
  assert.equal(steps[0].tool, 'create_channels');
  assert.deepEqual(steps[0].args, {
    type: 'text',
    names: ['rules'],
    permissions: [{
      id: '@everyone',
      allow: ['ViewChannel'],
      deny: ['SendMessages'],
    }],
  });
});

test('loose Gulf create-and-permission voice request is planned as one configured channel', () => {
  const steps = planCompoundDiscordRequest(
    'سو روم فويس Room1 وخل الكل يشوفه بس ما يدخل'
  );
  assert.equal(steps.length, 1);
  assert.equal(steps[0].tool, 'create_channels');
  assert.deepEqual(steps[0].args, {
    type: 'voice',
    names: ['Room1'],
    permissions: [{
      id: '@everyone',
      allow: ['ViewChannel'],
      deny: ['Connect'],
    }],
  });
});

test('Arabic permission parser understands deafen spelling and recent room references', () => {
  const guild = createGuild();
  const operations = buildArabicPermissionOperations(
    'الروم ذا الكل يشوفه ما يدخله ويقدرون move وميوت وديفين',
    guild,
    [{ id: '1513737591793520903', name: 'private-voice', type: 'channel' }]
  );

  assert.deepEqual(operations, [{
    channelId: '1513737591793520903',
    targetId: '999',
    targetType: 'role',
    allow: ['ViewChannel', 'MoveMembers', 'MuteMembers', 'DeafenMembers'],
    deny: ['Connect'],
  }]);
});

test('bulk permission request resolves category and everyone target', () => {
  const guild = createGuild();
  EntityRegistry.clearGuild(guild.id);
  EntityRegistry.register({ guildId: guild.id, type: 'category', id: '300', name: 'VIP' });
  const text = '\u0641\u064a \u0627\u0644\u0643\u0627\u062a\u0642\u0648\u0631\u064a \u0647\u0630\u064a \u0627\u0645\u0633\u062d \u0635\u0644\u0627\u062d\u064a\u0629 \u0645\u0646\u0634\u0646 @everyone \u0645\u0646 \u0643\u0644 \u0627\u0644\u0631\u0648\u0645\u0627\u062a';
  const targets = resolveExplicitToolTargets(guild, text);
  let args = applyArabicPermissionsToToolArgs('bulk_permission_update', {}, text, guild.id);
  args = applyExplicitTargets('bulk_permission_update', args, targets).args;
  assert.equal(args.categoryId, '300');
  assert.equal(args.targetId, '999');
  assert.deepEqual(args.deny, ['MentionEveryone']);
});

test('raw session channel IDs resolve even when Discord cache lacks the channel', () => {
  const guild = createGuild();
  const targets = resolveExplicitToolTargets(
    guild,
    '1513737591793520999 الكل يشوف بس ما يدخل',
    [{ id: '1513737591793520999', name: 'Room1', type: 'channel' }]
  );

  assert.deepEqual(targets.channelIds, ['1513737591793520999']);
});

test('bulk channel deletion preserves every explicitly excluded channel', () => {
  const guild = createGuild();
  const text = 'ابي تحذف كل الرومات وتبقي فقط الو';
  const targets = resolveExplicitToolTargets(guild, text);
  const call = applyExplicitTargets(
    'delete_channels',
    { channelIds: ['400', '100'] },
    targets
  );

  assert.deepEqual(targets.excludedChannelIds, ['400']);
  assert.ok(targets.bulkDeleteChannelIds.includes('100'));
  assert.ok(targets.bulkDeleteChannelIds.includes('300'));
  assert.ok(!targets.bulkDeleteChannelIds.includes('400'));
  assert.ok(!call.args.channelIds.includes('400'));
});

test('AI limiter enforces user and guild windows and preserves queue order', async () => {
  const limiter = new AIRequestLimiter(2, 3, 60_000);
  assert.equal(limiter.check('user-1', 'guild-1', 1).allowed, true);
  assert.equal(limiter.check('user-1', 'guild-1', 2).allowed, true);
  assert.equal(limiter.check('user-1', 'guild-1', 3).scope, 'user');
  assert.equal(limiter.check('user-2', 'guild-1', 4).allowed, true);
  assert.equal(limiter.check('user-3', 'guild-1', 5).scope, 'guild');

  const order = [];
  await Promise.all([
    limiter.schedule('guild-queue', async () => { order.push(1); }),
    limiter.schedule('guild-queue', async () => { order.push(2); }),
  ]);
  assert.deepEqual(order, [1, 2]);
});

test('Discord knowledge covers installed permission and channel enums', () => {
  assert.ok(getPermissionReference().length >= 45);
  assert.ok(getChannelTypeReference().length >= 10);
});

test('skill registry dynamically loads executable skills', async () => {
  const count = await SkillRegistry.loadDirectory(path.join(__dirname, '..', 'dist', 'skills'));
  assert.ok(count >= 500);
  assert.ok(SkillRegistry.get('edit_permissions'));
  assert.ok(SkillRegistry.get('bulk_permission_update'));
  assert.ok(SkillRegistry.get('unban'));
  assert.ok(SkillRegistry.get('voice_mute'));
  assert.ok(SkillRegistry.get('automod_create_keyword'));
  assert.ok(SkillRegistry.get('event_create_external'));
  assert.ok(SkillRegistry.get('webhook_create'));
  assert.ok(SkillRegistry.get('preset_purge_100'));
  assert.ok(SkillRegistry.get('preset_timeout_300m'));
  assert.ok(SkillRegistry.get('preset_voice_limit_50'));
});

test('AI service is compact and free from broken Arabic encoding', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'ai.ts'), 'utf8');
  assert.ok(source.split(/\r?\n/).length < 1_200);
  assert.doesNotMatch(source, /[ØÙ]/);
  assert.match(source, /llama|config\.groqModel/);
  assert.match(source, /api\.cerebras\.ai/);
});

test('common Gulf conversation is answered naturally without an AI provider', () => {
  assert.equal(
    getConversationReply('كيف حالك يالشيخ'),
    'بخير دامك بخير يا شيخ 😄 وش أخبارك أنت؟'
  );
  assert.equal(getConversationReply('ابي تحذف روم العام'), null);
});

test('ordinary current messages never inherit tools from previous requests', () => {
  const history = [
    { role: 'user', content: 'سو إيمبد في روم الو' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'tool-1',
        type: 'function',
        function: {
          name: 'send_embed',
          arguments: '{"channelId":"400","description":"الحمدلله"}',
        },
      }],
    },
    { role: 'tool', name: 'send_embed', tool_call_id: 'tool-1', content: '{"success":true}' },
    { role: 'user', content: 'الحمدلله' },
  ];

  assert.equal(currentMessageAllowsTools(history), false);
  assert.deepEqual([...selectToolNames(history)], []);

  history[history.length - 1] = { role: 'user', content: 'المهم اسمع' };
  assert.equal(currentMessageAllowsTools(history), false);
  assert.deepEqual([...selectToolNames(history)], []);

  history[history.length - 1] = { role: 'user', content: 'ابي اقولك شيء عن الرومات' };
  assert.equal(currentMessageAllowsTools(history), false);
  assert.deepEqual([...selectToolNames(history)], []);

  history[history.length - 1] = { role: 'user', content: 'ارسل إيمبد في روم الو' };
  assert.equal(currentMessageAllowsTools(history), true);
  assert.ok(selectToolNames(history).has('send_embed'));

  history[history.length - 1] = {
    role: 'user',
    content: '1513737591793520903 الكل يشوفه ما يدخله إلا رتبة خاص تدخل',
  };
  assert.equal(currentMessageAllowsTools(history), true);
});

test('advanced Discord skill catalog contains unique executable operations', () => {
  const groupedCount = Object.values(ADVANCED_ACTION_GROUPS)
    .reduce((total, actions) => total + actions.length, 0);
  assert.equal(ADVANCED_DISCORD_ACTIONS.length, groupedCount);
  assert.equal(new Set(ADVANCED_DISCORD_ACTIONS).size, ADVANCED_DISCORD_ACTIONS.length);
  assert.ok(ADVANCED_DISCORD_ACTIONS.length >= 90);
});

test('raw tool-call text is stripped before user-facing output', () => {
  const raw = 'خليني أحذف كل الرومات <tool_call>delete_channels channel_ids=["1","2"]';
  assert.equal(stripRawToolMarkup(raw), 'خليني أحذف كل الرومات');

  const normalized = normalizeFunctionTags('<tool_call>delete_channels<arg_key>channelIds</arg_key><arg_value>1</arg_value></tool_call>');
  assert.equal(normalized.toolCalls[0].function.name, 'delete_channels');
  assert.equal(normalized.cleanContent, '');
});

test('legacy Arabic and emoji mojibake is repaired before display', () => {
  assert.equal(repairLegacyText('Ø§Ù„ÙƒÙ„ ÙŠØ´ÙˆÙ'), 'الكل يشوف');
  assert.equal(repairLegacyText('ðŸš¨ ØªØ­Ø°ÙŠØ±'), '🚨 تحذير');
  assert.equal(repairLegacyText('Opus Ai'), 'Opus Ai');

  installLegacyEmbedRepair();
  const embed = new EmbedBuilder()
    .setTitle('ðŸš¨ ØªØ­Ø°ÙŠØ±')
    .addFields({ name: 'Ø§Ù„Ø³Ø¨Ø¨', value: 'Ø§Ø®ØªØ¨Ø§Ø±' })
    .toJSON();
  assert.equal(embed.title, '🚨 تحذير');
  assert.deepEqual(embed.fields, [{ name: 'السبب', value: 'اختبار' }]);
});
