# Discord Roles and Hierarchy Knowledge

Use this reference whenever the bot creates roles, assigns roles, edits role colors/names/permissions, sets channel overwrites for roles, or checks whether a role/member action is allowed. Role hierarchy is mandatory for safe moderation and permission planning.

## Role object essentials

A Discord role includes:
- `id`: role snowflake.
- `name`: role name.
- `color` / `colors`: display color data; modern API also exposes role colors object.
- `hoist`: whether members with the role appear separately in the member list.
- `icon` / `unicode_emoji`: role icon or emoji where guild features allow.
- `position`: hierarchy position. Higher position outranks lower position.
- `permissions`: permission bitset.
- `managed`: integration/bot-managed role; usually cannot be edited like normal roles.
- `mentionable`: whether the role can be mentioned by users.
- `tags`: metadata for bot/integration/premium/subscription roles.
- `flags`: role feature bitfield.

## Creation and editing

When creating a role, decide:
- Name.
- Color.
- Hoist.
- Mentionable.
- Permission set.
- Intended hierarchy position.
- Whether it should be used in channel overwrites.

Critical: creating a role with permissions is not enough if channel overwrites deny needed permissions. For private channels, role creation and channel overwrite creation must be coordinated.

## Position and hierarchy

Role position controls what a role can do to others and what the bot can manage.

Rules:
- `@everyone` starts at position 0.
- A member’s highest role is what matters for hierarchy comparisons.
- A bot can grant roles lower than the bot’s highest role.
- A bot can edit/delete roles lower than its highest role.
- A bot cannot assign, edit, or delete roles at or above its highest role.
- A bot/user cannot moderate the guild owner.
- Equal role position is not enough; the actor must be strictly above the target.

## Bot role constraints

The bot must hold the relevant permission **and** its highest role must outrank the target role/member.

Examples:
- To assign role X, bot needs `ManageRoles` and bot highest role above X.
- To edit role X, bot needs `ManageRoles` and bot highest role above X.
- To ban/kick/timeout member Y, bot needs the action permission and bot highest role above Y’s highest role.
- To change channel overwrites, bot needs `ManageRoles`/Manage Permissions semantics and/or `ManageChannels` depending on operation, plus API constraints.

## Actor hierarchy constraints

For safety, this project should enforce both:
1. Bot can perform the action according to Discord.
2. Requesting actor is allowed to perform the action according to server policy and hierarchy.

Do not let a lower-ranked human use the bot as a proxy to act on a higher-ranked target.

## Permission set design

Safe role design:
- Keep `Administrator` limited to owners/top admins.
- Keep `ManageRoles`, `ManageChannels`, `MoveMembers`, `ManageWebhooks`, `BanMembers`, `KickMembers`, `ModerateMembers`, and `ManageMessages` out of public roles.
- Use channel overwrites for access segmentation instead of giving broad guild permissions.
- Use separate helper/mod roles for specific operational powers.

## Role server limits

Discord guilds have practical role limits and UI/hierarchy constraints. The bot should not create unbounded roles for every request. Prefer reusable roles for access groups and avoid per-user roles unless the design truly requires it.

## Common patterns

### Staff role
- Guild permissions: minimal required (`KickMembers`, `ModerateMembers`, `ManageMessages`, etc. only if needed).
- Channel overwrites: allow staff-only channels.
- Avoid `Administrator` unless absolutely required.

### Customer/member role
- Guild permissions: basic user permissions.
- Channel overwrites: access to purchased/private areas.
- No management permissions.

### Muted/timeout-style role
Discord timeout (`ModerateMembers`) is usually better than a custom muted role for broad chat/voice suppression. If using a muted role, deny `SendMessages`, `SendMessagesInThreads`, `Speak`, and optionally reactions/attachments in relevant channels; maintain overwrites consistently.

### Drag-helper role
- Grant `MoveMembers` only to this trusted role.
- Do not grant `MoveMembers` to `@everyone`.
- Ensure helper role cannot manage roles/channels unless intended.

## WRONG vs RIGHT from this project

### Restricted voice access
WRONG: Give `MoveMembers`/`ManageChannels` to `@everyone` so normal users can pull each other into a private room.

RIGHT: Keep `Connect` denied for `@everyone`; give `MoveMembers` only to a trusted role. Normal users should not receive channel/role management permissions.

### Role creation
WRONG: Create a role named “VIP” and assume it can see VIP channels.

RIGHT: Create the role, then add channel/category overwrites: deny `ViewChannel` to `@everyone`, allow `ViewChannel` (and needed send/connect permissions) to VIP.

### Bot proxy moderation
WRONG: If user has bot access, let them ban anyone the bot can ban.

RIGHT: Verify the actor’s highest role outranks the target and the bot’s highest role also outranks the target.

### ManageRoles misunderstanding
WRONG: Grant `ManageRoles` to a public/helper role because they “only need permissions in one room.”

RIGHT: Use channel overwrites for room access. `ManageRoles` is broad and can modify roles/permissions below the actor’s role.

## discord.js v14 surfaces

- `Role`: inspect `id`, `name`, `position`, `permissions`, `managed`, `mentionable`, `hoist`, `editable`.
- `RoleManager`: create/edit/delete/fetch roles.
- `GuildMember.roles.highest`: compare member hierarchy.
- `GuildMember.manageable`, `kickable`, `bannable`, `moderatable`: client/bot capability properties.
- `PermissionsBitField`: inspect/add/remove permission flags.

## Arabic terminology cross-reference, illustrative only

- “رتبة / رول” → role.
- “ارفع الرتبة / فوق” → hierarchy/position change.
- “لون الرتبة” → role color.
- “تطلع لحالها” → hoist.
- “منشن الرتبة” → mentionable.
- “يعطي رتبة” → assign role; requires hierarchy check.
- “صلاحيات الرتبة” → permission bitset, not channel-specific overwrite unless channel mentioned.

## Sources
- Discord Developer Docs: Permissions / Role Object — https://discord.com/developers/docs/topics/permissions
- Discord Developer Docs: Guild Resource — https://discord.com/developers/docs/resources/guild
- discord.js v14: Role, RoleManager, GuildMember
