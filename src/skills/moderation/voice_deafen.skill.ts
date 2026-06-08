import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'voice_deafen',
  name: 'Server deafen member',
  nameAr: 'ديفن صوتي للعضو',
  category: 'moderation',
  description: 'Enable or disable server deafen for a voice member.',
  descriptionAr: 'تفعيل أو إلغاء الديفن الصوتي عن عضو.',
  triggers: ['server deafen'],
  triggersAr: ['سو له ديفن', 'فك الديفن'],
  requiredPermissions: [PermissionFlagsBits.DeafenMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({
    action: 'deafen',
    memberId: args.memberId,
    data: { enabled: args.enabled ?? true, reason: args.reason },
  }),
  schema: {
    type: 'object',
    properties: {
      memberId: { type: 'string' },
      enabled: { type: 'boolean' },
      reason: { type: 'string' },
    },
    required: ['memberId'],
  },
  examples: [],
});
