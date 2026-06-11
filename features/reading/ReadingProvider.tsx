/**
 * The reading flow state machine (TRD §3.3). One `Reading` accumulates across
 * the three chapters so personalisation compounds — Chapter 3 "knows" about the
 * situation from Chapter 1 and the superpowers from Chapter 2.
 */
import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  ChapterOneResult,
  ChapterThreeResult,
  ChapterTwoResult,
  QA,
  Reading,
} from '../../lib/types';

interface ReadingApi {
  reading: Reading | null;
  start: (feelings: string[], situation: string, moodBefore?: number) => Reading;
  setChapterOne: (r: ChapterOneResult) => void;
  setSuperpowerQA: (qa: QA[]) => void;
  setChapterTwo: (r: ChapterTwoResult) => void;
  setLetterQA: (qa: QA[]) => void;
  setLetter: (r: ChapterThreeResult) => void;
  setMoodAfter: (n: number) => void;
  markComplete: () => Reading | null;
  reset: () => void;
}

const Ctx = createContext<ReadingApi | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [reading, setReading] = useState<Reading | null>(null);

  const start = useCallback(
    (feelings: string[], situation: string, moodBefore?: number) => {
      const next: Reading = {
        context: {
          id: Crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          feelings,
          situation,
        },
        moodBefore,
      };
      setReading(next);
      return next;
    },
    [],
  );

  const patch = useCallback((fn: (r: Reading) => Reading) => {
    setReading((cur) => (cur ? fn(cur) : cur));
  }, []);

  const api = useMemo<ReadingApi>(
    () => ({
      reading,
      start,
      setChapterOne: (r) => patch((cur) => ({ ...cur, chapterOne: r })),
      setSuperpowerQA: (qa) =>
        patch((cur) => ({ ...cur, context: { ...cur.context, superpowerQA: qa } })),
      setChapterTwo: (r) => patch((cur) => ({ ...cur, chapterTwo: r })),
      setLetterQA: (qa) =>
        patch((cur) => ({ ...cur, context: { ...cur.context, letterQA: qa } })),
      setLetter: (r) => patch((cur) => ({ ...cur, letter: r })),
      setMoodAfter: (n) => patch((cur) => ({ ...cur, moodAfter: n })),
      markComplete: () => {
        let done: Reading | null = null;
        setReading((cur) => {
          if (!cur) return cur;
          done = { ...cur, completedAt: new Date().toISOString() };
          return done;
        });
        return done;
      },
      reset: () => setReading(null),
    }),
    [reading, start, patch],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useReading(): ReadingApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReading must be used within ReadingProvider');
  return ctx;
}
