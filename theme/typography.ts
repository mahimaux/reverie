/**
 * Font families. Display/UI uses Inter (a clean, light neo-grotesque
 * stand-in for PP Neue Montreal). Editorial moments — card quotes and the
 * future-self letter — use Fraunces, an elegant serif, for the tarot/luxe feel.
 * Both are open-licensed (loaded from @expo-google-fonts) so they're safe to bundle.
 */

export const fonts = {
  // Inter (UI / display)
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',

  // Fraunces (editorial serif)
  serif: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_400Regular_Italic',
  serifLight: 'Fraunces_300Light',
} as const;

export const type = {
  // Big light display headings
  hero: { fontFamily: fonts.light, fontSize: 44, lineHeight: 48, letterSpacing: -1 },
  display: { fontFamily: fonts.light, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: fonts.medium, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },

  // Editorial serif
  serifQuote: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 32 },
  serifTitle: { fontFamily: fonts.serifLight, fontSize: 30, lineHeight: 36 },
  serifBody: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 27 },
} as const;
