interface WindowState {
  timestamps: number[];
}

export interface LimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  scope?: 'user' | 'guild';
}

export class AIRequestLimiter {
  private readonly users = new Map<string, WindowState>();
  private readonly guilds = new Map<string, WindowState>();
  private readonly guildQueues = new Map<string, Promise<void>>();

  constructor(
    private readonly userLimit = 5,
    private readonly guildLimit = 20,
    private readonly windowMs = 60_000
  ) {}

  check(userId: string, guildId: string, now = Date.now()): LimitResult {
    const userResult = this.consume(this.users, userId, this.userLimit, now);
    if (!userResult.allowed) return { ...userResult, scope: 'user' };

    const guildResult = this.consume(this.guilds, guildId, this.guildLimit, now);
    if (!guildResult.allowed) {
      this.rollback(this.users, userId, now);
      return { ...guildResult, scope: 'guild' };
    }
    return { allowed: true };
  }

  async schedule<T>(guildId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.guildQueues.get(guildId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => current);
    this.guildQueues.set(guildId, tail);

    await previous;
    try {
      return await task();
    } finally {
      release();
      if (this.guildQueues.get(guildId) === tail) this.guildQueues.delete(guildId);
    }
  }

  cleanup(now = Date.now()): void {
    this.cleanupMap(this.users, now);
    this.cleanupMap(this.guilds, now);
  }

  private consume(
    store: Map<string, WindowState>,
    key: string,
    limit: number,
    now: number
  ): LimitResult {
    const state = store.get(key) ?? { timestamps: [] };
    state.timestamps = state.timestamps.filter((timestamp) => now - timestamp < this.windowMs);
    if (state.timestamps.length >= limit) {
      const retryAfterMs = this.windowMs - (now - state.timestamps[0]);
      store.set(key, state);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
    state.timestamps.push(now);
    store.set(key, state);
    return { allowed: true };
  }

  private rollback(store: Map<string, WindowState>, key: string, timestamp: number): void {
    const state = store.get(key);
    if (!state) return;
    const index = state.timestamps.lastIndexOf(timestamp);
    if (index >= 0) state.timestamps.splice(index, 1);
  }

  private cleanupMap(store: Map<string, WindowState>, now: number): void {
    for (const [key, state] of store) {
      state.timestamps = state.timestamps.filter((timestamp) => now - timestamp < this.windowMs);
      if (state.timestamps.length === 0) store.delete(key);
    }
  }
}
