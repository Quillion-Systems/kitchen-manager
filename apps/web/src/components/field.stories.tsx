import type { Meta, StoryObj } from "@storybook/react-vite"
import { Mail } from "lucide-react"
import { Field } from "./field"

const meta: Meta<typeof Field> = {
  title: "Primitives/Field",
  component: Field,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
}
export default meta

type Story = StoryObj<typeof Field>

export const Default: Story = {}

export const WithHint: Story = {
  args: { hint: "We'll never share this with anyone." },
}

export const WithError: Story = {
  args: { error: "That doesn't look like a valid email.", defaultValue: "not-an-email" },
}

export const WithLeftSlot: Story = {
  args: { leftSlot: <Mail className="size-4" /> },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "disabled@example.com" },
}
