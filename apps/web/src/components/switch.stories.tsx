import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Switch } from "./switch"

// Switch sits in a settings row with the label on the left and the toggle on
// the right (justify-between). Wrap stories in a sized container so the
// layout matches the real settings-page look.
const meta: Meta<typeof Switch> = {
  title: "Primitives/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    checked: false,
    children: "Table reminders",
    onCheckedChange: () => {},
  },
}
export default meta

type Story = StoryObj<typeof Switch>

export const Off: Story = {}
export const On: Story = { args: { checked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const WithoutLabel: Story = { args: { children: undefined } }

// Live toggle — flips state on click so the transition can be seen.
export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <Switch checked={checked} onCheckedChange={setChecked}>
        Dark mode
      </Switch>
    )
  },
}
