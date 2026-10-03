import type { Preview } from "@storybook/react-vite"

// Pull in the same CSS the app uses, so stories render with the real Tailwind
// + design-tokens + fontsource @font-face declarations wired. Any component
// that reaches for a semantic token (bg-background, text-foreground, …) or a
// Bricolage/Instrument Serif face just works.
import "../src/styles.css"

const preview: Preview = {
  parameters: {
    // Preview against both page backgrounds. "cream" (page bg) is the default
    // because most components live there; "forest" matches the Welcome-screen
    // dark surface (and the design artifact's "ON DARK" button row).
    backgrounds: {
      options: {
        cream: { name: "cream", value: "#f2eedf" },
        forest: { name: "forest", value: "#1f3a26" },
        white: { name: "white", value: "#ffffff" },
      },
    },
    initialGlobals: {
      backgrounds: { value: "cream" },
    },
  },
}

export default preview
