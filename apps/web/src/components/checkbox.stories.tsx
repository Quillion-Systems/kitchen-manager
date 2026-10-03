import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Checkbox } from "./checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    checked: true,
    children: "Remember me",
  },
  // Checkbox is controlled; stories wire up a local useState so the control
  // panel's `checked` arg flips the box and clicking the box flips it back.
  render: (args) => {
    const [checked, setChecked] = useState(args.checked)
    return (
      <Checkbox {...args} checked={checked} onCheckedChange={setChecked}>
        {args.children}
      </Checkbox>
    )
  },
}
export default meta

type Story = StoryObj<typeof Checkbox>

export const Checked: Story = {}
export const Unchecked: Story = { args: { checked: false } }
export const Disabled: Story = { args: { disabled: true } }
