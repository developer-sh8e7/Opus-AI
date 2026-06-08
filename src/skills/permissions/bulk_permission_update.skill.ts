import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'bulk_permission_update',
  name: 'Bulk permission update',
  nameAr: 'تعديل برمشن عدة رومات',
  category: 'permissions',
  description: 'Apply a permission overwrite to channels or an entire category.',
  descriptionAr: 'تطبيق نفس البرمشن على عدة رومات أو كل رومات كاتقوري.',
  triggers: ['bulk permissions', 'all channels in category'],
  triggersAr: ['كل الرومات', 'في الكاتقوري', 'عدل البرمشن للجميع'],
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  toolName: 'bulk_permission_update',
  schema: {
    type: 'object',
    properties: {
      channelIds: { type: 'array', items: { type: 'string' } },
      categoryId: { type: 'string' },
      targetId: { type: 'string' },
      targetType: { enum: ['role', 'member'] },
      allow: { type: 'array', items: { type: 'string' } },
      deny: { type: 'array', items: { type: 'string' } },
    },
    required: ['targetId', 'targetType', 'allow', 'deny'],
  },
  examples: [],
});
