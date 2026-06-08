import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'voice_mute',
  name: 'Server mute member',
  nameAr: 'ميوت صوتي للعضو',
  category: 'moderation',
  description: 'Enable or disable server mute for a voice member.',
  descriptionAr: 'تفعيل أو إلغاء الميوت الصوتي عن عضو.',
  triggers: ['server mute'],
  triggersAr: ['سو له ميوت صوتي', 'فك الميوت الصوتي'],
  requiredPermissions: [PermissionFlagsBits.MuteMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({
    action: 'mute_voice',
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
