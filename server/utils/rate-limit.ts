import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimitOptions {
  /** Unique key to separate rate limit buckets per endpoint */
  key: string
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests allowed within the window */
  maxRequests: number
}

class RateLimitStore {
  private buckets = new Map<string, RateLimitEntry>()

  /** Check rate limit and throw 429 if exceeded */
  check(ip: string, options: RateLimitOptions): void {
    const bucketKey = `${options.key}:${ip}`
    const now = Date.now()
    const windowStart = now - options.windowMs

    let entry = this.buckets.get(bucketKey)
    if (!entry) {
      entry = { timestamps: [] }
      this.buckets.set(bucketKey, entry)
    }

    // Remove timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart)

    if (entry.timestamps.length >= options.maxRequests) {
      throw createError({
        statusCode: 429,
        message: 'Too many requests, please try again later',
      })
    }

    entry.timestamps.push(now)

    // Periodically clean up stale entries to prevent memory growth
    if (Math.random() < 0.05) {
      this.cleanup(now)
    }
  }

  /** Remove all entries with no timestamps within a generous window */
  private cleanup(now: number): void {
    const maxWindow = 5 * 60 * 1000 // 5 minutes
    for (const [key, entry] of this.buckets) {
      const recent = entry.timestamps.filter(t => t > now - maxWindow)
      if (recent.length === 0) {
        this.buckets.delete(key)
      }
    }
  }
}

// Persist across HMR reloads in development
const globalForRateLimit = globalThis as typeof globalThis & { __rateLimitStore?: RateLimitStore }
const rateLimitStore = globalForRateLimit.__rateLimitStore ??= new RateLimitStore()

/** Check rate limit for the current request. Throws 429 if limit exceeded. */
export function checkRateLimit(event: H3Event, options: RateLimitOptions): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  rateLimitStore.check(ip, options)
}
