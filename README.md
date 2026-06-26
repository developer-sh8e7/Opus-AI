# HumanGuard AI

Permission-safe, Arabic-first Discord AI manager and moderation copilot.

HumanGuard AI helps server owners configure channels, categories, roles, permissions, and moderation workflows using natural language while staying safe by default: no Administrator requirement, permission preflight checks, clear diagnostics, audit logs, and human approval before high-impact moderation.

## Local development first

Railway is **not required** right now. Run locally with a `.env` file:

```bash
npm install
cp .env.example .env
npm run dev
```

Useful scripts:

```bash
npm run build
npm run start
npm run test
npm run verify
```

Minimum local variable:

```env
DISCORD_TOKEN=
```

Recommended variables:

```env
AUTHORIZED_ROLE_ID=
GROQ_API_KEY=
GROQ_MODEL=qwen-2.5-32b
```

If variables are missing, startup prints a local setup checklist instead of a vague Railway/production error.

## Commands

Default prefix: `!humanguard`

Legacy `!opus` is still accepted as an alias so existing local usage does not break.

Examples:

- `!humanguard help`
- `!humanguard permissions create_channels`
- `!humanguard diagnostics`
- Mention the bot and say: `سو لي روم فويس اسمه Room1`

## Safety defaults

- Does not require Administrator by default.
- Checks bot permissions, channel overwrites, and role hierarchy before actions.
- Ban/kick/timeout/mute/delete actions require human confirmation.
- Arabic requests are answered in Arabic.
- Important actions are written to `data/audit/actions.jsonl`.

## Railway

Keep `railway.json` for future deployment only. Do not use Railway as the active runtime unless you explicitly ask to enable it later.
