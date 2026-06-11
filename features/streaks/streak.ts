/**
 * Streak + sticker awarding (TRD §4 streak logic, PRD §6 guardrail).
 * Trigger = completing a reading [DEFAULT]. Encouraging, never punishing:
 * a gap resets to 1 with a soft "welcome back" — no guilt, no loss framing.
 */
import * as Crypto from 'expo-crypto';
import { addSticker, getStreak, getStickers, saveStreak } from '../../lib/storage/repo';
import type { Sticker, StreakState } from '../../lib/types';
import { MILESTONE_STICKERS, pickDailySticker } from './stickerPool';

/** Local calendar day as yyyy-mm-dd (avoids UTC off-by-one). */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export interface AwardResult {
  alreadyEarnedToday: boolean;
  streak: StreakState;
  sticker?: Sticker;
  welcomeBack: boolean; // a gentle gap was bridged
  message: string;
}

/** Call when a reading completes. Idempotent per calendar day. */
export async function awardForToday(): Promise<AwardResult> {
  const today = todayKey();
  const streak = await getStreak();

  if (streak.lastEarnedDate === today) {
    return {
      alreadyEarnedToday: true,
      streak,
      welcomeBack: false,
      message: "Today's sticker is already in your book.",
    };
  }

  const gap = streak.lastEarnedDate ? dayDiff(streak.lastEarnedDate, today) : null;
  const consecutive = gap === 1;
  const welcomeBack = gap !== null && gap > 1;

  const current = consecutive ? streak.current + 1 : 1;
  const longest = Math.max(streak.longest, current);
  const next: StreakState = { current, longest, lastEarnedDate: today };
  await saveStreak(next);

  // Milestone art at 7 / 30 / 100, otherwise a daily warm sticker.
  const milestone = ([7, 30, 100] as const).find((m) => m === current);
  const def = milestone ? MILESTONE_STICKERS[milestone] : pickDailySticker(today);
  const sticker: Sticker = {
    id: Crypto.randomUUID(),
    label: def.label,
    art: def.glyph,
    earnedOn: new Date().toISOString(),
    milestone,
  };
  await addSticker(sticker);

  const message = milestone
    ? `${current} days. That's a real, quiet kind of strength.`
    : welcomeBack
      ? 'Welcome back. No pressure, no catching up. Just a fresh start. 🤍'
      : current === 1
        ? 'Day one. Lovely to have you here.'
        : `${current} days in a row. Look at you.`;

  return { alreadyEarnedToday: false, streak: next, sticker, welcomeBack, message };
}

export async function streakSummary() {
  const [streak, stickers] = await Promise.all([getStreak(), getStickers()]);
  return { streak, count: stickers.length, earnedToday: streak.lastEarnedDate === todayKey() };
}
