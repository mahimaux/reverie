/** Client-side data model — mirrors TRD §4. Storage is JSON documents. */

export type FeelingTag = string;

export interface QA {
  q: string;
  a: string;
}

export interface ReadingContext {
  id: string;
  createdAt: string;
  feelings: FeelingTag[];
  situation: string;
  superpowerQA?: QA[];
  letterQA?: QA[];
}

export interface ChapterOneResult {
  behindTheScenes: string;
  flip: string;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  placeholder: string;
}

export interface ChapterTwoResult {
  affirmations: [string, string, string];
}

export interface ChapterThreeResult {
  letter: string;
}

export interface Reading {
  context: ReadingContext;
  chapterOne?: ChapterOneResult;
  chapterTwo?: ChapterTwoResult;
  letter?: ChapterThreeResult;
  completedAt?: string;
  moodBefore?: number; // 0-100
  moodAfter?: number; // 0-100
}

export interface Sticker {
  id: string;
  label: string;
  art: string; // asset id (maps to a gradient/emoji motif)
  earnedOn: string; // ISO date (one per day max)
  milestone?: 7 | 30 | 100;
}

export interface StreakState {
  current: number;
  longest: number;
  lastEarnedDate: string | null; // ISO date (yyyy-mm-dd)
}

export interface UserProfile {
  firstName?: string;
  notificationsOptIn: boolean;
  onboarded: boolean;
  createdAt: string;
}
