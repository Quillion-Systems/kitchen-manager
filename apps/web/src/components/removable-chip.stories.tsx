import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { RemovableChip } from "./removable-chip"

const meta: Meta<typeof RemovableChip> = {
  title: "Primitives/RemovableChip",
  component: RemovableChip,
  parameters: { layout: "centered" },
  args: {
    children: "Under 2 km",
    onRemove: () => {},
  },
}
export default meta

type Story = StoryObj<typeof RemovableChip>

export const Default: Story = {}

// Live row — click an × to remove a chip, "Clear all" wipes them.
export const ActiveFilters: Story = {
  parameters: { layout: "padded" },
  render: () => {
    const [filters, setFilters] = useState(["Under 2 km", "Tonight", "Vegetarian"])
    const remove = (label: string) => () => setFilters((f) => f.filter((x) => x !== label))
    return (
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((label) => (
          <RemovableChip key={label} onRemove={remove(label)}>
            {label}
          </RemovableChip>
        ))}
        {filters.length > 0 ? (
          <button
            type="button"
            onClick={() => setFilters([])}
            className="h-8 text-[13px] font-semibold text-primary underline underline-offset-[3px]"
          >
            Clear all
          </button>
        ) : null}
      </div>
    )
  },
}
