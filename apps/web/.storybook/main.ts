import type { StorybookConfig } from "@storybook/react-vite"

// Storybook config for the design-system components in apps/web/src/components.
// Stories live colocated next to each component (`button.stories.tsx` next to
// `button.tsx`) rather than in a central src/stories directory, so files that
// go together stay together.
const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: ["storybook-addon-pseudo-states"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // The web app's Vite config loads TanStack Start (router + SSR + manifest
  // capture) and Nitro, neither of which make sense for Storybook — Storybook
  // injects its own entry and TanStack's build-manifest plugin asserts
  // "exactly one entry" and errors out. Strip those plugin families for
  // Storybook; keep the rest (Tailwind, React, etc.) so stories render with
  // the real design tokens + utilities.
  viteFinal: async (viteConfig) => {
    // Plugin names from the Start + router + nitro families use either
    // "tanstack-", "tanstack:", or "start-" prefixes (plus "nitro-"). The
    // plugins arrive as nested arrays, so flatten before filtering.
    const STRIP = /^(tanstack[-:]|start-|nitro)/
    return {
      ...viteConfig,
      plugins: (viteConfig.plugins ?? []).flat(Infinity).filter((plugin) => {
        if (!plugin || typeof plugin !== "object" || !("name" in plugin)) return true
        const name = (plugin as { name?: string }).name ?? ""
        return !STRIP.test(name)
      }),
    }
  },
}

export default config
