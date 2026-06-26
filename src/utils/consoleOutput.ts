let installed = false;

function sanitizeForEnglishConsole(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, '[arabic]')
      .replace(/\s{2,}/g, ' ');
  }

  if (value instanceof Error) {
    const message = sanitizeForEnglishConsole(value.message);
    if (process.env.DEBUG_STACKS === 'true' && value.stack) {
      return sanitizeForEnglishConsole(value.stack);
    }
    return `${value.name}: ${message}`;
  }

  if (Array.isArray(value)) return value.map(sanitizeForEnglishConsole);

  if (value && typeof value === 'object') {
    try {
      return sanitizeForEnglishConsole(JSON.stringify(value));
    } catch {
      return '[object]';
    }
  }

  return value;
}

export function installEnglishConsoleOutput(): void {
  if (installed || process.env.HUMANGUARD_RAW_CONSOLE === 'true') return;
  installed = true;

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args: unknown[]) => original.log(...args.map(sanitizeForEnglishConsole));
  console.info = (...args: unknown[]) => original.info(...args.map(sanitizeForEnglishConsole));
  console.warn = (...args: unknown[]) => original.warn(...args.map(sanitizeForEnglishConsole));
  console.error = (...args: unknown[]) => original.error(...args.map(sanitizeForEnglishConsole));
}
