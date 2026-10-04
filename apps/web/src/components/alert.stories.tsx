import type { Meta, StoryObj } from "@storybook/react-vite"
import { Alert } from "./alert"

const meta: Meta<typeof Alert> = {
  title: "Primitives/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: { control: "select", options: ["error", "warning", "success"] },
  },
  args: {
    variant: "error",
    message: "Something went wrong. Try again.",
  },
}
export default meta

type Story = StoryObj<typeof Alert>

// One story per variant. Copy matches the design file's ALERTS section.
// biome-ignore lint/suspicious/noShadowRestrictedNames: Story names show up in the Storybook sidebar — matching the variant name beats avoiding a module-scope shadow of the global Error.
export const Error: Story = {
  args: { variant: "error", message: "That slot just went. Try 7:45 or 8:15." },
}
export const Warning: Story = {
  args: { variant: "warning", message: "Kitchen closes at 10. Last orders at 9:30." },
}
export const Success: Story = {
  args: { variant: "success", message: "Table held. We'll keep it for 15 minutes past 7:30." },
}

// Long message to confirm the auto-flip to top-alignment when the paragraph
// wraps.
export const LongMessage: Story = {
  args: {
    message:
      "We couldn't reach the server. Check your connection and try again — if the problem keeps happening, our status page has the latest.",
  },
}

// Drag the bottom-right corner to shrink the container live and watch the
// icon alignment flip from centered → top as the text wraps.
export const Resizable: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div
        className="resize-x overflow-auto border border-dashed border-neutral-400 p-2"
        style={{ width: 400 }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    message: "Drag the bottom-right corner to resize — alignment flips when the text wraps.",
  },
}

export const AllVariants: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex w-96 flex-col gap-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Alert variant="error" message="That slot just went. Try 7:45 or 8:15." />
      <Alert variant="warning" message="Kitchen closes at 10. Last orders at 9:30." />
      <Alert variant="success" message="Table held. We'll keep it for 15 minutes past 7:30." />
    </>
  ),
}
