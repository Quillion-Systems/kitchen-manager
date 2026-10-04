import type { Meta, StoryObj } from "@storybook/react-vite"
import { PasswordField } from "./password-field"

const meta: Meta<typeof PasswordField> = {
  title: "Primitives/PasswordField",
  component: PasswordField,
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
    label: "Password",
    autoComplete: "current-password",
  },
}
export default meta

type Story = StoryObj<typeof PasswordField>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: "hunter2" },
}

export const WithHint: Story = {
  args: { hint: "At least 8 characters, including a number." },
}

export const WithError: Story = {
  args: {
    error: "That password is too short.",
    defaultValue: "abc",
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "hunter2" },
}
