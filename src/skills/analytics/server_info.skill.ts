import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'get_server_info',
  name: 'Server information',
  nameAr: 'معلومات السيرفر',
  category: 'analytics',
  description: 'Get current channels, roles, members, IDs, and server structure.',
  triggers: ['server info'],
  triggersAr: ['معلومات السيرفر', 'وش الرومات'],
  requiredPermissions: [],
  toolName: 'get_server_info',
  schema: { type: 'object', properties: {} },
  examples: [],
});
