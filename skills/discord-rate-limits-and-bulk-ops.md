# Discord Rate Limits and Bulk Operations Knowledge

Use this reference whenever the bot creates/deletes many channels or roles, edits many overwrites, bulk deletes messages, rebuilds a server, or retries failed Discord API calls. Bulk Discord operations must be sequenced and verified; never fire an unbounded burst.

## Rate-limit fundamentals

Discord rate limits apply per route/bucket and globally. API responses include rate-limit headers such as remaining requests, reset timing, bucket, and retry information. A 429 response means the bot must wait before retrying; global limits require all requests to pause.

General rules:
- Use the discord.js REST manager rather than custom raw spam loops when possible.
- Do not parallelize many mutations against the same route/channel/guild.
- Treat 429 as expected under bulk operations; respect retry-after.
- Add jitter/backoff for retries.
- Log partial success and continue safely only when the operation is idempotent or tracked.

## Bulk channel deletion

Danger level: very high.

Safe approach:
1. Resolve exact channel IDs and preserved exceptions.
2. Exclude the active command channel unless explicitly confirmed and safe.
3. Require confirmation showing count and preserved names.
4. Delete channels sequentially or with very low concurrency.
5. Handle missing/already-deleted channels as skipped, not fatal.
6. Record per-channel result.
7. Tombstone deleted channels in memory.
8. Verify remaining channels match preservation rules.

WRONG: Expand “delete all rooms except الو” and immediately call delete on every channel in parallel.
RIGHT: Confirm, sequence, protect active channel, handle failures individually, and report deleted/skipped/failed.

## Bulk channel creation

Safe approach:
1. Create roles first if permissions target new roles.
2. Create categories first.
3. Create child channels under categories.
4. Apply permission overwrites at creation when simple and shared.
5. For per-channel differences, create first then edit overwrites.
6. Rate-limit sequence creations; avoid large parallel bursts.
7. Verify each channel exists with expected type/parent/settings.

Important: Discord only supports text ↔ announcement conversion in limited cases. “Replace text rooms with voice” means create voice channels and possibly delete old text channels after confirmation; do not call it a type conversion.

## Bulk role creation/assignment

Safe approach:
- Create only required roles; avoid role spam.
- Set safe permission bitsets by default.
- Position roles intentionally after creation if hierarchy matters.
- Never grant `Administrator`, `ManageRoles`, `ManageChannels`, or `MoveMembers` broadly by template accident.
- For mass assignment/removal, confirm count and target role, then process in batches with per-member result tracking.

WRONG: Create a high-permission role and mass-assign it because the user said “عطهم صلاحيات”.
RIGHT: Ask/derive exact required capabilities, avoid dangerous permissions, confirm mass assignment.

## Bulk permission updates

Safe approach:
1. Determine desired conceptual behavior.
2. Build canonical overwrite operations.
3. Apply to category or explicit channels intentionally.
4. If category update should affect children, update/sync children deliberately.
5. Sequence overwrite edits.
6. Fetch final overwrites and summarize.

Pitfall: category overwrite updates do not guarantee unsynced children now match. Verify children.

## Bulk message delete

Safe approach:
- Validate count and channel.
- Respect Discord bulk-delete limitations, including message age constraints.
- Limit request size; standard bulk delete supports limited batches.
- If filtering by user, fetch messages then filter before delete.
- Record deleted/skipped/too-old/failed counts.
- Require confirmation for large or sensitive deletes.

## Retry and error handling

For every bulk operation, maintain an execution ledger:
- requested target;
- resolved ID;
- action attempted;
- success/failure;
- error code/message;
- retry count;
- final state.

Retry only when safe:
- 429: wait retry-after and retry.
- 5xx/network: retry with backoff.
- missing permissions/hierarchy: do not retry until configuration changes.
- unknown/missing object: mark skipped after refetch.

## Sequencing templates

### Server rebuild
1. Snapshot current channels/roles relevant to operation.
2. Resolve preserve list.
3. Confirm destructive plan.
4. Delete target channels/categories safely.
5. Create roles.
6. Create categories.
7. Create channels.
8. Apply permissions.
9. Verify final structure.
10. Reply with ledger summary.

### Permission rollout to many channels
1. Resolve category/channels.
2. Build overwrite plan.
3. Confirm if broad/destructive.
4. Apply sequentially.
5. Fetch final overwrites.
6. Report changed/skipped/failed.

## WRONG vs RIGHT from this project

### Delete-all failure mode
WRONG: Treat “احذف جميع الرومات بس لاتحذف روم الو” as a simple `delete_channels` call without confirmation, active-channel protection, sequencing, or final verification.

RIGHT: Resolve every deletable channel except `الو`, show confirmation, delete sequentially, preserve active command channel unless separately confirmed, verify remaining channels, and summarize.

### Partial success reporting
WRONG: Reply “تم حذف كل الرومات” if some deletes failed or were skipped.

RIGHT: Reply “حذفت 12، حافظت على 2، فشل حذف 1 بسبب نقص صلاحية: #staff”.

### Create storm
WRONG: Fire 50 channel creates and 20 role creates at once.

RIGHT: Queue operations with small concurrency, respect rate limits, and checkpoint progress.

## Arabic terminology cross-reference, illustrative only

- “احذف كل الرومات” → destructive bulk channel delete.
- “سو سيرفر كامل” → bulk create roles/categories/channels/permissions.
- “نظف الشات” → bulk message delete.
- “طبق على كل الرومات” → bulk permission update.
- “لا تحذف / خله” → preservation constraint.
- “رجع/استبدل” → requires plan memory and state verification.

## Sources
- Discord Developer Docs: Rate Limits — https://discord.com/developers/docs/topics/rate-limits
- Discord Developer Docs: Channels Resource — https://discord.com/developers/docs/resources/channel
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- discord.js v14 REST/channel managers
