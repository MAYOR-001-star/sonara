/**
 * In-memory fixed-window rate limiter, keyed by an arbitrary string (usually a
 * client IP). Used to throttle the unauthenticated checkout endpoint.
 *
 * Scope: this is per-process state. It is effective against a single instance
 * and against casual scripted abuse, which is what we need here. On a
 * multi-instance or serverless deployment each instance keeps its own counters,
 * so the effective ceiling is `limit * instances`. Swap the store for Redis
 * (Upstash, Supabase KV) if the deployment scales out.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bound the map so a spoofed-IP flood cannot grow it without limit. */
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  // Opportunistic sweep of expired buckets; cheap and avoids a timer.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
    // Hard cap in case everything is still live: drop the oldest.
    while (buckets.size > MAX_BUCKETS) {
      const oldest = buckets.keys().next();
      if (oldest.done) break;
      buckets.delete(oldest.value);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
  };
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-controlled, so it is only trusted as far as the
 * platform sets it — on Vercel/Netlify the platform appends the real IP and
 * strips client-supplied values. `x-real-ip` is set by the platform itself.
 * Neither is spoof-proof behind a custom proxy; treat this as abuse damping,
 * not authentication.
 */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the originating client.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}