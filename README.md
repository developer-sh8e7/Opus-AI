# Opus AI

Discord AI Agent bot for moderation, admin commands, contextual replies, memory/cache, permissions, and music/voice.

## Render Deployment

- Service Type: Web Service
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/healthz`
- Health Check URLs:
  - `https://YOUR-APP.onrender.com/health`
  - `https://YOUR-APP.onrender.com/healthz`

### Environment Variables

Set these variables in Render. Do not commit real secrets to GitHub.

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
AUTHORIZED_ROLE_ID=

AI_PROVIDER=groq
OLLAMA_ENABLED=false

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant

CEREBRAS_API_KEY=
CEREBRAS_MODEL=zai-glm-4.7

AI_TIMEOUT_MS=25000
AI_MAX_RETRIES=2
```

Render Free Web Services sleep after 15 minutes without incoming HTTP traffic. Use UptimeRobot or cron-job.org to visit `/health` or `/healthz` every 5 minutes:

```text
https://YOUR-APP.onrender.com/health
https://YOUR-APP.onrender.com/healthz
```
