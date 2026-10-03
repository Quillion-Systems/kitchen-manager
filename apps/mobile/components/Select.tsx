import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { Check, ChevronDown } from "lucide-react-native"
import { useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native"

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  note?: string
  disabled?: boolean
}

export type SelectProps<T extends string = string> = {
  value: T | null
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  testID?: string
}

export function Select<T extends string = string>({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  testID,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value) ?? null

  return (
    <>
      <Pressable
        testID={testID}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        style={({ pressed }) => [styles.trigger, pressed && !disabled && styles.triggerPressed]}
      >
        <Text style={[styles.triggerLabel, !selected && styles.triggerPlaceholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={semantics.foreground} strokeWidth={2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Dismiss on backdrop press; the sheet itself swallows presses so
            tapping an option doesn't also fire the backdrop. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.sheetInner}>
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <Pressable
                    key={option.value}
                    disabled={option.disabled}
                    onPress={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      option.disabled && styles.optionDisabled,
                      pressed && !option.disabled && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[styles.optionLabel, option.disabled && styles.optionLabelDisabled]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Check size={16} color={semantics.primary} strokeWidth={2.5} />
                    ) : option.note ? (
                      <Text style={styles.optionNote}>{option.note}</Text>
                    ) : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  // Modal: translucent backdrop + bottom-anchored sheet. Follows iOS
  // ActionSheet / Android bottom-sheet convention rather than cloning the
  // web absolute-positioned dropdown.
  backdrop: {
    backgroundColor: "rgba(19,36,26,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  option: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  optionDisabled: { opacity: 1 },
  optionLabel: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: 15,
  },
  optionLabelDisabled: { color: semantics.mutedForeground },
  optionNote: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.xs,
  },
  optionPressed: { backgroundColor: primitives.cream[100] },
  optionSelected: { backgroundColor: semantics.soft },
  sheet: {
    backgroundColor: semantics.inputBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "70%",
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sheetInner: { gap: 2 },
  trigger: {
    alignItems: "center",
    backgroundColor: semantics.inputBackground,
    borderColor: semantics.input,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    height: 52,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  triggerLabel: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
  },
  triggerPlaceholder: { color: semantics.mutedForeground },
  triggerPressed: { borderColor: semantics.primary },
})
