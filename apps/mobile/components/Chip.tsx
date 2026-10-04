import { mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { Pressable, type PressableProps, StyleSheet, Text } from "react-native"

export type ChipProps = Omit<PressableProps, "style" | "children" | "onPress" | "disabled"> & {
  selected: boolean
  onToggle: () => void
  disabled?: boolean
  children: ReactNode
}

export function Chip({ selected, onToggle, disabled, children, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipOn : styles.chipOff,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.chipPressed,
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <Text style={[styles.label, selected ? styles.labelOn : styles.labelOff]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
  },
  chipDisabled: { opacity: 0.5 },
  chipOff: {
    backgroundColor: "transparent",
    borderColor: semantics.input,
  },
  chipOn: {
    backgroundColor: semantics.primary,
    borderColor: semantics.primary,
  },
  chipPressed: { opacity: 0.85 },
  label: {
    fontFamily: mobileFonts.sansSemibold,
    fontSize: 15,
  },
  labelOff: { color: semantics.primary },
  labelOn: { color: semantics.accent },
})
