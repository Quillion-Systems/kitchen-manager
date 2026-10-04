import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Radio, type RadioOption } from "./radio"

// Pulled directly from the design file's RADIO section (seatOpts).
const seatOptions: RadioOption[] = [
  { value: "window", label: "Window", note: "Best for two" },
  { value: "counter", label: "Counter", note: "Watch the kitchen" },
  { value: "patio", label: "Patio", note: "Heaters on after 7" },
]

const meta: Meta<typeof Radio> = {
  title: "Primitives/Radio",
  component: Radio,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  args: {
    options: seatOptions,
    value: null,
    onValueChange: () => {},
  },
}
export default meta

type Story = StoryObj<typeof Radio>

export const Empty: Story = {}
export const WithSelection: Story = { args: { value: "counter" } }

export const WithoutNotes: Story = {
  args: {
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
    value: "md",
  },
}

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: "window", label: "Window", note: "Best for two" },
      { value: "counter", label: "Counter", note: "Watch the kitchen" },
      { value: "patio", label: "Patio", note: "Heaters on after 7", disabled: true },
    ],
    value: "window",
  },
}

// Tab in and use arrow keys to roam the group, or click to pick directly.
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return <Radio options={seatOptions} value={value} onValueChange={setValue} />
  },
}
