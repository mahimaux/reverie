/**
 * Design tokens for Reverie.
 * Derived from TRD §10 and the reference image: warm ivory surfaces,
 * frosted glass cards, one near-black contrast surface, and the single
 * "sun" gradient accent (warm orange → peach).
 */

export const colors = {
  // Surfaces
  bgIvory: '#F2ECE4',
  bgIvoryDeep: '#EBE3D8',
  frost: 'rgba(255,255,255,0.55)',
  frostStrong: 'rgba(255,255,255,0.72)',
  frostBorder: 'rgba(255,255,255,0.6)',
  surfaceDark: '#121110',

  // Text
  textPrimary: '#1A1814',
  textSecondary: '#8A8378',
  textTertiary: '#B3ACA0',
  textOnDark: '#F2ECE4',

  // The sun accent
  sunFrom: '#FF6A00',
  sunMid: '#FF9D4D',
  sunTo: '#FFD0A3',

  // Utility
  hairline: 'rgba(26,24,20,0.08)',
  cardCream: '#FBF7F1',
  gold: '#C9A24B',
  shadow: 'rgba(60,40,20,0.18)',
} as const;

export const sunGradient = [colors.sunFrom, colors.sunMid, colors.sunTo] as const;

export const radius = {
  sm: 14,
  md: 20,
  card: 28,
  lg: 36,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const shadowSoft = {
  shadowColor: '#3C2814',
  shadowOpacity: 0.1,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 6,
} as const;

export const shadowCard = {
  shadowColor: '#3C2814',
  shadowOpacity: 0.14,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 18 },
  elevation: 10,
} as const;
