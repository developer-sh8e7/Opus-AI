import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'purge',
  name: 'Purge messages',
  nameAr: 'مسح رسائل',
  category: 'moderation',
  description: 'Bulk delete recent messages in a channel.',
  triggers: ['purge', 'clear messages'],
  triggersAr: ['امسح الرسائل', 'نظف الشات'],
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  toolName: 'bulk_delete_messages',
  schema: {
    type: 'object',
    properties: {
      channelId: { type: 'string' },
      count: { type: 'number' },
      userId: { type: 'string' },
    },
    required: ['channelId', 'count'],
  },
  examples: [],
});
