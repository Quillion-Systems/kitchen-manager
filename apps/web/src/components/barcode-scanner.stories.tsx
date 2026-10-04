import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { BarcodeScanner } from "./barcode-scanner"

// BarcodeScanner needs a real camera + HTTPS (or localhost). In Storybook it
// will request camera permission on first mount; deny it to see the fallback
// UI. The decoded codes are logged in the "Last scan" area below the frame.
const meta: Meta<typeof BarcodeScanner> = {
  title: "Primitives/BarcodeScanner",
  component: BarcodeScanner,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto w-80">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof BarcodeScanner>

export const Default: Story = {
  render: () => {
    const [last, setLast] = useState<{ code: string; at: number } | null>(null)
    return (
      <div className="flex flex-col gap-3">
        <BarcodeScanner onDetect={(code) => setLast({ code, at: Date.now() })} />
        <div className="rounded-xl border border-border bg-input-background p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Last scan</p>
          <p className="mt-1 font-mono text-foreground">
            {last ? last.code : "— point camera at a barcode —"}
          </p>
        </div>
      </div>
    )
  },
}

// Narrow the formats to QR codes only — useful for testing format restriction.
export const QrOnly: Story = {
  render: () => {
    const [last, setLast] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-3">
        <BarcodeScanner
          onDetect={(code) => setLast(code)}
          // Importing the enum here would force the story bundle to pull all
          // of zxing — use the numeric enum value for QR_CODE (11) to keep
          // the story file lean.
          formats={[11]}
        />
        <div className="rounded-xl border border-border bg-input-background p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Last QR</p>
          <p className="mt-1 font-mono text-foreground">{last ?? "— scan a QR code —"}</p>
        </div>
      </div>
    )
  },
}
