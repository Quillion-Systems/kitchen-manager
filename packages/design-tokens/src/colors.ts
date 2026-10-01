/**
 * Design tokens — colors.
 *
 * Two layers:
 *   - `primitives` — raw palette, named by hue + numeric scale (50–900).
 *   - `semantics`  — role-based aliases that reference primitives.
 *
 * UI code should consume `semantics` (web does so via Tailwind utilities
 * generated from `./tokens.css`; mobile imports from this file directly).
 * Primitives are the raw material — reach for them only when a one-off
 * component genuinely needs a shade the semantic layer doesn't name.
 *
 * KEEP IN SYNC WITH ./tokens.css — both files are hand-maintained mirrors.
 */

export const primitives = {
  forest: {
    200: "#d5e4b5",
    300: "#bfc9a8",
    400: "#8fae7e",
    600: "#3c4f40",
    700: "#4e6b55",
    800: "#1f3a26",
    900: "#13241a",
  },
  cream: {
    50: "#f9f7ef",
    100: "#f2eedf",
    200: "#eae5d3",
    300: "#ddd7c3",
  },
  lime: {
    400: "#d4f76e",
    500: "#c6f24e",
    600: "#b6e43c",
  },
  rust: {
    300: "#f6ddd3",
    400: "#f2a98e",
    500: "#a8462a",
    700: "#7c2e17",
  },
  amber: {
    300: "#f4e3c8",
    500: "#b7791f",
    700: "#6b4413",
  },
  leaf: {
    400: "#c8daa2",
    500: "#6e9a2e",
  },
  white: "#ffffff",
} as const

export const semantics = {
  background: primitives.cream[50],
  foreground: primitives.forest[900],

  surface: primitives.cream[100],
  surfaceForeground: primitives.forest[900],

  muted: primitives.cream[200],
  mutedForeground: primitives.forest[700],

  primary: primitives.forest[800],
  primaryForeground: primitives.cream[50],

  accent: primitives.lime[500],
  accentForeground: primitives.forest[900],

  soft: primitives.forest[200],
  softForeground: primitives.forest[800],

  border: primitives.cream[300],
  input: primitives.forest[300],
  inputBackground: primitives.white,
  ring: primitives.forest[700],

  success: primitives.leaf[500],
  successForeground: primitives.cream[50],
  warning: primitives.amber[500],
  warningForeground: primitives.cream[50],
  destructive: primitives.rust[500],
  destructiveForeground: primitives.cream[50],
} as const

export type Primitives = typeof primitives
export type Semantics = typeof semantics
export type SemanticColor = keyof Semantics
