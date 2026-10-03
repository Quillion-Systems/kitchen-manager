import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "accent", "secondary", "soft", "ghost", "destructive", "white"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Sign in",
    variant: "primary",
    size: "md",
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {}
export const Accent: Story = { args: { variant: "accent", children: "Create account" } }
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } }
export const Soft: Story = { args: { variant: "soft", children: "Save for later" } }
export const Ghost: Story = { args: { variant: "ghost", children: "See all" } }
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } }
export const White: Story = { args: { variant: "white", children: "Continue with Google" } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }

// All six variants side by side — the quick visual sanity check we actually
// want in review. Uses render() to compose multiple Button instances in one
// story.
export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="white">White</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}
