# HumanGuard AI Project Analysis

## Current architecture

- `src/index.ts`: Discord event router, authorization boundary, tool execution, workflow execution, audit logging, memory updates, and provider orchestration.
- `src/config.ts`: validates Discord and AI environment variables without exposing their values.
- `src/services/ai.ts`: Groq-first AI routing, Cerebras fallback, bounded retries, timeouts, compact tool selection, and secret-safe errors.
- `src/services/toolTargeting.ts`: resolves explicit mentions, snowflake IDs, channel/role names, exclusions, and recent session entities.
- `src/intelligence/memory_manager.ts`: persists bounded conversation history, user profiles, summaries, and 30-minute session entity pointers.
- `src/intelligence/context_analyzer.ts`: extracts Discord, guild, user, dialect, and reply context.
- `src/intelligence/dialect_engine.ts`: recognizes Arabic dialect and conversational style.
- `src/skills/command_parser.ts`: parses direct commands and common Discord administration intents.
- `src/skills/decision_maker.ts`: scores intent and execution choices.
- `src/skills/permission_checker.ts`: validates member and bot permissions before administrative execution.
- `src/utils/discordTools.ts`: concrete discord.js channel, role, permission, moderation, message, and information operations.
- `src/utils/embed_generator.ts`: reusable Discord embed builders.
- `src/utils/logger.ts`: structured operational and audit logs.
- `src/utils/security.ts`: role and member hierarchy protection.
- `src/tools/community_builder.ts`: server/category/channel blueprint execution.
- `src/tools/voice_manager.ts`: voice connection and playback lifecycle.
- `package.json`: TypeScript build, production start, and verification scripts.
- `tsconfig.json`: strict NodeNext TypeScript compilation into `dist`.
- `data/persistent_memory.json`: persisted non-secret memory state.

## Root cause findings

The original permission failure came from treating Arabic “see the room” and “enter the room” as one action. Discord separates them into `ViewChannel` and `Connect`. The deterministic parser already handled the common `يدخل` form, but missed Gulf forms such as `يخشونه` and exception wording such as “فقط اللي معه رتبة”.

The second root issue was memory registration occurring after some direct AI tool paths but not centrally after every skill-adapter execution. Entity registration is now performed at the audited execution boundary, so skills that internally call a base Discord tool also update recent entity memory.

## Existing capabilities

The project already has executable moderation, channel, permission, role, voice, music, community, ticket, logging, automation, analytics, economy, leveling, invite, AutoMod, event, webhook, expression, and utility skills. The registry loads generated presets only when they have real execution functions; it does not count documentation-only entries.

## Implementation direction

1. Keep deterministic parsing for high-risk permission requests.
2. Keep AI output advisory and structured; TypeScript remains the execution authority.
3. Prefer exact IDs and session-scoped entities over name guessing.
4. Use atomic channel creation with permission overwrites when the request is explicit.
5. Derive Discord enums dynamically instead of padding source files with thousands of stale constants.
