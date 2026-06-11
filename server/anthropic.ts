/**
 * Anthropic client wrapper (TRD §6).
 *
 * Builds a request from the persona system prompt + an endpoint instruction,
 * asks Claude to return ONLY JSON, parses + validates it, retries once with a
 * stricter instruction on failure, and (the caller decides) falls back to gentle
 * generic content on a hard failure. The API key lives only here, server-side.
 */
import Anthropic from '@anthropic-ai/sdk';

// Lazily constructed so a missing ANTHROPIC_API_KEY surfaces as a handled error
// (clean 502 → client falls back to the mock) rather than a cold-start crash.
let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export const MODELS = {
  // TRD §6: sonnet class for fast, warm, low-cost generation...
  quick: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  // ...reserve an opus class for the letter for extra richness.
  letter:
    process.env.ANTHROPIC_MODEL_LETTER ||
    process.env.ANTHROPIC_MODEL ||
    'claude-opus-4-8',
};

interface GenOpts {
  system: string;
  user: string;
  model: string;
  maxTokens?: number;
  /** Lower effort keeps the warm, short generations snappy (TRD latency target). */
  effort?: 'low' | 'medium' | 'high';
}

/** Pull the JSON object out of Claude's text (strip stray fences / prose). */
function extractJSON(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return JSON.parse(t);
}

/** The product voice never uses em dashes; scrub them from every generated string. */
export function deEmDash<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\s*—\s*/g, ', ').replace(/—/g, ', ') as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => deEmDash(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deEmDash(v);
    return out as T;
  }
  return value;
}

/** Generate a validated JSON object. Throws if validation fails twice. */
export async function generateJSON<T>(
  opts: GenOpts,
  validate: (x: unknown) => x is T,
): Promise<T> {
  const run = async (extra?: string): Promise<T> => {
    const resp = await client().messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
      system: opts.system,
      messages: [
        { role: 'user', content: extra ? `${opts.user}\n\n${extra}` : opts.user },
      ],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const parsed = extractJSON(text);
    if (!validate(parsed)) throw new Error('schema validation failed');
    return deEmDash(parsed);
  };

  try {
    return await run();
  } catch {
    // One stricter retry (TRD §6).
    return run(
      'Return ONLY valid JSON in the exact schema requested. No prose, no markdown, no code fences, and never use em dashes.',
    );
  }
}
