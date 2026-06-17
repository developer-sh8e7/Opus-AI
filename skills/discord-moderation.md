# Discord Moderation Knowledge

Use this reference whenever the bot bans, unbans, kicks, times out, mutes/deafens, moves members, bulk-deletes messages, audits actions, or explains moderation constraints. Moderation is destructive or high-risk; require confirmation where project policy says so.

## Mandatory preflight model

Before every moderation action, verify all of these:

1. **Requesting actor permission**: actor has the relevant permission or project-authorized role.
2. **Actor hierarchy**: actor’s highest role outranks the target member, unless actor is guild owner.
3. **Bot permission**: bot holds the relevant Discord permission.
4. **Bot hierarchy/capability**: bot’s highest role outranks target; discord.js capability (`bannable`, `kickable`, `moderatable`, `manageable`) is true where applicable.
5. **Target validity**: target exists, is not the bot, is not the guild owner, and is not ambiguous.
6. **Confirmation**: bans, kicks, timeouts, mass actions, and destructive operations require explicit confirmation.
7. **Audit reason**: include a concise reason when provided; pass audit-log reason where the API supports it.

Do not rely on Discord API failure as the first safety check. Preflight before executing.

## Ban

What it does:
- Removes a member and prevents rejoin until unbanned.
- Can optionally delete recent messages depending on endpoint/options.
- Requires `BanMembers`.
- Requires bot hierarchy/capability and actor hierarchy.
- Should write an audit log entry with reason.

Safe flow:
1. Resolve member/user exactly.
2. If multiple matches, ask clarification; do not guess.
3. Check actor `BanMembers` and hierarchy.
4. Check bot `BanMembers`, target not owner/self, bot above target, `member.bannable` when member is in guild.
5. Require confirmation showing target name/ID and message-delete scope.
6. Execute ban with reason.
7. Verify ban or report exact failure.

## Unban

What it does:
- Removes a ban for a user ID.
- Target may not be a current guild member, so member hierarchy lookup may not apply the same way.
- Still requires `BanMembers` and confirmation.
- Must resolve user ID or ban entry exactly.

## Kick

What it does:
- Removes a member from guild without preventing rejoin.
- Requires `KickMembers`.
- Requires actor and bot hierarchy.
- Use `member.kick(reason)` in discord.js.

Kick is destructive but less permanent than ban; still require confirmation.

## Timeout / ModerateMembers

What it does:
- Temporarily prevents sending/reacting in chat and threads and speaking in voice/stage.
- Requires `ModerateMembers`.
- Discord timeout has a maximum duration (commonly up to 28 days). Do not allow arbitrary unbounded durations.
- Use discord.js `member.timeout(durationMs, reason)` and `member.timeout(null, reason)` to remove timeout.
- Check `member.moderatable`.

Natural language mapping:
- “تايم اوت”, “اسكته مدة”, “ميوت كتابي مؤقت” → timeout if duration exists or can be clarified.
- “فك التايم اوت” → remove timeout.

## Voice mute/deafen

Voice server mute/deafen:
- Requires `MuteMembers` / `DeafenMembers`.
- Target usually must be in a voice channel.
- Use voice state operations in discord.js.
- This is not the same as timeout.

Move member:
- Requires `MoveMembers`.
- Target must be in voice for most move/kick-from-voice operations.
- Moving into a restricted room can defeat access design if broadly granted; only trusted roles should have `MoveMembers`.

## Bulk delete messages

What it does:
- Deletes multiple messages from a text channel.
- Requires `ManageMessages`.
- Discord bulk delete has API constraints, including message age limitations; older messages cannot be bulk-deleted by the standard bulk route.
- Limit batch size and handle partial failure.
- Must not delete audit/evidence channels without explicit confirmation.

Safe flow:
1. Resolve channel exactly.
2. Resolve optional user filter.
3. Validate count and max batch size.
4. Confirm count/channel/filter.
5. Execute in safe batches.
6. Report deleted count and skipped/failed count.

## Audit logs

- Administrative actions create audit log entries.
- Viewing audit logs requires `ViewAuditLog`.
- Many REST endpoints support an audit-log reason header.
- The bot should include reason strings for moderation actions when possible.
- Audit logs can be delayed; do not rely on immediate audit-log fetch as the only verification.

## Auto Moderation

Auto Moderation rules are server-level moderation configuration. Managing rules is different from timing out/banning a member. Treat automod create/edit/delete as administrative/destructive configuration changes requiring strong confirmation.

## WRONG vs RIGHT from this project

### Actor/bot hierarchy
WRONG: If the bot can ban a target, let any authorized user command the bot to ban them.

RIGHT: Check both actor-vs-target hierarchy and bot-vs-target hierarchy. The bot must not become a proxy for lower-ranked users.

### Exact target resolution
WRONG: Ban “محمد” by picking the first cached member with a similar name.

RIGHT: If multiple members match, ask for clarification with names/IDs. Execute only after one exact target is resolved.

### Timeout vs voice mute
WRONG: Treat “ميوت” as always voice mute.

RIGHT: Use context: “تايم اوت / ما يكتب / مدة” → `ModerateMembers` timeout; “ما يتكلم في الفويس” → voice mute or deny `Speak` depending on request.

### MoveMembers abuse
WRONG: Grant `MoveMembers` to everyone to let users pull others into private channels.

RIGHT: Grant `MoveMembers` only to trusted staff/helper role; normal users should not move members.

### Success replies
WRONG: Reply “تم حظره” because the model planned a ban.

RIGHT: Reply success only after the Discord API call succeeds and target identity is known: “تم حظر AbuAwad#1234 لمدة/بسبب: ...”.

## Arabic terminology cross-reference, illustrative only

- “باند / احظره” → ban.
- “فك الباند” → unban.
- “كيك / اطرده” → kick.
- “تايم اوت / اسكته مؤقت / ميوت كتابي” → timeout (`ModerateMembers`).
- “ميوت فويس” → voice mute (`MuteMembers`) or deny `Speak` by permissions.
- “ديفن / ما يسمع” → deafen (`DeafenMembers`).
- “اسحبه / انقله” → move member (`MoveMembers`).
- “امسح رسائله / نظف الشات” → bulk delete messages with `ManageMessages`.

## Sources
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- Discord Developer Docs: Guild Resource — https://discord.com/developers/docs/resources/guild
- Discord Developer Docs: Audit Logs — https://discord.com/developers/docs/resources/audit-log
- Discord Developer Docs: Auto Moderation — https://discord.com/developers/docs/resources/auto-moderation
- discord.js v14: GuildMember, GuildAuditLogs
