import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Select, type SelectOption } from "./select"

const timeOptions: SelectOption[] = [
  { value: "5:30", label: "5:30" },
  { value: "6:00", label: "6:00" },
  { value: "6:30", label: "6:30", note: "Full", disabled: true },
  { value: "7:00", label: "7:00" },
  { value: "7:30", label: "7:30" },
  { value: "7:45", label: "7:45" },
  { value: "8:15", label: "8:15" },
  { value: "9:00", label: "9:00", note: "Full", disabled: true },
]

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  parameters: { layout: "centered" },
  // Needs horizontal room and vertical slack so the opened dropdown has
  // somewhere to render.
  decorators: [
    (Story) => (
      <div className="w-80 pb-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    options: timeOptions,
    placeholder: "Choose a time",
    onValueChange: () => {},
    value: null,
  },
}
export default meta

type Story = StoryObj<typeof Select>

export const Empty: Story = {}
export const WithSelection: Story = { args: { value: "7:00" } }
export const Disabled: Story = { args: { disabled: true, value: "7:00" } }

// Live interaction — pick a value, see the trigger update + ✓ on the chosen
// option. Also demonstrates that full slots stay visible but can't be picked.
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return (
      <Select
        options={timeOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Choose a time"
      />
    )
  },
}
