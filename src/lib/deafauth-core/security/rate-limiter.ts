// DeafAUTH Security - Rate Limiter
// Request rate limiting for API protection

import type { RateLimitConfig, RateLimitInfo, RateLimitResult } from './types';

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate Limiter
 * 
 * Provides in-memory rate limiting for API endpoints.
 * Can be extended with Redis or other distributed storage for production.
 * 
 * @example
 * ```typescript
 * const rateLimiter = new RateLimiter({
 *   windowMs: 60000,     // 1 minute
 *   maxRequests: 100     // 100 requests per minute
 * });
 * 
 * // Check if request is allowed
 * const result = await rateLimiter.check('user_123');
 * if (!result.allowed) {
 *   throw new Error('Rate limit exceeded');
 * }
 * ```
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyPrefix: config.keyPrefix ?? 'rl_',
      skipFailedRequests: config.skipFailedRequests ?? false,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
    };
    this.store = new Map();

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if a request is allowed
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyPrefix + identifier;
    const now = Date.now();
    
    // Get or create entry
    let entry = this.store.get(key);
    
    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      // Start a new window
      entry = { count: 0, windowStart: now };
    }

    // Check if limit exceeded
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const resetTime = entry.windowStart + this.config.windowMs;

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        info: {
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        },
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      info: {
        limit: this.config.maxRequests,
        remaining: remaining - 1,
        resetTime,
      },
    };
  }

  /**
   * Record a request result (for skip options)
   */
  async recordResult(identifier: string, success: boolean): Promise<void> {
    const key = this.config.keyPrefix + identifier;
    const entry = this.store.get(key);

    if (!entry) return;

    // Decrement if we should skip this type of request
    if (
      (success && this.config.skipSuccessfulRequests) ||
      (!success && this.config.skipFailedRequests)
    ) {
      entry.count = Math.max(0, entry.count - 1);
      this.store.set(key, entry);
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyPrefix + identifier;
    this.store.delete(key);
  }

  /**
   * Get current rate limit info without incrementing
   */
  getInfo(identifier: string): RateLimitInfo {
    const key = this.config.keyPrefix + identifier;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.windowStart + this.config.windowMs,
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.store.entries());
      for (const [key, entry] of entries) {
        if (now - entry.windowStart >= this.config.windowMs) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Create rate limiter with default settings
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter({
    windowMs: config?.windowMs ?? 60000,       // 1 minute
    maxRequests: config?.maxRequests ?? 100,   // 100 requests per minute
    keyPrefix: config?.keyPrefix,
    skipFailedRequests: config?.skipFailedRequests,
    skipSuccessfulRequests: config?.skipSuccessfulRequests,
  });
}

/**
 * Create rate limiter middleware for Express/Next.js
 */
export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  const limiter = createRateLimiter(config);

  return async function rateLimitMiddleware(
    identifier: string
  ): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    retryAfter?: number;
  }> {
    const result = await limiter.check(identifier);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.info.limit),
      'X-RateLimit-Remaining': String(result.info.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.info.resetTime / 1000)),
    };

    if (!result.allowed) {
      headers['Retry-After'] = String(result.info.retryAfter);
    }

    return {
      allowed: result.allowed,
      headers,
      retryAfter: result.info.retryAfter,
    };
  };
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMIT_PRESETS = {
  /**
   * Strict: 10 requests per minute
   * Use for sensitive endpoints like login
   */
  strict: {
    windowMs: 60000,
    maxRequests: 10,
  } as RateLimitConfig,

  /**
   * Standard: 100 requests per minute
   * Use for general API endpoints
   */
  standard: {
    windowMs: 60000,
    maxRequests: 100,
  } as RateLimitConfig,

  /**
   * Relaxed: 1000 requests per minute
   * Use for high-traffic public endpoints
   */
  relaxed: {
    windowMs: 60000,
    maxRequests: 1000,
  } as RateLimitConfig,

  /**
   * Burst: 20 requests per second
   * Use for endpoints that need burst capacity
   */
  burst: {
    windowMs: 1000,
    maxRequests: 20,
  } as RateLimitConfig,

  /**
   * Daily: 10000 requests per day
   * Use for quota-based access
   */
  daily: {
    windowMs: 86400000, // 24 hours
    maxRequests: 10000,
  } as RateLimitConfig,
};
