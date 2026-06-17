import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'sweep_permission_overwrites',
  name: 'Sweep channel permission overwrites',
  nameAr: 'فحص وسحب صلاحيات من رومات متعددة',
  category: 'permissions',
  description: 'Scan channels or category children and deny selected permissions for @everyone, roles, and member overwrites.',
  descriptionAr: 'يفحص رومات محددة أو كل رومات كاتقوري ويسحب صلاحيات مثل MentionEveryone من @everyone والرتب والأعضاء.',
  triggers: ['sweep permissions', 'remove mention everyone', 'deny mention everyone in category'],
  triggersAr: ['اسحب صلاحية المنشن من كل الرومات', 'امنع everyone و here من الرتب', 'افحص رومات الكاتقوري'],
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  toolName: 'sweep_permission_overwrites',
  schema: {
    type: 'object',
    properties: {
      channelIds: { type: 'array', items: { type: 'string' } },
      categoryId: { type: 'string' },
      permissions: { type: 'array', items: { type: 'string' } },
      includeEveryone: { type: 'boolean' },
      includeRoles: { type: 'boolean' },
      includeMembers: { type: 'boolean' },
    },
    required: ['permissions'],
  },
  examples: [{
    input: 'اسحب منشن everyone و here من كل الرومات في الكاتقوري حتى الرولات',
    args: {
      categoryId: '123456789012345678',
      permissions: ['MentionEveryone'],
      includeEveryone: true,
      includeRoles: true,
      includeMembers: true,
    },
  }],
});
