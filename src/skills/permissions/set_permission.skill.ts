import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'edit_permissions',
  name: 'Edit channel permissions',
  nameAr: 'تعديل برمشن الروم',
  category: 'permissions',
  description: 'Set channel permission overwrites for a role or member.',
  triggers: ['set permissions', 'channel permissions'],
  triggersAr: ['عدل البرمشن', 'خلي الرتبة تشوف', 'امنع الرتبة'],
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  toolName: 'edit_permissions',
  schema: {
    type: 'object',
    properties: {
      channelId: { type: 'string' },
      targetId: { type: 'string' },
      targetType: { enum: ['role', 'member'] },
      allow: { type: 'array', items: { type: 'string' } },
      deny: { type: 'array', items: { type: 'string' } },
    },
    required: ['channelId', 'targetId', 'targetType', 'allow', 'deny'],
  },
  examples: [],
});
