import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'create_channels',
  name: 'Create channels',
  nameAr: 'إنشاء رومات',
  category: 'channel_management',
  description: 'Create text, voice, or category channels.',
  descriptionAr: 'إنشاء رومات نصية أو صوتية أو كاتقوري.',
  triggers: ['create channel', 'create room'],
  triggersAr: ['سو روم', 'أنشئ قناة', 'سوي كاتقوري'],
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  toolName: 'create_channels',
  schema: {
    type: 'object',
    properties: {
      type: { enum: ['text', 'voice', 'category'] },
      names: { type: 'array', items: { type: 'string' } },
      categoryId: { type: 'string' },
      permissions: { type: 'array' },
    },
    required: ['type', 'names'],
  },
  examples: [{ input: 'سو روم تكست اسمه rules', args: { type: 'text', names: ['rules'] } }],
});
