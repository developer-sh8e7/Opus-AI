import fs from 'node:fs';
import path from 'node:path';

/**
 * Clean Logger - concise startup, diagnostics, and durable audit logging.
 */
export class Logger {
  private static sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /token|secret|password|api.?key|authorization/i.test(key) ? '[REDACTED]' : this.sanitize(item),
      ])
    );
  }

  static audit(event: string, fields: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      ...this.sanitize(fields) as Record<string, unknown>,
    };
    const line = JSON.stringify(entry);
    this.printAuditSummary(event, entry);
    try {
      const logDir = path.join(process.cwd(), 'data', 'audit');
      fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(path.join(logDir, 'actions.jsonl'), line + '\n', 'utf8');
    } catch {
      // Audit file persistence is best-effort; console audit remains available.
    }
  }

  static error(title: string, error: any): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.error(`[${timestamp}] ERROR [${title}]`);
    
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      if (process.env.DEBUG_STACKS === 'true' && error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 4);
        stackLines.forEach(line => console.error(`  ${line}`));
      }
    } else if (typeof error === 'string') {
      console.error(`  ${error}`);
    } else {
      console.error(`  ${JSON.stringify(error)}`);
    }
  }

  static warn(title: string, message: string): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.warn(`[${timestamp}] WARNING [${title}] ${message}`);
  }

  static info(title: string, message: string): void {
    // Only log critical startups
    if (title.includes('HumanGuard') || title === 'System') {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      console.log(`[${timestamp}] INFO [${title}] ${message}`);
    }
  }

  static startupDiagnostics(diag: any): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log('');
    console.log('━━━━━━━━━━━━ HumanGuard AI Local Startup ━━━━━━━━━━━━');
    console.log(`[${timestamp}] Runtime : ${diag.runtimeMode}`);
    console.log(`[${timestamp}] .env    : ${diag.envFileExists ? 'found' : 'missing'}`);
    console.log(`[${timestamp}] AI      : ${diag.aiProviderConfigured ? 'configured' : 'missing GROQ_API_KEY'}`);
    console.log(`[${timestamp}] Memory  : ${diag.databaseStatus}`);
    if (diag.railwayDetected) console.log(`[${timestamp}] Railway : detected but not required for local mode`);
    if (diag.missingRequired?.length) console.warn(`[${timestamp}] Missing required : ${diag.missingRequired.join(', ')}`);
    if (diag.missingRecommended?.length) console.warn(`[${timestamp}] Recommended      : ${diag.missingRecommended.join(', ')}`);
    if (diag.invalid?.length) console.warn(`[${timestamp}] Invalid values   : ${diag.invalid.join(', ')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  static startup(botName: string): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${botName} - ready and listening (local-first)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  private static printAuditSummary(event: string, entry: Record<string, unknown>): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    if (event === 'ai_request') {
      console.log(
        `[${timestamp}] AI ${entry.provider ?? 'provider'}:${entry.model ?? 'model'} ` +
        `outcome=${entry.outcome ?? 'unknown'} status=${entry.status ?? '-'} ` +
        `duration=${entry.duration_ms ?? '-'}ms tools=${entry.tools ?? 0}`
      );
      return;
    }

    if (event === 'tool_execution') {
      const result = entry.result as any;
      const ok = result?.success === false ? 'failed' : 'ok';
      console.log(`[${timestamp}] TOOL ${entry.tool_name ?? 'unknown'} ${ok} duration=${entry.duration_ms ?? '-'}ms`);
      return;
    }

    if (/failed|blocked|required/i.test(event)) {
      const tool = entry.tool_name ? ` tool=${entry.tool_name}` : '';
      const user = entry.user_id ? ` user=${entry.user_id}` : '';
      console.warn(`[${timestamp}] AUDIT [${event}]${tool}${user}`);
      return;
    }
  }
}
