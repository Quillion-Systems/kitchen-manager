/**
 * Design tokens — typography.
 *
 * Font loading:
 *   - Web: @fontsource-variable/bricolage-grotesque + @fontsource/instrument-serif,
 *     imported in apps/web/src/styles.css.
 *   - Mobile: @expo-google-fonts/bricolage-grotesque + @expo-google-fonts/instrument-serif,
 *     loaded via useFonts in apps/mobile/app/_layout.tsx.
 *
 * KEEP IN SYNC WITH ./tokens.css — both files are hand-maintained mirrors.
 */

export const fontFamilies = {
  /** Primary sans. Variable font covers all weights (200–800). */
  sans: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, -apple-system, sans-serif",
  /** Display serif. Instrument Serif ships only 400. */
  serif: "'Instrument Serif', Georgia, serif",
} as const

/**
 * Per-weight font-family identifiers for React Native. RN does not resolve
 * `fontWeight` against variable fonts — each weight is a separately loaded
 * font with its own `fontFamily` identifier. Use these on mobile instead of
 * `fontFamilies.sans`.
 */
export const mobileFonts = {
  sansExtraLight: "BricolageGrotesque_200ExtraLight",
  sansLight: "BricolageGrotesque_300Light",
  sansRegular: "BricolageGrotesque_400Regular",
  sansMedium: "BricolageGrotesque_500Medium",
  sansSemibold: "BricolageGrotesque_600SemiBold",
  sansBold: "BricolageGrotesque_700Bold",
  sansExtrabold: "BricolageGrotesque_800ExtraBold",
  serifRegular: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
} as const

/** Numeric scale in px. Overrides Tailwind's defaults from text-lg upward. */
export const fontSizes = {
  "2xs": 11,
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
} as const

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

/** Unitless multipliers of the current font-size. */
export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.45,
  relaxed: 1.6,
} as const

/** In em units. */
export const letterSpacings = {
  tightest: -0.055,
  tighter: -0.03,
  tight: -0.02,
  normal: 0,
} as const

export type FontFamilies = typeof fontFamilies
export type MobileFonts = typeof mobileFonts
export type FontSizes = typeof fontSizes
export type FontWeights = typeof fontWeights
export type LineHeights = typeof lineHeights
export type LetterSpacings = typeof letterSpacings
