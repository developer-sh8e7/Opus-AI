/**
 * Per-provider rate limiter with token-aware throttling.
 * Tracks both RPM (requests per minute) and TPM (tokens per minute) per provider.
 */

interface ProviderLimits {
  rpm: number;  // requests per minute
  tpm: number;  // tokens per minute
}

interface ProviderWindow {
  requestTimestamps: number[];
  tokenUsage: number[];
  totalTokensInWindow: number;
  totalRequestsInWindow: number;
}

export interface ProviderLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  reason?: 'rpm' | 'tpm' | 'both';
  currentUsage?: {
    rpm: number;
    tpm: number;
    rpmLimit: number;
    tpmLimit: number;
  };
}

// Default limits from provider documentation
const DEFAULT_LIMITS: Record<string, ProviderLimits> = {
  'groq': { rpm: 60, tpm: 20_000 },  // Conservative default; model overrides below
  'gemini': { rpm: 15, tpm: 1_000_000 },  // Gemini free tier: 15 RPM, 1M TPM, 1500 RPD
  'cerebras': { rpm: 30, tpm: 15_000 }, // Cerebras free tier conservative
};

// Known model-specific overrides
const MODEL_OVERRIDES: Record<string, ProviderLimits> = {
  // Free/on-demand tier limits (conservative — observed ~6K TPM on small models)
  'llama-3.1-8b-instant': { rpm: 30, tpm: 6_000 },
  'meta-llama/llama-4-scout-17b-16e-instruct': { rpm: 30, tpm: 10_000 },
  'openai/gpt-oss-20b': { rpm: 30, tpm: 10_000 },
  'mixtral-8x7b-32768': { rpm: 30, tpm: 10_000 },
  // Large models — higher free tier TPM
  'llama-3.3-70b-versatile': { rpm: 30, tpm: 12_000 },
  'openai/gpt-oss-120b': { rpm: 15, tpm: 8_000 },
  // Qwen (Arabic-strong)
  'qwen/qwen3-32b': { rpm: 30, tpm: 12_000 },
  'qwen/qwen3.6-27b': { rpm: 30, tpm: 12_000 },
  // Decommissioned (kept for reference)
  'qwen-2.5-32b': { rpm: 30, tpm: 12_000 },
  // Cerebras model overrides
  'llama-3.3-70b': { rpm: 30, tpm: 15_000 },
  // Gemini model - conservative free tier
  'gemini-2.0-flash': { rpm: 15, tpm: 1_000_000 },
};

export class ProviderRateLimiter {
  private readonly windows = new Map<string, ProviderWindow>();
  private readonly windowMs = 60_000; // 1 minute window

  constructor(
    private readonly customLimits?: Partial<Record<string, ProviderLimits>>
  ) {}

  /**
   * Check if a request to the provider would exceed limits.
   * @param provider - Provider name (groq|gemini|cerebras)
   * @param estimatedTokens - Estimated tokens for this request (input + output)
   * @param modelName - Optional model name for model-specific limits
   */
  check(
    provider: string,
    estimatedTokens: number,
    modelName?: string
  ): ProviderLimitResult {
    const limits = this.getLimits(provider, modelName);
    const now = Date.now();
    const window = this.getWindow(provider);

    // Clean old entries
    const cutoff = now - this.windowMs;
    window.requestTimestamps = window.requestTimestamps.filter(t => t > cutoff);
    window.tokenUsage = window.tokenUsage.filter((_, i) => {
      const timestamp = window.requestTimestamps[i];
      return timestamp !== undefined && timestamp > cutoff;
    });

    // Recalculate totals
    window.totalRequestsInWindow = window.requestTimestamps.length;
    window.totalTokensInWindow = window.tokenUsage.reduce((sum, tokens) => sum + tokens, 0);

    // First request in this window is always allowed (TPM is a rolling minute limit,
    // a single burst request can exceed the per-minute limit temporarily)
    if (window.totalRequestsInWindow === 0) {
      window.requestTimestamps.push(now);
      window.tokenUsage.push(estimatedTokens);
      return {
        allowed: true,
        currentUsage: {
          rpm: 1,
          tpm: estimatedTokens,
          rpmLimit: limits.rpm,
          tpmLimit: limits.tpm,
        },
      };
    }

    // Check cumulative RPM
    const rpmExceeded = window.totalRequestsInWindow >= limits.rpm;
    // Check cumulative TPM (only after first request is already recorded)
    const tpmExceeded = window.totalTokensInWindow + estimatedTokens > limits.tpm;

    if (rpmExceeded || tpmExceeded) {
      // Calculate retry time based on what's exceeded
      let retryAfterMs = 0;
      let reason: 'rpm' | 'tpm' | 'both' = 'both';

      if (rpmExceeded && tpmExceeded) {
        const oldestRequest = window.requestTimestamps[0];
        retryAfterMs = this.windowMs - (now - oldestRequest);
        reason = 'both';
      } else if (rpmExceeded) {
        const oldestRequest = window.requestTimestamps[0];
        retryAfterMs = this.windowMs - (now - oldestRequest);
        reason = 'rpm';
      } else {
        // TPM exceeded - calculate when enough tokens expire
        let cumulativeTokens = 0;
        let i = 0;
        while (i < window.tokenUsage.length) {
          cumulativeTokens += window.tokenUsage[i];
          if (window.totalTokensInWindow - cumulativeTokens + estimatedTokens <= limits.tpm) {
            const clearTime = window.requestTimestamps[i] + this.windowMs;
            retryAfterMs = clearTime - now;
            break;
          }
          i++;
        }
        if (retryAfterMs === 0) {
          retryAfterMs = this.windowMs;
        }
        reason = 'tpm';
      }

      return {
        allowed: false,
        retryAfterMs: Math.max(100, retryAfterMs),
        reason,
        currentUsage: {
          rpm: window.totalRequestsInWindow,
          tpm: window.totalTokensInWindow,
          rpmLimit: limits.rpm,
          tpmLimit: limits.tpm,
        },
      };
    }

    // Allow request - record it
    window.requestTimestamps.push(now);
    window.tokenUsage.push(estimatedTokens);

    return {
      allowed: true,
      currentUsage: {
        rpm: window.totalRequestsInWindow + 1,
        tpm: window.totalTokensInWindow + estimatedTokens,
        rpmLimit: limits.rpm,
        tpmLimit: limits.tpm,
      },
    };
  }

  /**
   * Record actual token usage after a successful request.
   * This updates the window with the actual tokens consumed.
   */
  recordUsage(provider: string, tokensUsed: number): void {
    const window = this.getWindow(provider);
    // Update the last entry with actual usage
    if (window.tokenUsage.length > 0) {
      window.tokenUsage[window.tokenUsage.length - 1] = tokensUsed;
    }
  }

  /**
   * Get current usage stats for a provider.
   */
  getStats(provider: string, modelName?: string): {
    rpm: number;
    tpm: number;
    rpmLimit: number;
    tpmLimit: number;
    utilization: { rpm: number; tpm: number };
  } {
    const limits = this.getLimits(provider, modelName);
    const window = this.getWindow(provider);
    const now = Date.now();
    const cutoff = now - this.windowMs;

    // Clean old entries
    const recentRequests = window.requestTimestamps.filter(t => t > cutoff);
    const recentTokens = window.tokenUsage.slice(0, recentRequests.length);

    const rpm = recentRequests.length;
    const tpm = recentTokens.reduce((sum, tokens) => sum + tokens, 0);

    return {
      rpm,
      tpm,
      rpmLimit: limits.rpm,
      tpmLimit: limits.tpm,
      utilization: {
        rpm: Math.round((rpm / limits.rpm) * 100),
        tpm: Math.round((tpm / limits.tpm) * 100),
      },
    };
  }

  /**
   * Clear all tracked data (useful for circuit breaker resets).
   */
  clear(): void {
    this.windows.clear();
  }

  private getLimits(provider: string, modelName?: string): ProviderLimits {
    // Check model-specific overrides first
    if (modelName && MODEL_OVERRIDES[modelName]) {
      return MODEL_OVERRIDES[modelName];
    }
    // Then check custom overrides
    if (this.customLimits && this.customLimits[provider]) {
      return this.customLimits[provider]!;
    }
    // Then check defaults
    if (DEFAULT_LIMITS[provider]) {
      return DEFAULT_LIMITS[provider]!;
    }
    // Fallback to conservative defaults
    return { rpm: 20, tpm: 10_000 };
  }

  private getWindow(provider: string): ProviderWindow {
    if (!this.windows.has(provider)) {
      this.windows.set(provider, {
        requestTimestamps: [],
        tokenUsage: [],
        totalTokensInWindow: 0,
        totalRequestsInWindow: 0,
      });
    }
    return this.windows.get(provider)!;
  }
}

// Singleton instance
export const providerRateLimiter = new ProviderRateLimiter();
