import type { Meta, StoryObj } from "@storybook/react-vite"
import { ActionMenu } from "./action-menu"

const meta: Meta<typeof ActionMenu> = {
  title: "Primitives/ActionMenu",
  component: ActionMenu,
  parameters: { layout: "centered" },
  // The menu panel appears below the trigger — give room so the open stories
  // have somewhere to render without clipping.
  decorators: [
    (Story) => (
      <div className="pb-80">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "More actions",
    items: [
      { label: "Share restaurant", onSelect: () => {} },
      { label: "Save to list", onSelect: () => {} },
    ],
  },
}
export default meta

type Story = StoryObj<typeof ActionMenu>

export const Default: Story = {}

// Matches the design file's overflow menu: two actions, a divider, then a
// destructive "Report a problem" in salmon.
export const WithDividerAndDestructive: Story = {
  args: {
    items: [
      { label: "Share restaurant", onSelect: () => {} },
      { label: "Save to list", onSelect: () => {} },
      { type: "divider" },
      { label: "Report a problem", onSelect: () => {}, destructive: true },
    ],
  },
}

export const WithDisabledItem: Story = {
  args: {
    items: [
      { label: "Share restaurant", onSelect: () => {} },
      { label: "Edit (coming soon)", onSelect: () => {}, disabled: true },
      { type: "divider" },
      { label: "Delete", onSelect: () => {}, destructive: true },
    ],
  },
}
