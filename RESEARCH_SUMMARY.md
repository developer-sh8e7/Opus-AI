# Opus Discord Research Summary

This document records implementation decisions taken from primary Discord and discord.js sources.
It intentionally avoids copying third-party bot code or installing packages that duplicate
discord.js features already available in the project.

## Permissions

Sources:

- https://docs.discord.com/developers/topics/permissions
- https://discord.js.org/docs/packages/discord.js/main/PermissionOverwriteManager%3AClass
- https://discord.js.org/docs/packages/discord.js/main/PermissionsBitField%3AClass

Key findings:

- Permissions are variable-length integers and must be handled as `bigint`.
- `Administrator` bypasses channel overwrites.
- Channel overwrite order is: `@everyone`, combined role overwrites, then member overwrite.
- Denying `ViewChannel` makes other channel permissions ineffective.
- Denying `SendMessages` makes message-dependent permissions ineffective.
- Denying `Connect` makes voice-dependent permissions ineffective.
- A bot can only manage roles and members below its highest role.
- `permissionOverwrites.edit()` creates or updates an overwrite without replacing unrelated entries.
- `permissionOverwrites.set()` replaces the complete overwrite collection and must be used carefully.

Implementation decisions:

- Continue using targeted `permissionOverwrites.edit()` calls.
- Validate invoker permissions and bot hierarchy before every administrative action.
- Parse Arabic permission phrases into discord.js permission names before execution.
- Preserve Zero-Trust: AI selects intent; TypeScript resolves targets and validates execution.

## Channels

Sources:

- https://docs.discord.com/developers/resources/channel
- https://discord.js.org/docs/packages/discord.js/14.19.3/GuildChannel%3AClass
- https://discord.js.org/docs/packages/discord.js/main/GuildChannelEditOptions%3AInterface

Key findings:

- Guild channel types include text, voice, category, announcement, stage, forum, and media.
- Categories can contain up to 50 channels.
- Guild channels support clone, delete, edit, parent changes, positions, and permission overwrites.
- Editable settings differ by channel type: topic/NSFW/slowmode for text, bitrate/user limit/region
  for voice, and tags/layout settings for forums.
- A channel is permission-synced only while its overwrites match its parent category.

Implementation decisions:

- Track created channel IDs and parent category IDs in `EntityRegistry`.
- Resolve Arabic implicit references such as "الروم" and "فيها" from recent entities.
- Return IDs from creation tools so compound workflows never search by name.

## Audit Logs

Source:

- https://docs.discord.com/developers/resources/audit-log

Key findings:

- Reading audit logs requires `ViewAuditLog`.
- Entries are retained for 45 days.
- Administrative API actions should include an audit reason when supported.
- Audit log reasons support up to 512 URL-encoded UTF-8 characters.

Implementation decisions:

- Keep concise reasons on Discord mutations.
- Emit structured local tool audit logs with guild, user, tool, duration, arguments, and result.

## Auto Moderation

Sources:

- https://docs.discord.com/developers/resources/auto-moderation
- https://discord.js.org/docs/packages/discord.js/14.19.3/AutoModerationRuleManager%3AClass

Key findings:

- Native AutoMod supports keyword, preset, mention-spam, and member-profile triggers.
- Actions include blocking messages, alerting a channel, timing out a member, and blocking interaction.
- Rule management requires `ManageGuild`; timeout actions also require `ModerateMembers`.
- Native limits include 20 exempt roles, 50 exempt channels, and a four-week timeout maximum.

Implementation decisions:

- Prefer native Discord AutoMod for persistent filters instead of only message-event regex checks.
- Expose AutoMod skills only when their permission and schema validation are implemented.

## Rate Limits

Source:

- https://docs.discord.com/developers/topics/rate-limits

Key findings:

- Discord route limits are dynamic and must not be hard-coded.
- REST clients should honor `Retry-After`, `X-RateLimit-Bucket`, and reset headers.
- Discord's global bot limit is currently 50 requests per second, but route limits still apply.
- Invalid `401`, `403`, and `429` requests contribute to a 10,000 requests per 10 minutes limit.

Implementation decisions:

- Let discord.js manage Discord REST buckets.
- Add application-level AI limits: 5 requests per user and 20 per guild per minute.
- Queue concurrent AI work per guild to smooth bursts.
- Stop retrying authentication failures and use bounded backoff for transient provider errors.

## AI Providers

Sources:

- https://console.groq.com/docs/openai
- https://console.groq.com/docs/api-reference
- https://inference-docs.cerebras.ai/api-reference
- https://inference-docs.cerebras.ai/models/zai-glm-47
- https://inference-docs.cerebras.ai/resources/glm-47-migration

Key findings:

- Groq exposes an OpenAI-compatible Chat Completions endpoint and supports local function tools.
- Groq does not accept `messages[].name`, so outbound messages must omit that field.
- Cerebras Chat Completions supports function tools and the `zai-glm-4.7` model.
- GLM 4.7 supports `reasoning_effort="none"` for lower-latency agent routing.
- Tool definitions consume context and too many tools reduce routing quality.

Implementation decisions:

- Use the Groq fast model for ordinary chat and the smart model for administrative intent.
- Send only intent-relevant tools instead of the complete tool catalog on every request.
- Retry bounded transient failures, including HTTP 429, then fall back to Cerebras.
- Keep each provider request under eight seconds and return one stable Arabic error if both fail.
- Remove the corrupted 14,000-line pseudo-training database; static examples inside source code do not train either provider.

## Architecture Blueprint

- `ContextEngine`: short-lived conversation context and language state.
- `EntityRegistry`: guild-isolated recent entity IDs with TTL and disk persistence.
- `WorkflowEngine`: ordered steps with explicit dependencies and result references.
- `SkillRegistry`: dynamically loads only executable skill modules.
- `arabic_nlp`: deterministic Gulf Arabic intent and permission parsing.
- Existing Discord tool router remains the single permission-checked execution boundary.

The skill count reported to AI must always equal the number of executable registered skills.

## Expanded Executable Skill Catalog

Primary references:

- https://discord.js.org/docs/packages/discord.js/main
- https://discord.js.org/docs/packages/discord.js/main/ClientEventTypes%3AInterface
- https://docs.discord.com/developers/resources/auto-moderation
- https://docs.discord.com/developers/resources/guild-scheduled-event

The executable registry now exposes 119 skills. The advanced skills are backed by real
discord.js operations grouped into channel, thread, message, webhook, role, guild, expression,
AutoMod, scheduled-event, and analytics executors. They are not placeholder files: every
registered advanced skill routes to an implemented action and still passes through the central
permission validator and structured audit logger.
