import {
  ADVANCED_ACTION_GROUPS,
  AdvancedActionGroup,
  AdvancedDiscordAction,
  requiredPermissionForAdvancedAction,
} from '../../utils/advancedDiscordActions.js';
import {
  SkillCategory,
  SkillDefinition,
  SkillRegistry,
} from '../skill_registry.js';

const CATEGORY_BY_GROUP: Record<AdvancedActionGroup, SkillCategory> = {
  channel_operations: 'channel_management',
  thread_operations: 'channel_management',
  message_operations: 'community',
  webhook_operations: 'automation',
  role_operations: 'role_management',
  guild_operations: 'community',
  expression_operations: 'community',
  automod_operations: 'anti_spam',
  event_operations: 'community',
  analytics_operations: 'analytics',
};

function humanize(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function createAdvancedSkill(
  group: AdvancedActionGroup,
  action: AdvancedDiscordAction
): SkillDefinition {
  const readableName = humanize(action);
  return {
    id: action,
    name: readableName,
    nameAr: readableName,
    category: CATEGORY_BY_GROUP[group],
    description: `Execute the Discord operation: ${readableName}.`,
    descriptionAr: `تنفيذ عملية ديسكورد: ${readableName}.`,
    triggers: [action, readableName.toLowerCase()],
    triggersAr: [action],
    requiredPermissions: [requiredPermissionForAdvancedAction(action)],
    schema: {
      type: 'object',
      properties: {
        channelId: { type: 'string' },
        categoryId: { type: 'string' },
        roleId: { type: 'string' },
        memberId: { type: 'string' },
        messageId: { type: 'string' },
        webhookId: { type: 'string' },
        eventId: { type: 'string' },
        ruleId: { type: 'string' },
        emojiId: { type: 'string' },
        name: { type: 'string' },
        content: { type: 'string' },
        description: { type: 'string' },
        topic: { type: 'string' },
        color: { type: 'string' },
        reason: { type: 'string' },
        url: { type: 'string' },
        enabled: { type: 'boolean' },
        value: { type: 'number' },
        position: { type: 'integer' },
        count: { type: 'integer' },
        duration: { type: 'integer' },
        memberIds: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
      },
      additionalProperties: true,
    },
    examples: [],
    execute: (params) => SkillRegistry.executeToolAdapter(
      group,
      { ...params.args, action },
      params
    ),
  };
}

const skills: SkillDefinition[] = Object.entries(ADVANCED_ACTION_GROUPS).flatMap(
  ([group, actions]) => actions.map((action) =>
    createAdvancedSkill(group as AdvancedActionGroup, action as AdvancedDiscordAction)
  )
);

export default skills;
