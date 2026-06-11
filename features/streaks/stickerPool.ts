/**
 * The collectible sticker pool (PRD §6). Each carries 2-3 words of warmth.
 * `art` maps to a gradient/emoji motif rendered by StickerTile — no external assets needed.
 */

export interface StickerDef {
  label: string;
  art: string; // motif key
  glyph: string;
}

export const DAILY_STICKERS: StickerDef[] = [
  { label: 'you got this', art: 'sun', glyph: '☀' },
  { label: 'proud of you', art: 'heart', glyph: '✿' },
  { label: "you're genuine", art: 'gem', glyph: '◈' },
  { label: "you're loved", art: 'heart', glyph: '❥' },
  { label: 'keep going', art: 'arrow', glyph: '➜' },
  { label: 'you matter', art: 'star', glyph: '✦' },
  { label: 'soft & strong', art: 'moon', glyph: '☾' },
  { label: 'so worth it', art: 'gem', glyph: '❖' },
  { label: 'look at you', art: 'sun', glyph: '✸' },
  { label: 'still here', art: 'sprout', glyph: '❀' },
  { label: 'breathe easy', art: 'moon', glyph: '✶' },
  { label: 'enough, always', art: 'star', glyph: '✧' },
];

export const MILESTONE_STICKERS: Record<7 | 30 | 100, StickerDef> = {
  7: { label: 'one whole week', art: 'milestone', glyph: '✷' },
  30: { label: 'a steady month', art: 'milestone', glyph: '❂' },
  100: { label: 'a hundred days', art: 'milestone', glyph: '⟡' },
};

/** Deterministic-ish daily pick so two devices on the same day tend to match. */
export function pickDailySticker(seedDate: string): StickerDef {
  let hash = 0;
  for (let i = 0; i < seedDate.length; i++) hash = (hash * 31 + seedDate.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % DAILY_STICKERS.length;
  return DAILY_STICKERS[idx];
}
