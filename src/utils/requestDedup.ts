/**
 * Request deduplication for AI requests.
 * Prevents multiple identical requests from hitting providers simultaneously.
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class RequestDeduplication<T> {
  private readonly pending = new Map<string, PendingRequest<T>>();
  private readonly completed = new Map<string, { result: T; timestamp: number }>();
  private readonly windowMs: number;
  private readonly cleanupIntervalMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    windowMs = 5000,  // 5 second dedup window
    cleanupIntervalMs = 10000  // 10 second cleanup
  ) {
    this.windowMs = windowMs;
    this.cleanupIntervalMs = cleanupIntervalMs;
  }

  /**
   * Get a deduplicated key for a request.
   * @param messages - The messages array
   * @param options - Request options
   */
  static getCacheKey(messages: unknown[], options: unknown): string {
    // Simple content-based hashing
    const messagesHash = JSON.stringify(messages);
    const optionsHash = JSON.stringify(options);
    return `${messagesHash}:${optionsHash}`;
  }

  /**
   * Execute a request with deduplication.
   * If an identical request is already in-flight, returns the same promise.
   * If an identical request was recently completed, returns the cached result.
   */
  async execute(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a recent completed result
    const cached = this.completed.get(key);
    if (cached && Date.now() - cached.timestamp < this.windowMs) {
      return cached.result;
    }

    // Check if we have an in-flight request
    const pending = this.pending.get(key);
    if (pending) {
      return pending.promise;
    }

    // Create one real in-flight promise and store it. The old implementation
    // created an extra promise and rejected it without an awaiter, which could
    // crash Node in strict unhandled-rejection mode after the caller had already
    // caught the provider error.
    const promise = fn()
      .then((result) => {
        this.completed.set(key, { result, timestamp: Date.now() });
        return result;
      })
      .finally(() => {
        if (this.pending.get(key)?.promise === promise) this.pending.delete(key);
      });

    this.pending.set(key, { promise, timestamp: Date.now() });
    return promise;
  }

  /**
   * Start periodic cleanup of expired entries.
   */
  startCleanup(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      
      // Clean completed cache
      for (const [key, entry] of this.completed) {
        if (now - entry.timestamp > this.windowMs) {
          this.completed.delete(key);
        }
      }
      
      // Clean stale pending requests (shouldn't happen, but safety net)
      for (const [key, entry] of this.pending) {
        if (now - entry.timestamp > this.windowMs * 2) {
          this.pending.delete(key);
        }
      }
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop cleanup timer.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get current stats.
   */
  getStats(): {
    pending: number;
    completed: number;
  } {
    return {
      pending: this.pending.size,
      completed: this.completed.size,
    };
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.pending.clear();
    this.completed.clear();
  }
}
