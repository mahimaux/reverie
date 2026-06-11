/** Output schema validators (TRD §6 "validate shape"). Hand-written type guards. */
import type {
  ChapterOneResult,
  ChapterThreeResult,
  ChapterTwoResult,
  GeneratedQuestion,
} from '../lib/types';

const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;

export function isChapterOne(x: unknown): x is ChapterOneResult {
  const o = x as ChapterOneResult;
  return !!o && isStr(o.behindTheScenes) && isStr(o.flip);
}

export function isQuestions(x: unknown): x is { questions: GeneratedQuestion[] } {
  const o = x as { questions?: unknown };
  if (!o || !Array.isArray(o.questions) || o.questions.length === 0) return false;
  return o.questions.every((q) => {
    const qq = q as GeneratedQuestion;
    return isStr(qq.id) && isStr(qq.text) && typeof qq.placeholder === 'string';
  });
}

export function isAffirmations(x: unknown): x is ChapterTwoResult {
  const o = x as { affirmations?: unknown };
  return (
    !!o &&
    Array.isArray(o.affirmations) &&
    o.affirmations.length === 3 &&
    o.affirmations.every(isStr)
  );
}

export function isLetter(x: unknown): x is ChapterThreeResult {
  const o = x as ChapterThreeResult;
  return !!o && isStr(o.letter);
}
