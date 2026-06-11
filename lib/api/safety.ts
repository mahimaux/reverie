/**
 * Lightweight client-side safety pre-check (TRD §8 / acceptance criteria).
 * A real build runs this server-side as a low-token Claude call; here it's a
 * gentle screening rule. If free text signals serious distress or self-harm,
 * we DO NOT return a comparison reframe — the flow routes to a supportive
 * message + resources, and the user continues only if they choose.
 *
 * Tuned to be calm and non-alarming, and deliberately conservative.
 */

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill (myself|me)\b/i,
  /\bend (my|it all|my life)\b/i,
  /\b(i|i'?m) (want|wanting|going) to die\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\bhurt(ing)? myself\b/i,
  /\bcut(ting)? myself\b/i,
  /\bno (reason|point) (to|in) (living|going on)\b/i,
  /\bbetter off (without me|dead)\b/i,
  /\bdon'?t want to (be here|live|wake up)\b/i,
];

export interface SafetyResult {
  ok: boolean;
  reason?: string;
}

export function safetyCheck(text: string): SafetyResult {
  const hit = CRISIS_PATTERNS.some((re) => re.test(text));
  return hit ? { ok: false, reason: 'distress' } : { ok: true };
}

/** Region-agnostic starting points; a real build localises these (TRD §8). */
export const SUPPORT_RESOURCES = [
  {
    label: 'Call or text 988 (US Suicide & Crisis Lifeline)',
    detail: 'Free, confidential, 24/7.',
    href: 'tel:988',
  },
  {
    label: 'Crisis Text Line: text HOME to 741741',
    detail: 'US & Canada. Text a trained counselor.',
    href: 'sms:741741',
  },
  {
    label: 'Find a helpline near you',
    detail: 'findahelpline.com, a directory by country.',
    href: 'https://findahelpline.com',
  },
];
