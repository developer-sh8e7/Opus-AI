# Discord Permissions Reference

Use this reference whenever the bot grants, denies, explains, audits, or plans Discord permissions. This file documents Discord permission flags, common misunderstandings, and dangerous combinations. Never guess permission meaning from the UI label; use the API permission concept.

## Permission classes

- **Guild-level base permissions** come from `@everyone` and member roles.
- **Channel overwrites** can allow/deny permissions for `@everyone`, roles, or members on a specific channel/category.
- **Administrator** bypasses channel overwrites and grants all permissions.
- **Hierarchy constraints** still restrict role/member management even when a permission exists.
- Some permissions require guild owner 2FA when server-wide 2FA is enabled.

## Every major permission flag

| discord.js v14 flag | API name | Applies | Allows | Key risks / misunderstandings |
|---|---|---|---|---|
| `CreateInstantInvite` | `CREATE_INSTANT_INVITE` | Text/voice/stage | Create invites. | Can leak private areas if allowed in sensitive channels. |
| `KickMembers` | `KICK_MEMBERS` | Guild | Kick members. | Requires actor permission and bot capability/hierarchy; should require confirmation. |
| `BanMembers` | `BAN_MEMBERS` | Guild | Ban/unban members. | Destructive; require confirmation and hierarchy checks. |
| `Administrator` | `ADMINISTRATOR` | Guild | All permissions; bypasses channel overwrites. | Never grant broadly. Channel denies do not affect administrators. |
| `ManageChannels` | `MANAGE_CHANNELS` | Text/voice/stage/category | Create/edit/delete/reorder channels and overwrites. | Dangerous: can bypass designs by editing channel permissions. Do not grant to `@everyone`. |
| `ManageGuild` | `MANAGE_GUILD` | Guild | Edit guild settings. | High trust; can change server-level configuration. |
| `AddReactions` | `ADD_REACTIONS` | Text/voice/stage text surfaces | Add new reactions. | Existing reaction use may differ; not a full send permission. |
| `ViewAuditLog` | `VIEW_AUDIT_LOG` | Guild | View audit logs. | Sensitive moderation/admin visibility. |
| `PrioritySpeaker` | `PRIORITY_SPEAKER` | Voice | Use priority speaker. | Voice moderation/control permission. |
| `Stream` | `STREAM` | Voice/stage | Go live / screen share. | In this project, Arabic “Video/سكرين شير” must map to `Stream`. Do not use `UseEmbeddedActivities` for screen share. |
| `ViewChannel` | `VIEW_CHANNEL` | Text/voice/stage | View channels; read text channel visibility; see/join context for voice. | Denying it hides the channel and implicitly blocks other channel interactions. |
| `SendMessages` | `SEND_MESSAGES` | Text/voice/stage/forum/media | Send messages in channels and create forum posts/threads; not for sending inside threads. | Denying it creates visible read-only text if `ViewChannel` remains allowed. |
| `SendTTSMessages` | `SEND_TTS_MESSAGES` | Text/voice/stage text surfaces | Send `/tts` messages. | Usually deny broadly to prevent abuse. |
| `ManageMessages` | `MANAGE_MESSAGES` | Text/voice/stage text surfaces | Delete others’ messages and moderate messages. | Dangerous; enables deleting evidence/logs. |
| `EmbedLinks` | `EMBED_LINKS` | Text/voice/stage text surfaces | Auto-embed links. | Denied implicitly if `SendMessages` is denied. |
| `AttachFiles` | `ATTACH_FILES` | Text/voice/stage text surfaces | Upload files/images. | Abuse/spam risk; denied implicitly if `SendMessages` is denied. |
| `ReadMessageHistory` | `READ_MESSAGE_HISTORY` | Text/voice/stage text surfaces | Read previous messages and list archived public threads. | Without it users may only see new messages. |
| `MentionEveryone` | `MENTION_EVERYONE` | Text/voice/stage text surfaces | Use `@everyone` and `@here`. | High spam risk; do not grant broadly. |
| `UseExternalEmojis` | `USE_EXTERNAL_EMOJIS` | Text/voice/stage text surfaces | Use emojis from other servers. | Cosmetic but can bypass local moderation aesthetics. |
| `ViewGuildInsights` | `VIEW_GUILD_INSIGHTS` | Guild | View server insights. | Sensitive analytics. |
| `Connect` | `CONNECT` | Voice/stage | Join voice/stage channels. | Denying `Connect` makes a visible voice room not joinable if `ViewChannel` remains allowed. |
| `Speak` | `SPEAK` | Voice | Speak in voice channels. | User can connect but cannot talk if denied. |
| `MuteMembers` | `MUTE_MEMBERS` | Voice/stage | Server mute members. | Moderation permission; hierarchy/trust sensitive. |
| `DeafenMembers` | `DEAFEN_MEMBERS` | Voice | Server deafen members. | Moderation permission. |
| `MoveMembers` | `MOVE_MEMBERS` | Voice/stage | Move members between voice channels. | Dangerous: if broad, users can drag others into restricted rooms and defeat access design. |
| `UseVAD` | `USE_VAD` | Voice | Use voice activity detection. | UI may call it “Use Voice Activity”. |
| `ChangeNickname` | `CHANGE_NICKNAME` | Guild | Change own nickname. | Usually safe unless branding locked. |
| `ManageNicknames` | `MANAGE_NICKNAMES` | Guild | Change others’ nicknames. | Moderation/trust permission. |
| `ManageRoles` | `MANAGE_ROLES` | Guild/channel UI “Manage Permissions” | Manage roles below own highest role; edit channel permissions. | Extremely dangerous. Can defeat private-channel designs by editing overwrites. |
| `ManageWebhooks` | `MANAGE_WEBHOOKS` | Text/announcement/forum | Create/edit webhooks; follow announcement channels. | Webhooks can impersonate integrations and post content. |
| `ManageGuildExpressions` / older aliases | `MANAGE_GUILD_EXPRESSIONS` | Guild | Manage emojis/stickers/soundboard expressions. | Name aliases vary; check installed enum. |
| `UseApplicationCommands` | `USE_APPLICATION_COMMANDS` | Text/voice/stage | Use slash/application commands. | Needed for app command UX. |
| `RequestToSpeak` | `REQUEST_TO_SPEAK` | Stage | Request to speak in stage. | Stage-specific. |
| `ManageEvents` | `MANAGE_EVENTS` | Voice/stage/guild events | Create/edit/delete scheduled events broadly. | Event moderation/admin permission. |
| `ManageThreads` | `MANAGE_THREADS` | Threads/forums/text | Manage threads; access private threads in some contexts. | Can expose/control private-thread workflows. |
| `CreatePublicThreads` | `CREATE_PUBLIC_THREADS` | Text/forum | Create public threads. | Not enough to send inside existing threads. |
| `CreatePrivateThreads` | `CREATE_PRIVATE_THREADS` | Text | Create private threads. | Private thread sprawl; membership matters. |
| `UseExternalStickers` | `USE_EXTERNAL_STICKERS` | Text/voice/stage text surfaces | Use stickers from other servers. | Cosmetic/moderation concern. |
| `SendMessagesInThreads` | `SEND_MESSAGES_IN_THREADS` | Threads | Send messages in threads. | Threads do not inherit `SendMessages`; this is required. |
| `UseEmbeddedActivities` | `USE_EMBEDDED_ACTIVITIES` | Text/voice | Use embedded Activities/apps. | Not screen share. Do not confuse with `Stream`. |
| `ModerateMembers` | `MODERATE_MEMBERS` | Guild | Timeout members. | UI may call it “Timeout Members”; require duration limits and hierarchy checks. |
| `ViewCreatorMonetizationAnalytics` | `VIEW_CREATOR_MONETIZATION_ANALYTICS` | Guild | View role subscription/monetization analytics. | Sensitive analytics. |
| `UseSoundboard` | `USE_SOUNDBOARD` | Voice | Use soundboard. | Voice channel UX/spam. |
| `CreateGuildExpressions` | `CREATE_GUILD_EXPRESSIONS` | Guild | Create emojis/stickers/soundboard and edit/delete own created expressions. | Creation-only is different from manage-all. |
| `CreateEvents` | `CREATE_EVENTS` | Voice/stage/events | Create scheduled events and edit/delete own events. | Creation-only differs from `ManageEvents`. |
| `UseExternalSounds` | `USE_EXTERNAL_SOUNDS` | Voice | Use custom soundboard sounds from other servers. | Voice spam/cosmetic. |
| `SendVoiceMessages` | `SEND_VOICE_MESSAGES` | Text/voice/stage text surfaces | Send voice messages. | Moderation/storage concern. |
| `SetVoiceChannelStatus` | `SET_VOICE_CHANNEL_STATUS` | Voice | Set voice channel status. | Voice-channel metadata. |
| `SendPolls` | `SEND_POLLS` | Text/voice/stage text surfaces | Send polls. | Can spam or manipulate decisions. |
| `UseExternalApps` | `USE_EXTERNAL_APPS` | App responses | Lets user-installed apps send public responses when enabled. | If disabled, app can still be used but responses may be ephemeral. |

## Dangerous permission combinations

- `Administrator` anywhere on a broad role: bypasses all channel locks.
- `ManageRoles` broadly: users can edit permissions/roles below their role and defeat access control.
- `ManageChannels` broadly: users can alter or delete channels and overwrites.
- `MoveMembers` broadly: defeats “cannot enter private voice” designs because users can move people into rooms.
- `ManageWebhooks` broadly: can create persistent posting surfaces.
- `ManageMessages` broadly: can delete moderation evidence.
- `MentionEveryone` broadly: mass ping abuse.
- `BanMembers`, `KickMembers`, `ModerateMembers` without hierarchy/confirmation: destructive moderation risk.

## Project-specific WRONG vs RIGHT examples

### Drag-in private voice room
WRONG: To make a voice room “users can only enter if dragged,” grant `MoveMembers` or `ManageChannels` to `@everyone`.

RIGHT: Deny `Connect` for `@everyone`; keep `ViewChannel` allowed if it should be visible; grant `MoveMembers` only to a trusted helper/moderator role. The bot must verify `@everyone` does not receive `MoveMembers`, `ManageChannels`, or `ManageRoles`.

### Visible locked room
WRONG: Deny `ViewChannel` when the user says “الكل يشوفه بس ما يدخل/ما يكتب”. That hides it.

RIGHT: For text, allow/inherit `ViewChannel` and deny `SendMessages`. For voice, allow/inherit `ViewChannel` and deny `Connect`.

### Screen share
WRONG: Map “Video / سكرين شير” to `UseEmbeddedActivities` or a custom string like `Video` that the executor does not resolve.

RIGHT: Map screen share/go live to Discord `Stream` / discord.js `PermissionFlagsBits.Stream`.

### Threads
WRONG: Assume `SendMessages` lets users post inside threads.

RIGHT: Use `SendMessagesInThreads` for thread messages; `SendMessages` affects channel messages and forum post/thread creation.

## Arabic terminology cross-reference, illustrative only

- “يشوف الروم” → `ViewChannel`.
- “يكتب / يرسل” → `SendMessages` or `SendMessagesInThreads` depending on channel/thread.
- “ما يكتب / مقفل شات” → deny `SendMessages` while preserving `ViewChannel`.
- “يدخل فويس / يخش” → `Connect`.
- “يتكلم” → `Speak`.
- “يفتح سكرين / Video / بث” → `Stream`.
- “يسحب ناس / ينقلهم” → `MoveMembers`, trusted roles only.
- “تايم اوت / ميوت كتابي مؤقت” → `ModerateMembers` + timeout.
- “منشن الكل” → `MentionEveryone`.

## Sources
- Discord Developer Docs: Permissions — https://discord.com/developers/docs/topics/permissions
- discord.js v14: PermissionFlagsBits — https://discord.js.org/docs/packages/discord.js/stable/PermissionFlagsBits:Variable
