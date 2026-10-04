import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { SegmentedControl, type SegmentedControlOption } from "./segmented-control"

const diningOptions: SegmentedControlOption[] = [
  { value: "dine", label: "Dine in" },
  { value: "takeout", label: "Takeout" },
  { value: "delivery", label: "Delivery" },
]

const whenOptions: SegmentedControlOption[] = [
  { value: "tonight", label: "Tonight" },
  { value: "week", label: "This week" },
  { value: "any", label: "Any" },
]

const meta: Meta<typeof SegmentedControl> = {
  title: "Primitives/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: { control: "radio", options: ["light", "dark"] },
  },
  args: {
    options: diningOptions,
    value: "dine",
    variant: "light",
    onValueChange: () => {},
  },
}
export default meta

type Story = StoryObj<typeof SegmentedControl>

export const Light: Story = {}
export const Dark: Story = {
  args: { options: whenOptions, value: "tonight", variant: "dark" },
  // Dark variant lives on the forest background in the app — preview it there.
  parameters: { backgrounds: { value: "forest" } },
}

export const TwoOptions: Story = {
  args: {
    options: [
      { value: "list", label: "List" },
      { value: "grid", label: "Grid" },
    ],
    value: "list",
  },
}

export const FourOptions: Story = {
  args: {
    options: [
      { value: "mon", label: "Mon" },
      { value: "tue", label: "Tue" },
      { value: "wed", label: "Wed" },
      { value: "thu", label: "Thu" },
    ],
    value: "wed",
  },
}

export const WithDisabled: Story = {
  args: {
    options: [
      { value: "dine", label: "Dine in" },
      { value: "takeout", label: "Takeout" },
      { value: "delivery", label: "Delivery", disabled: true },
    ],
    value: "dine",
  },
}

// Click a segment to see the pill move, or Tab in and use arrow keys.
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState("dine")
    return <SegmentedControl options={diningOptions} value={value} onValueChange={setValue} />
  },
}
