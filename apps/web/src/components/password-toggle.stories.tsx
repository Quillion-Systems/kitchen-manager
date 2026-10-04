import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { PasswordToggle } from "./password-toggle"

const meta: Meta<typeof PasswordToggle> = {
  title: "Primitives/PasswordToggle",
  component: PasswordToggle,
  parameters: { layout: "centered" },
  args: {
    show: false,
    onToggle: () => {},
  },
}
export default meta

type Story = StoryObj<typeof PasswordToggle>

export const Hidden: Story = {}
export const Visible: Story = { args: { show: true } }

// Click the toggle to flip the label; useful for confirming the aria-label
// updates alongside the text in a screen reader.
export const Interactive: Story = {
  render: () => {
    const [show, setShow] = useState(false)
    return <PasswordToggle show={show} onToggle={() => setShow((s) => !s)} />
  },
}
