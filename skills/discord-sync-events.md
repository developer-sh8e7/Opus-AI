# Discord Sync Events Knowledge

Use this reference when the bot keeps local state, memory, caches, entity registry, permission snapshots, or server structure in sync with Discord. The bot must not trust stale local state after channel/role/member changes.

## Sync principle

Discord is event-driven. A bot’s local cache can become stale when:
- another admin changes channels/roles/permissions;
- the bot misses a gateway event;
- the process restarts;
- intents/cache settings omit objects;
- an API call partially succeeds;
- bulk operations race with gateway events.

For critical actions, fetch/verify from Discord after mutation.

## Channel events

Relevant discord.js v14 events:
- `channelCreate`: a channel/thread is created.
- `channelUpdate`: a channel’s fields or overwrites may change.
- `channelDelete`: a channel is deleted.
- `threadCreate`: thread created.
- `threadUpdate`: thread archived/locked/renamed/settings changed.
- `threadDelete`: thread deleted.
- `threadMembersUpdate` / thread member events depending on enabled intents and cache.

Local state updates:
- On create: register entity ID, name, type, parent, overwrites, creation source if known.
- On update: refresh name, parent, topic, slowmode, NSFW, bitrate, user limit, overwrites, sync state.
- On delete: mark tombstone; do not keep resolving “last channel” to a deleted ID.

WRONG: After deleting channels, keep recent memory pointing at the deleted channel and resolve “الروم” to it.
RIGHT: On `channelDelete`, tombstone it and require clarification if user refers to it later.

## Role events

Relevant events:
- `roleCreate`
- `roleUpdate`
- `roleDelete`

Local state updates:
- Track role ID/name/color/hoist/mentionable/permissions/position/managed.
- On role position or permission change, invalidate cached hierarchy and permission plans.
- On delete, tombstone role ID and remove from access plans.

WRONG: Assume role name “VIP” still maps to same ID after delete/recreate.
RIGHT: Resolve by current guild roles and treat old deleted IDs as tombstones.

## Member events

Relevant events:
- `guildMemberAdd`
- `guildMemberRemove`
- `guildMemberUpdate`
- `guildBanAdd`
- `guildBanRemove`
- voice state updates for joins/mutes/deafens/moves.

Local state updates:
- Role changes affect access and hierarchy.
- Nickname/display name changes affect fuzzy member resolution.
- Timeout state changes affect moderation state.
- Voice state changes affect voice moderation and move/mute operations.

`guildMemberUpdate` is important when roles are assigned/removed or timeout state changes. The bot should refresh member permissions/hierarchy before moderation, not rely only on old memory.

## Permission overwrite changes

Discord does not expose a separate high-level “permission overwrite changed” event as a unique conceptual event in all libraries; overwrites are part of channel state, so monitor channel update events and compare `permissionOverwrites` snapshots.

On overwrite change:
- Recompute access summaries for affected channel.
- Invalidate cached “private/locked/public” labels.
- Update entity aliases such as “private room” or “visible locked room”.

WRONG: Cache “خاص is locked” forever after one permission edit.
RIGHT: On channel update, re-read overwrites and update the semantic label.

## Audit log correlation

Gateway events say what changed; audit logs can help identify who/why for admin actions. Audit logs may be delayed and require `ViewAuditLog`. Use them for diagnostics, not as the only correctness source.

## State sync after bot actions

After the bot executes a mutation:
1. Record intended operation and request ID.
2. Await REST result.
3. Update local memory from returned object/result.
4. Optionally fetch affected object(s) for final state.
5. Treat gateway event as confirmation/update, but do not double-count if it corresponds to the bot’s own request.

## Bulk operation sync

Bulk operations can produce many events:
- channel delete/create storms;
- role update/delete events;
- member role assignment events.

Safe handling:
- Use operation IDs or timestamps to correlate.
- Debounce expensive recomputation.
- Preserve tombstones for deleted objects.
- After bulk operation completes, perform one final guild/channel/role fetch for authoritative state.

## Arabic terminology cross-reference, illustrative only

- “الروم اللي سويته” → recent channel entity; verify it still exists.
- “الرتبة اللي قبل شوي” → recent role entity; verify current role ID/name.
- “ارجع المحادثة وطبق” → needs pending plan memory plus current-state refresh.
- “لا تحذف الو” → preserved target memory; verify channel exists before deletion.

## Sources
- Discord Developer Docs: Gateway Events — https://discord.com/developers/docs/topics/gateway-events
- Discord Developer Docs: Channels Resource — https://discord.com/developers/docs/resources/channel
- Discord Developer Docs: Guild Resource — https://discord.com/developers/docs/resources/guild
- Discord Developer Docs: Audit Logs — https://discord.com/developers/docs/resources/audit-log
- discord.js v14: Events enum
