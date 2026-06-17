# Discord Server Structure Patterns

Use this reference when the bot is asked to build a server, shop, ticket system, verification flow, private rooms, category layout, or multi-channel structure. These are real Discord mechanics, not cosmetic naming patterns.

## General build order

1. Understand the purpose: public info, private support, staff, sales, voice, verification, logs.
2. Create roles first if access depends on roles.
3. Create categories with base overwrites.
4. Create channels under categories.
5. Apply or sync child overwrites intentionally.
6. Verify final access for `@everyone`, member roles, staff roles, and bot.
7. Reply with exact names, counts, and permission behavior.

## Ticket systems

Mechanic options:
- Private text channel per ticket under a Tickets category.
- Private thread per ticket under a support channel.
- Forum post per ticket if public/semi-public structured support is acceptable.

Private channel ticket pattern:
- Category: `tickets`.
- `@everyone`: deny `ViewChannel` on ticket category or each ticket channel.
- Ticket opener/member: allow `ViewChannel`, `SendMessages`, `ReadMessageHistory`, `AttachFiles` as needed.
- Support role: allow `ViewChannel`, `SendMessages`, `ReadMessageHistory`, `ManageMessages` if trusted.
- Bot: must be able to manage channels/overwrites.
- Optional logs channel visible only to staff.

WRONG: Create a public `#ticket-abu` text channel and assume the name makes it private.
RIGHT: Set overwrites so only opener + staff can view it.

## Verification gates

Goal: new members see only rules/verification until verified.

Typical roles:
- `@everyone`: minimal access, view rules/verify only.
- `Verified`: normal community access.
- `Staff`: staff-only access.

Typical channels:
- `#rules`: visible read-only.
- `#verify`: visible, can interact with bot/button if used.
- Main categories: deny `ViewChannel` to `@everyone`, allow `ViewChannel` to `Verified`.

WRONG: Give unverified users `ViewChannel` everywhere and rely on them not sending.
RIGHT: Deny `ViewChannel` for non-verified areas until `Verified` role is assigned.

## Shop/store layout

Common categories:
- Info: rules, prices, FAQ, announcements.
- Orders: order tickets or order forum.
- Products: product channels or forum tags.
- Support: private ticket channels/threads.
- Staff: order management and logs.

Permission model:
- Public can view info/products.
- Public can create ticket/order entry point.
- Individual tickets/orders are private to opener + staff.
- Staff logs are hidden from public.
- Payment/order channels should not grant management permissions to customers.

WRONG: Give customers `ManageChannels` to “manage their order room”.
RIGHT: Let the bot manage the room; customers only get view/send/upload permissions in their own ticket/order channel.

## Lobby + private rooms pattern

Goal: public lobby plus restricted voice/private rooms.

Pattern:
- Public lobby voice: `@everyone` allow `ViewChannel`, `Connect`, maybe `Speak`.
- Private room visible but locked: `@everyone` allow `ViewChannel`, deny `Connect`.
- Allowed role/member: allow `Connect`, `Speak`, and optionally `Stream`.
- Drag-in helper: trusted role gets `MoveMembers`, not public users.

WRONG: To make “drag-in only,” grant `MoveMembers` to everyone.
RIGHT: Deny `Connect` to everyone and grant `MoveMembers` only to a trusted role.

## Category-based organization

Use categories for shared permission baselines:
- Public category: public chat/info.
- Community category: verified members.
- Voice category: voice rooms.
- Staff category: staff only.
- Tickets category: private child channels.
- Logs category: bot/staff logs.

Remember:
- Category can contain up to 50 channels.
- Children can be synced or unsynced.
- Some children intentionally differ from category, e.g. a read-only rules channel in a public category.

WRONG: Change a category overwrite and assume all unsynced children changed.
RIGHT: Check each child’s overwrites or explicitly sync/update children.

## Server-clean/rebuild workflow

For requests like “delete everything except X and build Y”:
1. Resolve preserved targets exactly.
2. Show destructive confirmation with list/count of channels/categories to delete.
3. Delete in safe sequence; do not delete the active command channel unless explicitly safe and confirmed.
4. Create roles/categories/channels in dependency order.
5. Apply permissions.
6. Verify final state.
7. Reply with deleted/preserved/created/skipped/failed lists.

WRONG: Execute only the create step and ignore the delete/preserve clause.
RIGHT: Treat the request as a structured plan with destructive and constructive phases.

## Forums vs channels vs threads decision

- Use forum when many public/semi-public topics need tags/statuses.
- Use ticket channels when each case must be private to a user + staff.
- Use private threads for lightweight private support within a channel, but remember private-thread membership and `ManageThreads` behavior.
- Use categories when many child channels share baseline permissions.

## Arabic terminology cross-reference, illustrative only

- “سيرفر متجر / ستور” → shop/store layout.
- “تذاكر / دعم” → ticket system.
- “تحقق / verify” → verification gate.
- “لوبي / انتظار” → public voice lobby.
- “رومات خاصة” → private voice/text rooms with overwrites.
- “رتب عملاء / أعضاء” → access roles.
- “قسم / كاتقوري” → category organization.

## Sources
- Discord Developer Docs: Channels Resource — https://discord.com/developers/docs/resources/channel
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- Discord Developer Docs: Guild Resource — https://discord.com/developers/docs/resources/guild
- discord.js v14 channel and role classes
