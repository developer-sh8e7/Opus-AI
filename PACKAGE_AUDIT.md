# Package Audit

Package metadata was checked against the official npm registry before installation.

## Installed

The project includes compatible, vulnerability-free integrations for voice encryption,
FFmpeg, canvas rendering, scheduling, reaction roles, backups, Discord event logs,
language processing, timestamps, and utility formatting.

## Not Installed

- `discord-ticket`: package name does not exist in the npm registry.
- `discord.js-anti-spam`: package name does not exist in the npm registry.
- `discord-welcome-card`: latest release declares Discord.js 13 compatibility, not v14.
- `discord-giveaways`: latest release introduced a high-severity vulnerable dependency.
- `discord-html-transcripts`: available safe-looking release still introduced high-severity
  vulnerable dependencies; the latest release is itself marked broken by its publisher.
- `discord-player` and `@discord-player/extractor`: current releases introduced a vulnerable
  media parser. Existing `play-dl`, `youtube-sr`, and `@distube/ytdl-core` remain active.
- `canvacord`: current release introduced the same vulnerable media parser.
- Low-maintenance packages that duplicate existing internal systems were not added merely
  to inflate dependency count.

`npm audit` reports zero known vulnerabilities after these exclusions.
