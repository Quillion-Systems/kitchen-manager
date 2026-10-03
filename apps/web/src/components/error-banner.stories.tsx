import type { Meta, StoryObj } from "@storybook/react-vite"
import { ErrorBanner } from "./error-banner"

const meta: Meta<typeof ErrorBanner> = {
  title: "Primitives/ErrorBanner",
  component: ErrorBanner,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  args: {
    message: "Something went wrong. Try again.",
  },
}
export default meta

type Story = StoryObj<typeof ErrorBanner>

// Short message — the component auto-centers the icon vertically when the
// text fits on one line (measured via useLayoutEffect + ResizeObserver).
export const Default: Story = {}

// Long message — the component switches to top-alignment so the icon stays
// beside the first word, not drifting to the middle of the paragraph.
export const LongMessage: Story = {
  args: {
    message:
      "We couldn't reach the server. Check your connection and try again — if the problem keeps happening, our status page has the latest.",
  },
}

// Shrinks the container width live so you can watch the alignment flip from
// centered → start as the paragraph wraps.
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
