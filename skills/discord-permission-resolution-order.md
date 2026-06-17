# Discord Permission Resolution Order

Use this reference whenever the bot calculates whether a member can see, write, join, speak, manage, or moderate in a guild/channel. This is the most important file for avoiding hallucinated permission behavior.

## Core rule

Effective permissions are not decided by a single overwrite. Discord computes permissions from guild roles first, then channel overwrites in a fixed order.

## Guild-level base permissions

1. Start with `@everyone` role permissions.
2. OR together permissions from every role the member has.
3. If the resulting base permissions include `Administrator`, the member has all permissions and bypasses channel overwrites.
4. Guild owner effectively has all permissions.

## Channel overwrite order

For a specific channel, after base permissions:

1. Apply the `@everyone` overwrite for the channel/category if present:
   - remove denied bits
   - add allowed bits
2. Combine all role-specific overwrites for roles the member has:
   - OR all role allows together
   - OR all role denies together
   - remove the combined denies
   - add the combined allows
3. Apply the member-specific overwrite if present:
   - remove denied bits
   - add allowed bits

This means a role/member allow can override an `@everyone` deny for the same permission. A member-specific overwrite is the final channel-level override.

## Precise consequences

- `@everyone` deny is not absolute. A role allow can re-allow the permission.
- Role overwrites are aggregated; Discord does not process role overwrites one-by-one by role order for channel overwrites.
- Member-specific overwrites are strongest among normal overwrites.
- `Administrator` bypasses channel overwrites entirely.
- Some permissions are implicitly blocked by missing base permissions even if not explicitly denied.

## Implicit permission behavior

Discord documents logical implicit behavior:

- Denying `ViewChannel` means the user cannot interact with that channel. Other channel permissions may still compute numerically, but they do not matter because the user cannot see/access the channel.
- Denying `SendMessages` in text surfaces implicitly prevents `MentionEveryone`, `SendTTSMessages`, `AttachFiles`, and `EmbedLinks` from being useful there.
- Denying `Connect` in voice/stage implicitly blocks meaningful voice interaction even if `Speak`, `Stream`, or other voice permissions are present.
- Threads inherit from parent channel, with the important exception that thread sending requires `SendMessagesInThreads`, not just parent `SendMessages`.

## Category inheritance

Categories are channels with overwrites. Child channels can be synced or unsynced.

- A synced child has the same overwrite set as the parent category.
- An unsynced child can differ from the category.
- Editing a category does not magically fix unsynced child channels.
- Moving a channel under a category does not guarantee permission sync unless the move operation locks/syncs permissions.
- The bot should verify child overwrites after category operations.

## Common access recipes

### Hidden channel except staff

- `@everyone`: deny `ViewChannel`.
- Staff role: allow `ViewChannel`.
- Optional staff role: allow `SendMessages`, `ReadMessageHistory`, etc.

Why it works: staff role allow overrides the `@everyone` deny for staff members.

### Visible read-only text channel

- `@everyone`: allow or inherit `ViewChannel`.
- `@everyone`: deny `SendMessages`.
- Optional staff role: allow `SendMessages`.

Do not deny `ViewChannel` unless the user asked to hide it.

### Visible locked voice channel

- `@everyone`: allow or inherit `ViewChannel`.
- `@everyone`: deny `Connect`.
- Optional trusted role: allow `Connect`, `Speak`, `Stream`.

If a trusted role should enter despite `@everyone` deny, explicitly allow `Connect` for that role.

### Drag-in-only voice channel

- `@everyone`: allow `ViewChannel`, deny `Connect`.
- Trusted mover role: allow `MoveMembers` outside or on relevant voice channels.
- Do not grant `MoveMembers`, `ManageChannels`, or `ManageRoles` to `@everyone`.

## WRONG vs RIGHT from this project

### @everyone deny misunderstood
WRONG: “If `@everyone` denies `Connect`, no role can enter.”

RIGHT: A specific role overwrite can allow `Connect` and override the `@everyone` deny for members with that role.

### Role allow misunderstood
WRONG: “If a role allows `Connect`, it does not matter because the category denied it for everyone.”

RIGHT: In effective channel permissions, role allows are applied after `@everyone` denies. The role can regain `Connect`, unless another stronger member-specific deny exists or `ViewChannel`/other required access is missing.

### Category sync misunderstood
WRONG: “I changed the category, so all child channels now have that access.”

RIGHT: Only synced children match the category. Unsynced channels need explicit overwrite updates or a lock/sync operation.

### Voice lock misunderstood
WRONG: For “visible but cannot enter,” deny `ViewChannel`.

RIGHT: Keep `ViewChannel`; deny `Connect`. Denying `ViewChannel` hides the room.

## Bot calculation checklist

Before executing a permission request:
1. Determine target surface: guild, category, text, voice, stage, forum, thread.
2. Identify target subject: `@everyone`, role, member.
3. Determine desired final behavior in concepts: hidden, visible read-only, visible cannot join, can join/talk/stream, staff-only.
4. Convert concepts to permission allow/deny bits.
5. Check dangerous permissions (`ManageRoles`, `ManageChannels`, `MoveMembers`, `Administrator`) are not granted broadly.
6. If category involved, decide synced vs unsynced child behavior.
7. After mutation, recompute or fetch final overwrites and summarize exact behavior.

## Arabic terminology cross-reference, illustrative only

- “الكل يشوفه” → `@everyone` has/inherits `ViewChannel`.
- “بس ما يدخلونه” → deny `Connect` for voice/stage.
- “بس ما يكتبون” → deny `SendMessages` for text/forum post channel; threads need `SendMessagesInThreads`.
- “إلا رتبة كذا” → explicit role allow overriding `@everyone` deny.
- “خاص للرتبة” → usually deny `ViewChannel` for `@everyone`, allow `ViewChannel` for that role.
- “نفس صلاحيات القسم” → sync child overwrites with category.

## Sources
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- Discord Developer Docs: Channels Resource — https://discord.com/developers/docs/resources/channel
- discord.js v14: PermissionOverwrites — https://discord.js.org/docs/packages/discord.js/stable/PermissionOverwrites:Class
