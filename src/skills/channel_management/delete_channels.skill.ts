import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'delete_channels',
  name: 'Delete channels',
  nameAr: 'حذف الرومات',
  category: 'channel_management',
  description: 'Delete one or more Discord channels.',
  triggers: ['delete channel'],
  triggersAr: ['احذف الروم', 'امسح القناة'],
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  toolName: 'delete_channels',
  schema: {
    type: 'object',
    properties: { channelIds: { type: 'array', items: { type: 'string' } } },
    required: ['channelIds'],
  },
  examples: [],
});
