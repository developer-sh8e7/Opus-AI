/**
 * Clean Logger - Outputs only errors in English
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
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      ...this.sanitize(fields) as Record<string, unknown>,
    }));
  }

  static error(title: string, error: any): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.error(`[${timestamp}] ERROR [${title}]`);
    
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      if (error.stack) {
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
    if (title === 'Opus Bot' || title === 'System') {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      console.log(`[${timestamp}] INFO [${title}] ${message}`);
    }
  }

  static startup(botName: string): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${botName} - Ready and Listening`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}
