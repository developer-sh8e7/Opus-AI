import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'get_member_info',
  name: 'Member information',
  nameAr: 'معلومات العضو',
  category: 'utility',
  description: 'Get a member profile, roles, and permissions.',
  triggers: ['member info'],
  triggersAr: ['معلومات العضو'],
  requiredPermissions: [],
  toolName: 'get_member_info',
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
