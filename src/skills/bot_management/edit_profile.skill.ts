import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'edit_bot_profile',
  name: 'Edit bot profile',
  nameAr: 'تعديل اسم أو صورة البوت',
  category: 'bot_management',
  description: 'Change the bot username or avatar.',
  triggers: ['change your name', 'change bot avatar'],
  triggersAr: ['غير اسمك', 'غير صورتك'],
  requiredPermissions: [],
  toolName: 'edit_bot_profile',
  schema: {
    type: 'object',
    properties: { username: { type: 'string' }, avatarUrl: { type: 'string' } },
  },
  examples: [],
});
