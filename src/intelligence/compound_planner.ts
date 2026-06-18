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

function extractSingleChannelRequest(clean: string): RegExpMatchArray | null {
  const explicitName = clean.match(
    /(?:سو|سوي|انشئ|أنشئ|اصنع)\s+(?:لي\s+)?(?:روم|قناه)\s+(تكست|نصي|فويس|صوتي)\s+(?:اسمه|اسمها|باسم)\s+([^\s،,]+)/i
  );
  if (explicitName) return explicitName;

  const looseName = clean.match(
    /(?:سو|سوي|انشئ|أنشئ|اصنع)\s+(?:لي\s+)?(?:روم|قناه)\s+(تكست|نصي|فويس|صوتي)\s+(.+?)(?=\s+(?:و?خل|و?خلي|وحط|حط|مع|بس|لكن|الكل|الجميع|كل\s+الناس|everyone)(?:\s|$)|$)/i
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

export function planCompoundDiscordRequest(text: string): WorkflowStep[] {
  const clean = normalized(text);
  const singleChannel = extractSingleChannelRequest(clean);
  if (singleChannel && /(?:الكل|الجميع|كل\s+الناس|everyone)/i.test(clean)) {
    const parsedPermissions = parseArabicPermissions(clean);
    if (parsedPermissions.length > 0) {
      const deny = [...new Set(
        parsedPermissions
          .filter((permission) => permission.type === 'deny')
          .map((permission) => permission.name)
      )];
      const denied = new Set(deny);
      const allow = [...new Set(
        parsedPermissions
          .filter((permission) => permission.type === 'allow' && !denied.has(permission.name))
          .map((permission) => permission.name)
      )];
      return [{
        id: 'create_configured_channel',
        tool: 'create_channels',
        args: {
          type: /(?:فويس|صوتي)/i.test(singleChannel[1]) ? 'voice' : 'text',
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

  const requestsCategory = /(?:سو|سوي|انشئ|اصنع).*(?:كاتقوري|فئه)/i.test(clean);
  const requestsText = /(?:روم|قناه)\s+(?:تكست|نصي)/i.test(clean);
  const requestsVoice = /(?:روم|قناه)\s+(?:فويس|صوتي)/i.test(clean);
  const requestsRole = /(?:سو|سوي|انشئ|اصنع).*(?:رتبه|رول)/i.test(clean);
  // Multi-room creation with naming + visibility pattern
  // e.g., "سو لي 3 رومات كلهم عام الا واحد اسمه خاص ومقفل"
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

  // Delete + preserve + create pattern
  // e.g., "احذف كال رومات الموجود بس ابق الو + سو لي متجر بسيط"
  const deletePreserveCreate = clean.match(
    /(?:احذف|حذف|امسح).*?(?:ابقي?|ابق|خليني?|خلي|اترك).*?(?:\+|و)\s*(?:سو|سوي|انشئ|أنشئ|اصنع)/i
  );
  if (deletePreserveCreate) {
    const steps: WorkflowStep[] = [{
      id: 'delete_preserve',
      tool: 'delete_channels',
      args: { _confirmed: true },
    }];
    if (/(?:متجر|ستور|store)/i.test(clean)) {
      steps.push({
        id: 'build_store',
        tool: 'execute_community_build',
        args: { blueprintType: 'store' },
      });
    }
    return steps;
  }

  if (!requestsCategory || !requestsText || !requestsVoice || !requestsRole) return [];

  const categoryName = clean.match(
    /(?:كاتقوري|فئه)\s+(?:اسمها|اسمه|باسم)\s+([^\s،,]+)/
  )?.[1];
  const roleName = clean.match(
    /(?:رتبه|رول)\s+([^\s،,]+)(?=\s+(?:تشوف|تدخل|تكتب|لها|فيها|$))/
  )?.[1] ?? categoryName;
  if (!categoryName || !roleName) return [];

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
        allow: [
          'ViewChannel',
          'SendMessages',
          'ReadMessageHistory',
          'Connect',
          'Speak',
          'Stream',
        ],
        deny: [],
      },
    },
  ];
}
