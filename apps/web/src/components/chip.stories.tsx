import type { Meta, StoryObj } from "@storybook/react-vite"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { Chip } from "./chip"

const meta: Meta<typeof Chip> = {
  title: "Primitives/Chip",
  component: Chip,
  parameters: { layout: "centered" },
  argTypes: {
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    selected: false,
    children: "Seasonal",
    onToggle: () => {},
  },
}
export default meta

type Story = StoryObj<typeof Chip>

export const Off: Story = {}
export const On: Story = { args: { selected: true } }
export const Disabled: Story = { args: { disabled: true } }

export const WithIcon: Story = {
  args: {
    selected: true,
    children: (
      <>
        <Sparkles className="size-4" strokeWidth={2.5} />
        Seasonal
      </>
    ),
  },
}

// Matches the design file's filter chip row — mix of on/off states with the
// "✱ Seasonal" and "Open now" variants starting selected.
export const FilterRow: Story = {
  parameters: { layout: "padded" },
  render: () => {
    const [state, setState] = useState<Record<string, boolean>>({
      seasonal: true,
      openNow: true,
      vegetarian: false,
      patio: false,
      woodFired: false,
      naturalWine: false,
      takeout: false,
    })
    const toggle = (k: string) => () => setState((s) => ({ ...s, [k]: !s[k] }))
    const chips: Array<[string, string, boolean]> = [
      ["seasonal", "✱ Seasonal", state.seasonal ?? false],
      ["openNow", "Open now", state.openNow ?? false],
      ["vegetarian", "Vegetarian", state.vegetarian ?? false],
      ["patio", "Patio", state.patio ?? false],
      ["woodFired", "Wood-fired", state.woodFired ?? false],
      ["naturalWine", "Natural wine", state.naturalWine ?? false],
      ["takeout", "Takeout", state.takeout ?? false],
    ]
    return (
      <div className="flex max-w-2xl flex-wrap gap-[10px]">
        {chips.map(([key, label, selected]) => (
          <Chip key={key} selected={selected} onToggle={toggle(key)}>
            {label}
          </Chip>
        ))}
      </div>
    )
  },
}
