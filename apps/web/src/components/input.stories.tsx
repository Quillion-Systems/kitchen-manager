import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search, X } from "lucide-react"
import { Input } from "./input"

// Inputs are 100% width — wrap each story in a fixed-width container so
// Storybook's canvas doesn't stretch them edge to edge.
const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
  },
  args: {
    placeholder: "you@example.com",
    type: "email",
  },
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}
export const Filled: Story = { args: { defaultValue: "nick@justinthyme.app" } }
export const Invalid: Story = {
  args: { invalid: true, defaultValue: "not-an-email", placeholder: "you@example.com" },
}
export const Disabled: Story = { args: { disabled: true, defaultValue: "disabled@example.com" } }
export const WithLeftSlot: Story = {
  args: {
    leftSlot: <Search className="size-4" />,
    placeholder: "Search products…",
    type: "search",
  },
}
export const WithRightSlot: Story = {
  args: {
    rightSlot: <X className="size-4" />,
    defaultValue: "clear me",
    placeholder: "Search products…",
  },
}
export const WithBothSlots: Story = {
  args: {
    leftSlot: <Search className="size-4" />,
    rightSlot: <X className="size-4" />,
    defaultValue: "flour",
  },
}
export const Password: Story = {
  args: { type: "password", placeholder: "••••••••", defaultValue: "hunter2" },
}

// All visual states stacked so review doesn't need to click through every
// story to see the swatch.
export const AllStates: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-3">
      <Input placeholder="Default" />
      <Input defaultValue="Filled" />
      <Input invalid defaultValue="Invalid value" />
      <Input disabled defaultValue="Disabled" />
      <Input leftSlot={<Search className="size-4" />} placeholder="With left slot" />
      <Input rightSlot={<X className="size-4" />} defaultValue="With right slot" />
      <Input
        leftSlot={<Search className="size-4" />}
        rightSlot={<X className="size-4" />}
        defaultValue="Both slots"
      />
    </div>
  ),
}
