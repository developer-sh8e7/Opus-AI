# Opus Ai Research Results

Research date: 2026-06-09

## Discord permissions

Primary sources:

- https://docs.discord.com/developers/topics/permissions
- https://discord.js.org/docs/packages/discord.js/main/PermissionOverwrites%3AClass
- https://discord.js.org/docs/packages/discord.js/main/PermissionsBitField%3AClass

Findings applied:

- `ViewChannel` controls visibility; `Connect` controls joining voice and stage channels.
- Denying `ViewChannel` implicitly makes other channel permissions unusable.
- Denying `Connect` prevents voice entry without hiding the channel.
- Targeted `permissionOverwrites.edit()` is safer than replacing all overwrites.
- Permission values remain `bigint` and execution stays behind role, member, bot, and hierarchy checks.

## Channels, audit logs, AutoMod, and rate limits

Primary sources:

- https://docs.discord.com/developers/resources/channel
- https://docs.discord.com/developers/resources/audit-log
- https://docs.discord.com/developers/resources/auto-moderation
- https://docs.discord.com/developers/topics/rate-limits

Findings applied:

- Created channels and dependent workflows must pass exact returned snowflake IDs.
- Audit reasons are retained by Discord and should remain concise.
- AutoMod management requires `ManageGuild`; timeout actions additionally require `ModerateMembers`.
- Discord route limits must not be hard-coded; discord.js remains responsible for REST buckets.

## Open-source Discord bot patterns

Reviewed sources:

- https://github.com/discordjs/discord.js
- https://github.com/Androz2091/AtlantaBot
- https://github.com/ZeppelinBot/Zeppelin

Reusable architectural patterns:

- Separate command/skill metadata from execution.
- Centralize permission checks and audit logs.
- Keep guild configuration and session state isolated.
- Prefer native Discord features for AutoMod, slowmode, audit logs, and permission overwrites.

No third-party implementation was copied. The project keeps its own interfaces and execution layer.

## Arabic NLP

Primary sources:

- https://github.com/CAMeL-Lab/camel_tools
- https://camel-tools.readthedocs.io/en/master/api/dialectid.html
- https://aclanthology.org/2024.arabicnlp-1.79/

Decision:

CAMeL Tools is Python-based and its dialect identification component is unavailable on Windows. Adding it to this TypeScript Render service would increase deployment complexity. Opus therefore uses deterministic Gulf-Arabic normalization for dangerous Discord intents and leaves open-ended language understanding to the configured external AI providers.

## Memory architecture

Session memory uses bounded turns, exact entity IDs, TTL cleanup, and conversation-channel preference. This avoids the two common failures: inventing an ID and applying a follow-up request to an entity created in another conversation.
