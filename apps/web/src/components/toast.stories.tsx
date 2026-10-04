import type { Meta, StoryObj } from "@storybook/react-vite"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { Toast } from "./toast"

const meta: Meta<typeof Toast> = {
  title: "Primitives/Toast",
  component: Toast,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="min-w-96">
        <Story />
      </div>
    ),
  ],
  args: {
    message: "Added to your order.",
  },
}
export default meta

type Story = StoryObj<typeof Toast>

export const Default: Story = {}

export const WithIcon: Story = {
  args: { icon: <Sparkles className="size-4" strokeWidth={2.5} /> },
}

export const WithAction: Story = {
  args: {
    icon: <Sparkles className="size-4" strokeWidth={2.5} />,
    action: { label: "Undo", onPress: () => {} },
  },
}

export const JustMessage: Story = {
  args: { message: "Order sent to the kitchen." },
}

// Toast as a primitive renders when it's in the tree — orchestration (queue,
// auto-dismiss, position) is a separate concern. This story demonstrates the
// minimum caller pattern: local state + setTimeout.
export const AutoDismiss: Story = {
  parameters: { layout: "centered" },
  render: () => {
    const [visible, setVisible] = useState(true)
    useEffect(() => {
      if (!visible) return
      const id = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(id)
    }, [visible])
    return (
      <div className="flex min-w-96 flex-col items-start gap-4">
        {visible ? (
          <Toast
            icon={<Sparkles className="size-4" strokeWidth={2.5} />}
            message="Added to your order."
            action={{ label: "Undo", onPress: () => setVisible(false) }}
          />
        ) : null}
        {!visible ? (
          <button
            type="button"
            onClick={() => setVisible(true)}
            className="h-11 rounded-full border-[1.5px] border-dashed border-input px-[18px] text-sm text-muted-foreground"
          >
            Show toast again
          </button>
        ) : null}
      </div>
    )
  },
}
