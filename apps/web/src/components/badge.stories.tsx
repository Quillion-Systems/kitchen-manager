import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "warning", "neutral", "soft", "primary"],
    },
    dot: { control: "boolean" },
  },
  args: {
    variant: "success",
    dot: true,
    children: "Open now",
  },
}
export default meta

type Story = StoryObj<typeof Badge>

// One story per variant. Defaults match the design's typical use: the
// status variants (success / warning / neutral) carry a leading dot;
// soft and primary (dietary / "tag" styles) don't.
export const Success: Story = { args: { variant: "success", dot: true, children: "Open now" } }
export const Warning: Story = {
  args: { variant: "warning", dot: true, children: "Closing soon" },
}
export const Neutral: Story = {
  args: { variant: "neutral", dot: true, children: "Fully booked" },
}
export const Soft: Story = { args: { variant: "soft", dot: false, children: "Vegetarian" } }
export const Primary: Story = { args: { variant: "primary", dot: false, children: "✱ Seasonal" } }

// The full strip from designs/Components-v2.html for review at a glance.
export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" dot>
          Open now
        </Badge>
        <Badge variant="warning" dot>
          Closing soon
        </Badge>
        <Badge variant="neutral" dot>
          Fully booked
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="soft">Vegetarian</Badge>
        <Badge variant="soft">GF</Badge>
        <Badge variant="primary">✱ Seasonal</Badge>
      </div>
    </div>
  ),
}
