import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'manage_roles',
  name: 'Manage roles',
  nameAr: 'إدارة الرتب',
  category: 'role_management',
  description: 'Create, edit, delete, assign, or remove roles.',
  triggers: ['create role', 'give role', 'delete role'],
  triggersAr: ['أنشئ رتبة', 'عطه رول', 'احذف الرتبة'],
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  toolName: 'manage_roles',
  schema: {
    type: 'object',
    properties: {
      action: { enum: ['create', 'delete', 'edit', 'assign', 'remove'] },
      roleData: { type: 'object' },
      targetMemberId: { type: 'string' },
    },
    required: ['action', 'roleData'],
  },
  examples: [],
});
