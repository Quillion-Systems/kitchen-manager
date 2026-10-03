import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronLeft, Heart, Plus, Sparkles, Trash2, X } from "lucide-react"
import { IconButton } from "./icon-button"

const meta: Meta<typeof IconButton> = {
  title: "Primitives/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "accent", "secondary", "soft", "ghost", "destructive", "white"],
    },
    size: { control: "select", options: ["sm", "md"] },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "primary",
    size: "md",
    "aria-label": "Add item",
    children: <Plus />,
  },
}
export default meta

type Story = StoryObj<typeof IconButton>

export const Primary: Story = {
  args: { "aria-label": "Highlight", children: <Sparkles /> },
}
export const Accent: Story = {
  args: { variant: "accent", "aria-label": "Add", children: <Plus /> },
}
export const Secondary: Story = {
  args: { variant: "secondary", "aria-label": "Back", children: <ChevronLeft /> },
}
export const Soft: Story = { args: { variant: "soft", "aria-label": "Dismiss", children: <X /> } }
export const Ghost: Story = {
  args: { variant: "ghost", "aria-label": "Favorite", children: <Heart /> },
}
export const Destructive: Story = {
  args: { variant: "destructive", "aria-label": "Delete", children: <Trash2 /> },
}
export const White: Story = { args: { variant: "white", "aria-label": "Close", children: <X /> } }
export const Compact: Story = {
  args: { size: "sm", variant: "ghost", "aria-label": "Close", children: <X /> },
}
export const Disabled: Story = { args: { disabled: true } }

// The whole swatch side by side — the quick visual sanity check we actually
// want in review.
export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton variant="primary" aria-label="Highlight">
        <Sparkles />
      </IconButton>
      <IconButton variant="accent" aria-label="Add">
        <Plus />
      </IconButton>
      <IconButton variant="secondary" aria-label="Back">
        <ChevronLeft />
      </IconButton>
      <IconButton variant="soft" aria-label="Dismiss">
        <X />
      </IconButton>
      <IconButton variant="ghost" aria-label="Favorite">
        <Heart />
      </IconButton>
      <IconButton variant="destructive" aria-label="Delete">
        <Trash2 />
      </IconButton>
      <IconButton variant="white" aria-label="Close">
        <X />
      </IconButton>
    </div>
  ),
}

export const AllSizes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton size="sm" aria-label="Add small">
        <Plus />
      </IconButton>
      <IconButton size="md" aria-label="Add medium">
        <Plus />
      </IconButton>
    </div>
  ),
}
