/**
 * Security Middleware - Rate Limiter
 *
 * In-memory sliding-window rate limiter.
 * Adapted from Gestão RH pattern.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  create: { windowMs: 60_000, maxRequests: 30 },
  update: { windowMs: 60_000, maxRequests: 30 },
  delete: { windowMs: 60_000, maxRequests: 10 },
  login: { windowMs: 300_000, maxRequests: 5 },
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.create
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
