# Legacy AI Backup

The complete pre-refactor `src/services/ai.ts` is preserved in Git under:

- Tag: `backup-ai-legacy-2026-06-09`
- Source commit: `6e15fdf`
- Original size: 14,189 lines

Inspect it without changing the working tree:

```powershell
git show backup-ai-legacy-2026-06-09:src/services/ai.ts
```

Restore it to a separate local reference file:

```powershell
git show backup-ai-legacy-2026-06-09:src/services/ai.ts | Set-Content -Encoding utf8 backups/ai.legacy.ts.txt
```

The legacy file is intentionally not compiled because its Arabic text contains historical
encoding damage and its large static scenario database is not training data for the external
AI providers. Useful rules should be migrated into tested modules instead of reactivating the
file as the production AI service.
