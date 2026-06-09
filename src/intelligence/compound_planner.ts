import type { WorkflowStep } from './context_engine.js';

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

export function planCompoundDiscordRequest(text: string): WorkflowStep[] {
  const clean = normalized(text);
  const requestsCategory = /(?:سو|سوي|انشئ|اصنع).*(?:كاتقوري|فئه)/i.test(clean);
  const requestsText = /(?:روم|قناه)\s+(?:تكست|نصي)/i.test(clean);
  const requestsVoice = /(?:روم|قناه)\s+(?:فويس|صوتي)/i.test(clean);
  const requestsRole = /(?:سو|سوي|انشئ|اصنع).*(?:رتبه|رول)/i.test(clean);
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
      dependsOn: 'create_role',
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
