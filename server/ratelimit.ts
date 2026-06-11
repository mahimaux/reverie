/**
 * Lightweight in-memory rate limiter (TRD §5).
 *
 * Best-effort only: serverless instances are ephemeral and scale horizontally,
 * so this caps abuse per warm instance rather than globally. For production,
 * back this with Vercel KV / Upstash Redis keyed the same way.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow unbounded on a warm instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return true;
}
