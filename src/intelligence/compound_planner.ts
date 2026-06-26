import type { WorkflowStep } from './context_engine.js';
import { parseArabicPermissions } from './arabic_nlp.js';

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

function safeChannelName(value: string, suffix: string): string {
  const slug = value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${slug || 'vip'}-${suffix}`.slice(0, 100);
}

/**
 * استخراج اسم الروم المطلوب إنشاؤه من النص
 */
function extractSingleChannelRequest(clean: string): RegExpMatchArray | null {
  const explicitName = clean.match(
    /(?:سو|سوي|انشئ|أنشئ|اصنع|ابي|ابغى)\s+(?:لي\s+)?(?:روم|قناه)\s+(تكست|نصي|فويس|صوتي)\s+(?:اسمه|اسمها|باسم)\s+([^\s،,]+)/i
  );
  if (explicitName) return explicitName;

  const looseName = clean.match(
    /(?:سو|سوي|انشئ|أنشئ|اصنع|ابي|ابغى)\s+(?:لي\s+)?(?:روم|قناه)\s+(تكست|نصي|فويس|صوتي)\s+(.+?)(?=\s+(?:و?خل|و?خلي|وحط|حط|مع|بس|لكن|الكل|الجميع|كل\s+الناس|everyone)(?:\s|$)|$)/i
  );
  if (!looseName) return null;

  const name = looseName[2]
    .replace(/^(?:اسمه|اسمها|باسم)\s+/i, '')
    .replace(/[،,]+$/g, '')
    .trim();
  if (!name || /^(?:و?خل|و?خلي|وحط|حط|مع|بس|لكن|الكل|الجميع|everyone)$/i.test(name)) return null;
  looseName[2] = name.split(/\s+/)[0];
  return looseName;
}

/**
 * استخراج طلب الكاتقوري + الرومات بداخلها كنمط بناء
 */
function extractCategoryAndRooms(clean: string): { categoryName: string; roleName: string } | null {
  const categoryName = clean.match(
    /(?:كاتقوري|فئه|تصنيف)\s+(?:اسمها|اسمه|باسم)\s+([^\s،,]+)/
  )?.[1];
  const roleName = clean.match(
    /(?:رتبه|رول)\s+([^\s،,]+)(?=\s+(?:تشوف|تدخل|تكتب|لها|فيها|$))/
  )?.[1] ?? categoryName;
  if (!categoryName || !roleName) return null;
  return { categoryName, roleName };
}

/**
 * هل النص يحتوي على طلب تعيين صلاحية (برمشن / يشوف / يدخل / الخ)؟
 */
function hasPermissionRequest(clean: string): boolean {
  return /(?:برمشن|صلاحيه|صلاحية|يشوف|يدخل|يخش|يتكلم|سكرين|شير|منشن|يكتب|ممنوع|الكل|everyone|يسمح|مقفل|مقفول|ممنوع|بس\s+اللي|إلا\s+اللي|الا\s+اللي|منع)/i.test(clean);
}

/**
 * استخراج رتبة الاستثناء من النص (إلا رتبة كذا)
 */
function extractExceptionRole(clean: string): string | null {
  const match = clean.match(
    /(?:إلا|الا)\s+(?:اللي|الي|من)?\s*(?:معه|عنده)?\s*(?:رتبة|رتبت|رول)\s+(?:<@&(\d{17,20})>|@?([^\s،,]+))/i
  );
  if (!match) return null;
  return match[1] || match[2] || null;
}

function extractRoleTarget(clean: string): string | null {
  const match = clean.match(/(?:للرتبه|للرتبة|لرتبه|لرتبة|للرول|لرول|role)\s+(?:<@&(\d{17,20})>|@?([^\s،,]+))/i)
    ?? clean.match(/(?:رتبه|رتبة|رول)\s+(?:<@&(\d{17,20})>|@?([^\s،,]+))\s*(?:يقدر|تقدر|يدخل|يخش|يتكلم|يفتح|تشوف|تشوفه)/i);
  if (!match) return null;
  return match[1] || match[2] || null;
}

function splitEveryoneAndRolePermissions(clean: string): { everyoneText: string; roleText: string } {
  const roleMarker = clean.search(/(?:للرتبه|للرتبة|لرتبه|لرتبة|للرول|لرول|role)\s+/i);
  if (roleMarker < 0) return { everyoneText: clean, roleText: clean };
  const beforeRole = clean.slice(0, roleMarker);
  const capabilityStart = beforeRole.search(/(?:ويقدرون|ويقدر|وتقدر|تقدر|يتكلم|يفتح|سكرين|شير|speak|stream)/i);
  return {
    everyoneText: capabilityStart >= 0 ? beforeRole.slice(0, capabilityStart) : beforeRole,
    roleText: beforeRole.slice(Math.max(0, capabilityStart)) || clean.slice(roleMarker),
  };
}

/**
 * استخراج المنشن (@user أو @role أو @everyone) من النص
 */
function extractMentionTarget(clean: string): { id: string; type: 'member' | 'role' | 'everyone' } | null {
  // @everyone / @here
  if (/(?:everyone|here|الكل)/i.test(clean)) {
    return { id: '@everyone', type: 'everyone' };
  }
  // <@&ROLE_ID> (role mention)
  const roleMention = clean.match(/<@&(\d{17,20})>/);
  if (roleMention) {
    return { id: roleMention[1], type: 'role' };
  }
  // <@USER_ID> or <@!USER_ID> (member mention)
  const memberMention = clean.match(/<@!?(\d{17,20})>/);
  if (memberMention) {
    return { id: memberMention[1], type: 'member' };
  }
  return null;
}

/**
 * التخطيط للطلبات المركبة Route
 *
 * المهام المدعومة:
 * 1. تغيير اسم البوت (غير اسمك إلى X / سميني X / عدّل لقبك إلى X)
 * 2. طرد من الروم الصوتي (اطرد X من الروم / افصل X / دسكن X / اطرده من الفويس)
 * 3. مسح صلاحيات المنشن من كاتقوري (شيل المنشن / امنع المنشن / اسحب منشن everyone)
 * 4. إنشاء روم مع صلاحيات مسبقة
 * 5. بناء كاتقوري + رومات + رتبة
 * 6. حذف جماعي مع إبقاء + إنشاء
 * 7. رومات متعددة باستثناء واحد
 */
export function planCompoundDiscordRequest(text: string): WorkflowStep[] {
  const clean = normalized(text);

  // ============================================================
  // النمط 1: تغيير اسم البوت (لقب)
  // "غير اسمك إلى X" / "غيّر لقبك إلى X" / "سميني X"
  // "عدّل لقبك إلى X" / "غيّر نكك إلى X"
  // ============================================================
  if (/(?:غير|غيّر|عدل|عدّل|حول|حوّل)\s+(?:اسمك|لقبك|نكك|اسمك\s+الى|لقبك\s+الى)\s+(?:الى|إلى|لـ|ل|الي|إلي)\s+(.+)/i.test(clean) ||
      /(?:سميني|سمني|سمّيني|سماني)\s+(.+)/i.test(clean) ||
      /(?:استخدم|خلي)\s+(?:اسم|لقب)\s+(?:.+\s+)?(?:بديل|جديد|ك)\s+(.+)/i.test(clean)) {
    const nameMatch = clean.match(/(?:غير|غيّر|عدل|عدّل|حول|حوّل)\s+(?:اسمك|لقبك|نكك)\s+(?:الى|إلى|لـ|ل|الي|إلي)\s+(.+)/i) ||
                      clean.match(/(?:سميني|سمني|سمّيني|سماني)\s+(.+)/i) ||
                      clean.match(/(?:استخدم|خلي)\s+(?:اسم|لقب)\s+(?:.+\s+)?(?:بديل|جديد|ك)\s+(.+)/i);
    const desiredName = nameMatch?.[1]?.trim()?.replace(/^['"`]+|['"`]+$/g, '');
    if (desiredName && desiredName.length <= 32) {
      return [{
        id: 'change_nickname',
        tool: 'edit_bot_profile',
        args: { nickname: desiredName },
      }];
    }
  }

  // ============================================================
  // النمط 2: طرد من الروم الصوتي / فصل صوتي
  // "اطرد X من الروم" / "افصل X من الفويس" / "دسكن X"
  // "ديسكنكت X" / "اطرده من الفويس"
  // ============================================================
  // Broad patterns to catch any voicekick intent
  const wantsVoiceKick =
    /(?:دسكونكت|دسكنوكت|ديسكونكت|ديسكنكت|voice\s*kick|voicekick|disconnect)\s*(?:<@!?\d{17,20}>|\S+)?/i.test(clean) ||
    /(?:افصل|فصل|طلعه|اطرده|طرده|اطرد|طرد)\s*(?:<@!?\d{17,20}>|\S+)?\s*(?:من\s+)?(?:الروم|الفويس|الصوتي|الصوت|الشات|الroom|الvoice)?/i.test(clean) ||
    /(?:عطه|اعطه)\s*(?:دسكونكت|دسكنوكت|ديسكونكت|ديسكنكت|voice\s*kick)/i.test(clean) ||
    /(?:دسكن|ديسكنكت)\s*(?:<@!?\d{17,20}>|\S+)/i.test(clean);

  const userLimit = clean.match(/(?:حد|عدد|الا|فقط|بس)\D{0,25}(\d{1,2})\s*(?:اشخاص|اشخاصا|شخص|members?|users?)?/i) ||
                   clean.match(/(?:user\s*limit|voice\s*limit)\D{0,12}(\d{1,2})/i);
  const userLimitValue = userLimit ? parseInt(userLimit[1], 10) : undefined;
  const validUserLimit = userLimitValue !== undefined && Number.isInteger(userLimitValue) && userLimitValue >= 0 && userLimitValue <= 99;

  if (wantsVoiceKick || validUserLimit) {
    const steps: WorkflowStep[] = [];
    if (wantsVoiceKick) {
      const memberMention = clean.match(/<@!?(\d{17,20})>/);
      const memberId = memberMention?.[1];
      const memberRaw = clean.match(/\b(\d{17,20})\b/);
      const resolvedId = memberId || (memberRaw ? memberRaw[1] : null);
      if (resolvedId) {
        steps.push({
          id: 'voice_kick_member',
          tool: 'manage_members',
          args: {
            action: 'voicekick',
            memberId: resolvedId,
            data: { reason: 'طلب فصل صوتي' },
          },
        });
      }
    }
    if (validUserLimit) {
      steps.push({
        id: 'set_user_limit',
        tool: 'channel_operations',
        args: { action: 'voice_set_user_limit', value: userLimitValue },
        dependsOn: steps.length > 0 ? steps[steps.length - 1].id : undefined,
      });
    }
    if (steps.length > 0) return steps;
  }

  // ============================================================
  // النمط 3: مسح صلاحيات المنشن من كاتقوري
  // "شيل المنشن من كل الرومات" / "امنع المنشن من الكاتقوري"
  // "اسحب منشن everyone" / "شيل المنشن من كل القنوات"
  // ============================================================
  const wantsMentionSweep =
    /(?:اسحب|شيل|امنع|امسح|احذف|حطها?\s*x|حط\s*x|deny|remove|الغِ)\s*(?:ال)?(?:منشن|mention)\s*(?:ال)?(?:everyone|here|الكل|هنا)?/i.test(clean) ||
    /(?:منشن|mention)\s*(?:ال)?(?:everyone|here|الكل)\s*(?:من|على|في)\s*(?:كل|الكل|الرومات|القنوات|الكاتقوري|الفئه)/i.test(clean);

  const wantsCategoryScope = /(?:كاتقوري|فئه|تصنيف|كل\s+الرومات|كل\s+القنوات|كل\s+الروم|all\s+channels?)/i.test(clean);
  const wantsIncludeRoles = /(?:حتئ\s*لو|حتى\s*لو|حتى\s*و|حتئ\s*و|ولو|وشمل|all\s*roles|individual\s*roles|الرولات|الرتب)/i.test(clean);

  if (wantsMentionSweep && wantsCategoryScope) {
    const categoryId = clean.match(/(\d{17,20})/)?.[1];
    if (categoryId) {
      return [{
        id: 'sweep_mentions',
        tool: 'sweep_permission_overwrites',
        args: {
          categoryId,
          permissions: ['MentionEveryone'],
          includeEveryone: true,
          includeRoles: true,
          includeMembers: true,
        },
      }];
    }
  }

  // ============================================================
  // النمط 4: قالب متجر بسيط ومحدود
  // "سو متجر بسيط"
  // ============================================================
  if (/(?:سو|سوي|انشئ|أنشئ|اصنع).*(?:متجر|ستور|store).*(?:بسيط|خفيف|مختصر|minimal|simple)?/i.test(clean)) {
    return [
      {
        id: 'create_store_category',
        tool: 'create_channels',
        args: { type: 'category', names: ['المتجر'] },
      },
      {
        id: 'create_store_channels',
        tool: 'create_channels',
        dependsOn: 'create_store_category',
        args: {
          type: 'text',
          categoryId: '$create_store_category.channelId',
          names: ['📢・إعلانات-المتجر', '🛒・الطلبات', '💬・استفسارات', '✅・الآراء'],
        },
      },
    ];
  }

  // ============================================================
  // النمط 5: إنشاء روم واحد مع صلاحيات مسبقة
  // "سو لي روم فويس اسمه Room1 الكل يشوفه بس محد يقدر يدخله"
  // ============================================================
  const singleChannel = extractSingleChannelRequest(clean);
  if (singleChannel) {
    const isVoice = /(?:فويس|صوتي)/i.test(singleChannel[1]);

    // إذا في صلاحيات ← أضفها في نفس خطوة الإنشاء
    if (hasPermissionRequest(clean)) {
      const parsedPermissions = parseArabicPermissions(clean);
      if (parsedPermissions.length > 0) {
        const toAllowDeny = (sourceText: string) => {
          const parsed = parseArabicPermissions(sourceText);
          const deny = [...new Set(parsed.filter((p) => p.type === 'deny').map((p) => p.name))];
          const deniedSet = new Set(deny);
          const allow = [...new Set(parsed.filter((p) => p.type === 'allow' && !deniedSet.has(p.name)).map((p) => p.name))];
          return { allow, deny };
        };
        const { allow, deny } = toAllowDeny(clean);

        const hasExceptionRole = /(?:إلا|الا)\s+(?:اللي|الي)?\s*(?:معه|عنده)?\s*(?:رتبة|رتبت|رول)\s+/i.test(clean);
        const exceptionRole = extractExceptionRole(clean);
        const roleTarget = extractRoleTarget(clean);

        if ((hasExceptionRole && exceptionRole) || roleTarget) {
          const channelType = isVoice ? 'voice' : 'text';
          const targetRole = exceptionRole ?? roleTarget!;
          const split = splitEveryoneAndRolePermissions(clean);
          const everyonePerms = hasExceptionRole
            ? { allow, deny }
            : toAllowDeny(split.everyoneText);
          const rolePermsBase = hasExceptionRole
            ? { allow: ['ViewChannel', 'Connect', 'SendMessages', 'Speak', 'ReadMessageHistory'], deny: [] as string[] }
            : toAllowDeny(split.roleText);
          if (isVoice && rolePermsBase.allow.some((permission) => ['Speak', 'Stream', 'UseEmbeddedActivities'].includes(permission))) {
            rolePermsBase.allow = [...new Set(['ViewChannel', 'Connect', ...rolePermsBase.allow])];
          }
          if (!isVoice && rolePermsBase.allow.includes('SendMessages')) {
            rolePermsBase.allow = [...new Set(['ViewChannel', 'ReadMessageHistory', ...rolePermsBase.allow])];
          }

          return [
            {
              id: 'create_channel',
              tool: 'create_channels',
              args: {
                type: channelType,
                names: [singleChannel[2]],
              },
            },
            {
              id: 'set_everyone_perms',
              tool: 'edit_permissions',
              dependsOn: 'create_channel',
              args: {
                channelId: '$create_channel.channelId',
                targetId: '@everyone',
                targetType: 'role',
                allow: everyonePerms.allow,
                deny: everyonePerms.deny,
              },
            },
            {
              id: 'set_role_perms',
              tool: 'edit_permissions',
              dependsOn: 'create_channel',
              args: {
                channelId: '$create_channel.channelId',
                targetId: targetRole,
                targetType: 'role',
                allow: rolePermsBase.allow,
                deny: rolePermsBase.deny,
              },
            },
          ];
        }

        // Simple: create with embedded permissions
        return [{
          id: 'create_configured_channel',
          tool: 'create_channels',
          args: {
            type: isVoice ? 'voice' : 'text',
            names: [singleChannel[2]],
            permissions: [{
              id: '@everyone',
              allow,
              deny,
            }],
          },
        }];
      }
    }

    // Voice room with user limit (no special permissions)
    if (isVoice && validUserLimit) {
      return [
        {
          id: 'create_voice',
          tool: 'create_channels',
          args: {
            type: 'voice',
            names: [singleChannel[2]],
          },
        },
        {
          id: 'set_voice_limit',
          tool: 'channel_operations',
          dependsOn: 'create_voice',
          args: {
            action: 'voice_set_user_limit',
            channelId: '$create_voice.createdEntities[0].id',
            value: userLimitValue,
          },
        },
      ];
    }

    return [{
      id: 'create_channel',
      tool: 'create_channels',
      args: {
        type: isVoice ? 'voice' : 'text',
        names: [singleChannel[2]],
      },
    }];
  }

  // ============================================================
  // النمط 6: إنشاء كاتقوري + رومات داخلها + رتبة
  // "سو كاتقوري اسمه X ورتبة Y"
  // ============================================================
  const requestsCategory = /(?:سو|سوي|انشئ|أنشئ|اصنع).*(?:كاتقوري|فئه)/i.test(clean);
  const requestsText = /(?:روم|قناه)\s+(?:تكست|نصي)/i.test(clean);
  const requestsVoice = /(?:روم|قناه)\s+(?:فويس|صوتي)/i.test(clean);
  const requestsRole = /(?:سو|سوي|انشئ|أنشئ|اصنع).*(?:رتبه|رول)/i.test(clean);

  if (requestsCategory || requestsText || requestsVoice || requestsRole) {
    const extracted = extractCategoryAndRooms(clean);
    if (extracted) {
      const { categoryName, roleName } = extracted;
      return [
        {
          id: 'create_category',
          tool: 'create_channels',
          args: { type: 'category', names: [categoryName] },
        },
        {
          id: 'create_text',
          tool: 'create_channels',
          dependsOn: 'create_category',
          args: {
            type: 'text',
            names: [safeChannelName(categoryName, 'chat')],
            categoryId: '$create_category.channelId',
          },
        },
        {
          id: 'create_voice',
          tool: 'create_channels',
          dependsOn: 'create_category',
          args: {
            type: 'voice',
            names: [safeChannelName(categoryName, 'voice')],
            categoryId: '$create_category.channelId',
          },
        },
        {
          id: 'create_role',
          tool: 'manage_roles',
          args: {
            action: 'create',
            roleData: { name: roleName },
          },
        },
        {
          id: 'configure_role',
          tool: 'edit_permissions',
          dependsOn: ['create_category', 'create_role'],
          args: {
            channelId: '$create_category.channelId',
            targetId: '$create_role.roleId',
            targetType: 'role',
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'Connect', 'Speak', 'Stream'],
            deny: [],
          },
        },
      ];
    }
  }

  // ============================================================
  // النمط 7: رومات متعددة مع استثناء واحد
  // "سو لي 3 رومات كلهم عام الا واحد اسمه خاص ومقفل"
  // ============================================================
  const multiRoomPattern = clean.match(
    /(?:سو|سوي|انشئ|أنشئ|اصنع)\s+(?:لي\s+)?(\d+)\s+(?:رومات?|قنوات?)\s+(.*?)(?:الا|إلا|بس|لكن)\s+(?:واحد|وحده)\s+(?:بس\s+)?(?:يكون\s+)?اسمه\s+([^\s،,]+)(.*)/i
  );
  if (multiRoomPattern) {
    const count = parseInt(multiRoomPattern[1], 10);
    const names: string[] = [];
    for (let i = 1; i < count; i++) names.push(`عام-${i}`);
    names.push(multiRoomPattern[3]); // the named one
    const rest = multiRoomPattern[4] || '';
    const hasVisibility = /(?:يشوف|يخش|يدخل|مقفول|مقفل)/i.test(rest);
    if (hasVisibility) {
      const permissions = parseArabicPermissions(clean);
      const allow = [...new Set(permissions.filter((p) => p.type === 'allow').map((p) => p.name))];
      const deny = [...new Set(permissions.filter((p) => p.type === 'deny').map((p) => p.name))];
      return [{
        id: 'create_rooms',
        tool: 'create_channels',
        args: { type: 'text', names, permissions: allow.length || deny.length ? [{ id: '@everyone', allow, deny }] : undefined },
      }];
    }
    return [{
      id: 'create_rooms',
      tool: 'create_channels',
      args: { type: 'text', names },
    }];
  }

  // ============================================================
  // النمط 8: حذف + إبقاء + إنشاء
  // "احذف كل الرومات وابق الو + سو لي متجر بسيط"
  // ============================================================
  const deletePreserveCreate = clean.match(
    /(?:احذف|حذف|امسح).*?(?:ابقي?|ابق|خليني?|خلي|اترك).*?(?:\+|و)\s*(?:سو|سوي|انشئ|أنشئ|اصنع)/i
  );
  if (deletePreserveCreate) {
    const steps: WorkflowStep[] = [{
      id: 'delete_preserve',
      tool: 'delete_channels',
      args: {},
    }];
    if (/(?:متجر|ستور|store)/i.test(clean)) {
      steps.push({
        id: 'build_store',
        tool: 'execute_community_build',
        dependsOn: 'delete_preserve',
        args: { blueprintType: 'store' },
      });
    }
    return steps;
  }

  return [];
}
