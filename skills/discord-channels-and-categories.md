# Discord Channels and Categories Knowledge

Use this reference whenever the bot creates, deletes, moves, renames, locks, opens, or explains Discord channels, categories, forums, announcements, stages, or threads. It describes real Discord mechanics for discord.js v14 and the Discord API; do not infer channel behavior from names alone.

## Canonical channel types

| Concept | Discord API type | discord.js v14 `ChannelType` | What it is | Key constraints |
|---|---:|---|---|---|
| Text channel | `GUILD_TEXT` = 0 | `GuildText` | Normal guild text chat. | Topic, NSFW, slowmode, parent category, permission overwrites, threads. |
| Voice channel | `GUILD_VOICE` = 2 | `GuildVoice` | Joinable voice room. | Bitrate, user limit, RTC region, voice permissions. |
| Category | `GUILD_CATEGORY` = 4 | `GuildCategory` | Organizational parent for up to 50 channels. | Holds category-level overwrites; children can be synced or unsynced. |
| Announcement/news | `GUILD_ANNOUNCEMENT` = 5 | `GuildAnnouncement` / `GuildNews` | Followable announcement channel. | Similar text permissions plus crossposting/following behavior. |
| Announcement thread | `ANNOUNCEMENT_THREAD` = 10 | `AnnouncementThread` | Thread under announcement channel. | Inherits parent thread permissions. |
| Public thread | `PUBLIC_THREAD` = 11 | `PublicThread` | Thread under text/forum channel visible to users with parent access. | Archived threads need `ReadMessageHistory` to list. |
| Private thread | `PRIVATE_THREAD` = 12 | `PrivateThread` | Invite-only thread under text channel. | Viewable by invited users and users with `ManageThreads`. |
| Stage channel | `GUILD_STAGE_VOICE` = 13 | `GuildStageVoice` | Voice-like event channel with speakers/listeners. | Stage permissions differ from normal voice (`RequestToSpeak`, speakers). |
| Directory | `GUILD_DIRECTORY` = 14 | `GuildDirectory` | Hub directory channel. | Usually not created for normal guild management. |
| Forum channel | `GUILD_FORUM` = 15 | `GuildForum` | Thread-only discussion surface. | Posts are threads; topic supports up to 4096 chars; tags/default reactions exist. |
| Media channel | `GUILD_MEDIA` = 16 | `GuildMedia` | Media-focused thread/post channel. | Similar forum/media settings; not always enabled for every guild. |

Do not create DM/group-DM types for guild server management tasks.

## Channel fields and settings

- `name`: 1-100 characters for guild channels. Use normalized, Discord-valid names when creating.
- `type`: only text ↔ announcement conversion is supported, and only where guild features allow it. Do not “convert text to voice”; delete/recreate or create a new voice channel.
- `position`: display order. Channels with equal position sort by ID; bulk reordering should be explicit.
- `parent_id`: category ID. A child can be under a category or have no category.
- `permission_overwrites`: channel/category-specific role/member overwrites. Every channel can have them.
- `topic`: text/announcement topic is 0-1024 chars; forum/media topic is 0-4096 chars.
- `nsfw`: age-restricted flag for text, voice, announcement, stage, forum, media.
- `rate_limit_per_user`: slowmode in seconds, 0-21600. Bots and users with `BypassSlowmode` are unaffected. In forums/media it also affects thread/post creation cadence.
- `bitrate`: voice/stage bitrate in bits per second; min 8000 and max depends on guild boost tier.
- `user_limit`: voice max 99; stage max 10,000; 0 means no limit.
- `rtc_region`: voice/stage region override; `null` means automatic.

## Text channels

Use text channels for persistent chat, logs, rules, tickets, orders, and support. Relevant permissions include `ViewChannel`, `SendMessages`, `ReadMessageHistory`, `AddReactions`, `AttachFiles`, `EmbedLinks`, `CreatePublicThreads`, `CreatePrivateThreads`, `SendMessagesInThreads`, and `ManageMessages`.

Common operations:
- Lock chat but keep visible: allow/inherit `ViewChannel`, deny `SendMessages` for target role/everyone.
- Read-only rules: deny `SendMessages`; usually keep `ReadMessageHistory` allowed.
- Hidden staff channel: deny `ViewChannel` for `@everyone`, allow `ViewChannel` for staff role.

WRONG: “Make a chat locked” by denying `ViewChannel`; that hides the channel, it does not create a visible read-only channel.
RIGHT: visible locked text channel = `ViewChannel` allowed/inherited, `SendMessages` denied.

## Voice channels

Use voice channels for live voice. Relevant permissions include `ViewChannel`, `Connect`, `Speak`, `Stream`, `UseVAD`, `MuteMembers`, `DeafenMembers`, `MoveMembers`, `PrioritySpeaker`, `UseSoundboard`, `UseExternalSounds`, and `SetVoiceChannelStatus`.

Common operations:
- Visible but cannot enter: allow/inherit `ViewChannel`, deny `Connect`.
- Can enter but cannot talk: allow `ViewChannel` + `Connect`, deny `Speak`.
- Can enter/talk/screen share: allow `ViewChannel`, `Connect`, `Speak`, `Stream`.
- Drag-in only room: deny `Connect` for `@everyone`; grant `MoveMembers` only to trusted staff, not everyone.

WRONG: grant `MoveMembers` or `ManageChannels` to `@everyone` so members can be moved into a restricted room. That defeats access control because everyone can move members or manage the channel.
RIGHT: deny `Connect` for `@everyone`; grant `MoveMembers` only to a trusted moderator/helper role that should control drag-in access.

## Stage channels

Stage channels are voice-like event rooms with speakers and audience. Use for announcements, panels, or public events. `RequestToSpeak`, `ManageEvents`, `Connect`, `Speak`, and stage instance mechanics matter. Do not model stage as a normal voice room when the user asks for “audience / speakers / stage”.

## Announcement/news channels

Announcement channels can be followed by other guilds and crossposted. Following an announcement channel uses webhook mechanics and requires `ManageWebhooks` in the target channel. Do not treat “announcement” as only a text channel name; it is a distinct channel type where guild features allow it.

## Forum and media channels

Forum/media channels are thread/post containers. `SendMessages` permits creating posts/threads in a forum, but sending inside existing threads uses `SendMessagesInThreads`. A forum request usually needs default tags, available tags, default sort/layout, topic, slowmode, and archive behavior considered.

WRONG: for a forum support board, create many text channels manually for every case.
RIGHT: create one forum channel with tags/statuses when the desired model is topic-based posts; use ticket channels only when private per-user access is required.

## Threads

Thread types:
- Public threads: under text/forum; visible to users who can see parent.
- Private threads: under text; invite/member-based visibility; users with `ManageThreads` can access/manage.
- Announcement threads: under announcement channel.

Important rules:
- Threads inherit permissions from the parent channel.
- `SendMessages` is not enough to send inside threads; users need `SendMessagesInThreads`.
- Listing archived public threads requires `ReadMessageHistory`.
- Private thread membership and `ManageThreads` matter for visibility.
- Thread slowmode and parent slowmode can both affect behavior depending on context.

## Categories and inheritance

Categories are organizational parents, not real permission roles. They can hold overwrites, and child channels can be synced or unsynced.

- A synced child has overwrites matching its category.
- An unsynced child has its own overwrite set; later category changes do not automatically mean the child matches.
- Moving a channel under a category does not always mean “copy category permissions” unless the operation locks/syncs permissions.
- Category can contain up to 50 channels.

WRONG: assume “put this channel in staff category” always makes it staff-only.
RIGHT: after moving, verify whether overwrites are synced or explicitly copy/set the correct overwrites.

## Safe creation order

For compound server builds:
1. Create roles first if channel overwrites target those roles.
2. Create categories with broad base overwrites.
3. Create child channels under categories.
4. Explicitly sync or set child overwrites depending on desired behavior.
5. Verify final overwrites and visible/join/send behavior.

## Arabic concept mapping, illustrative only

Map Arabic phrases to concepts, not exact strings:
- “روم / شات / قناة” → channel; ask or infer text vs voice from context.
- “فويس / صوتي” → voice channel.
- “كاتقوري / قسم / تصنيف” → category.
- “خاص / مخفي / للطاقم” → likely `ViewChannel` restrictions.
- “مقفل بس يشوفونه” → visible but restricted; text usually deny `SendMessages`, voice usually deny `Connect`.
- “ما يقدر يدخل” → voice/stage `Connect` denied.
- “ما يقدر يكتب” → text/thread `SendMessages` or `SendMessagesInThreads` denied.
- “يفتح سكرين / Video” → Discord `Stream`, not `UseEmbeddedActivities`.

## Sources
- Discord Developer Docs: Channels Resource — https://discord.com/developers/docs/resources/channel
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- discord.js v14: ChannelType, TextChannel, VoiceChannel, CategoryChannel, ForumChannel, NewsChannel, StageChannel, ThreadChannel
