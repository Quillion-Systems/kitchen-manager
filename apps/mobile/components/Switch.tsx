import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { Pressable, type PressableProps, StyleSheet, Text, View } from "react-native"

export type SwitchProps = Omit<PressableProps, "style" | "children" | "onPress" | "disabled"> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  children?: ReactNode
}

export function Switch({ checked, onCheckedChange, disabled, children, ...rest }: SwitchProps) {
  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <Text style={styles.label}>{children}</Text>
      ) : (
        (children ?? null)
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: checked ? semantics.primary : semantics.border,
            justifyContent: checked ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.knob,
            { backgroundColor: checked ? semantics.accent : semantics.inputBackground },
          ]}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  knob: {
    borderRadius: 999,
    elevation: 2,
    height: 26,
    shadowColor: "#132419",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 26,
  },
  // flex: 1 lets a long label wrap and still leaves the track visible on
  // the right of the row.
  label: {
    color: semantics.foreground,
    flex: 1,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.base,
  },
  pressed: { opacity: 0.85 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  track: {
    borderRadius: 999,
    flexDirection: "row",
    height: 32,
    padding: 3,
    width: 52,
  },
})
