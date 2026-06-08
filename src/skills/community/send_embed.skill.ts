import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'send_embed',
  name: 'Send custom embed',
  nameAr: 'إرسال إيمبد مخصص',
  category: 'community',
  description: 'Send a polished embed with title, fields, images, color, and footer.',
  descriptionAr: 'يرسل إيمبد مرتب ومخصص مع عنوان وحقول وصور ولون وتذييل.',
  triggers: ['send embed', 'create embed', 'announcement embed'],
  triggersAr: ['سو إيمبد', 'ارسل إيمبد', 'إيمبد متجر', 'إعلان مرتب'],
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  toolName: 'send_embed',
  schema: {
    type: 'object',
    properties: {
      channelId: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      color: { type: 'string' },
      footer: { type: 'string' },
      imageUrl: { type: 'string' },
      thumbnailUrl: { type: 'string' },
      fields: { type: 'array' },
    },
    required: ['channelId', 'description'],
  },
  examples: [{
    input: 'سو إيمبد ترحيب مرتب في روم الترحيب',
    args: {
      channelId: 'channel_id',
      title: 'أهلًا وسهلًا',
      description: 'نورت المتجر، اقرأ القوانين ثم افتح تذكرة للطلب.',
      color: '#5865F2',
    },
  }],
});
