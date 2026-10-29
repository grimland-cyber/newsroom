/**
 * In-memory login throttle. No extra infrastructure.
 * On Vercel this lives in one server instance, so it slows and stops bursts
 * against a warm instance rather than forming a global lockout.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const FAILURE_DELAY_MS = 800;
const MAX_TRACKED_KEYS = 2000;

type Bucket = { failures: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientKeyFromForwardedHeaders(input: {
  forwardedFor: string | null;
  realIp: string | null;
}): string {
  const forwarded = input.forwardedFor?.split(",")[0]?.trim();
  return forwarded || input.realIp?.trim() || "unknown";
}

export function loginBlocked(key: string, now = Date.now()): { retryAfterSec: number } | null {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) return null;
  if (bucket.failures < MAX_FAILURES) return null;
  return { retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.delete(key);
    buckets.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.failures += 1;
    // Refresh insertion order so the cap drops the oldest keys first.
    buckets.delete(key);
    buckets.set(key, bucket);
  }

  while (buckets.size > MAX_TRACKED_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}

export function loginFailureDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, FAILURE_DELAY_MS);
  });
}
