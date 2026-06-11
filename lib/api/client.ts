/**
 * Typed API client (TRD §5). This is the single seam between the app and the AI.
 *
 * - If `EXPO_PUBLIC_API_BASE_URL` is set, it calls the real serverless backend
 *   (the Vercel functions in /api), which holds the Anthropic key.
 * - Otherwise (or if a remote call fails) it falls back to the on-device mock,
 *   so the app always works in development and degrades gracefully (TRD §6).
 *
 * The contract (inputs/outputs) is identical either way.
 */
import { Platform } from 'react-native';
import { getDeviceId } from '../storage/repo';
import type {
  ChapterOneResult,
  ChapterThreeResult,
  ChapterTwoResult,
  GeneratedQuestion,
  ReadingContext,
} from '../types';
import * as mock from './mockApi';
import { safetyCheck, type SafetyResult } from './safety';

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
// On web, the app is served from the same origin as the /api functions, so we
// can call them with a relative path even without an explicit base URL. Native
// builds have no origin, so they only go remote when a base URL is configured.
const IS_WEB = Platform.OS === 'web';
const USE_REMOTE = API_BASE.length > 0 || IS_WEB;

async function post<T>(path: string, body: unknown): Promise<T> {
  const deviceId = await getDeviceId();
  const url = API_BASE ? `${API_BASE}/api/${path}` : `/api/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`api/${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export type ReframeResponse =
  | { safe: true; result: ChapterOneResult }
  | { safe: false; safety: SafetyResult };

/** POST /reframe (+ inline /safety-check). */
export async function getReframe(
  feelings: string[],
  situation: string,
): Promise<ReframeResponse> {
  // Fast, offline-safe guard first (defense in depth; server re-checks too).
  const safety = safetyCheck(situation);
  if (!safety.ok) return { safe: false, safety };

  if (USE_REMOTE) {
    try {
      return await post<ReframeResponse>('reframe', { feelings, situation });
    } catch {
      // fall through to mock
    }
  }
  return { safe: true, result: await mock.reframe(feelings, situation) };
}

/** POST /superpower-questions */
export async function getSuperpowerQuestions(
  ctx: ReadingContext,
): Promise<GeneratedQuestion[]> {
  if (USE_REMOTE) {
    try {
      const { questions } = await post<{ questions: GeneratedQuestion[] }>(
        'superpower-questions',
        { context: ctx },
      );
      return questions;
    } catch {
      /* fall through */
    }
  }
  return mock.superpowerQuestions(ctx);
}

/** POST /affirmations */
export async function getAffirmations(ctx: ReadingContext): Promise<ChapterTwoResult> {
  if (USE_REMOTE) {
    try {
      return await post<ChapterTwoResult>('affirmations', {
        context: ctx,
        superpowerQA: ctx.superpowerQA ?? [],
      });
    } catch {
      /* fall through */
    }
  }
  return mock.affirmations(ctx);
}

/** POST /letter-questions */
export async function getLetterQuestions(
  ctx: ReadingContext,
): Promise<GeneratedQuestion[]> {
  if (USE_REMOTE) {
    try {
      const { questions } = await post<{ questions: GeneratedQuestion[] }>(
        'letter-questions',
        { context: ctx },
      );
      return questions;
    } catch {
      /* fall through */
    }
  }
  return mock.letterQuestions(ctx);
}

/** POST /letter */
export async function getLetter(
  ctx: ReadingContext,
  firstName?: string,
): Promise<ChapterThreeResult> {
  if (USE_REMOTE) {
    try {
      return await post<ChapterThreeResult>('letter', {
        context: ctx,
        letterQA: ctx.letterQA ?? [],
        firstName,
      });
    } catch {
      /* fall through */
    }
  }
  return mock.letter(ctx, firstName);
}
