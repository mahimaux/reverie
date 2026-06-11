/** Shared HTTP helpers for the serverless functions: CORS, method guard, body, rate limit. */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit } from './ratelimit';

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-id');
}

export function getBody<T = Record<string, unknown>>(req: VercelRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
}

/** Anonymous per-device/IP key for rate limiting without accounts (TRD §5). */
function clientKey(req: VercelRequest): string {
  const device = (req.headers['x-device-id'] as string) || '';
  const fwd = (req.headers['x-forwarded-for'] as string) || '';
  const ip = fwd.split(',')[0].trim() || (req.socket?.remoteAddress ?? 'unknown');
  return `${ip}:${device}`;
}

/**
 * Standard guard for every endpoint. Handles CORS preflight, enforces POST,
 * and rate-limits. Returns parsed body, or null if the request was already
 * answered (preflight / method / rate-limit).
 */
export function guard<T = Record<string, unknown>>(
  req: VercelRequest,
  res: VercelResponse,
): T | null {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return null;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return null;
  }
  if (!rateLimit(clientKey(req))) {
    res.status(429).json({ error: 'rate_limited' });
    return null;
  }
  return getBody<T>(req);
}

/** Log only anonymous, structural metrics (TRD §5: never log raw inputs). */
export function logMetric(endpoint: string, ms: number, ok: boolean): void {
  console.log(JSON.stringify({ endpoint, ms, ok, t: Date.now() }));
}
