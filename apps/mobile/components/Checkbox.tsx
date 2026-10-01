import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Check } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

export type CheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  children?: ReactNode
  accessibilityLabel?: string
  testID?: string
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  children,
  accessibilityLabel,
  testID,
}: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={
        accessibilityLabel ?? (typeof children === "string" ? children : undefined)
      }
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
      testID={testID}
    >
      <View style={[styles.box, checked ? styles.boxChecked : styles.boxUnchecked]}>
        {checked ? <Check size={14} color={semantics.accent} strokeWidth={3} /> : null}
      </View>
      {children ? (
        typeof children === "string" ? (
          <Text style={styles.label}>{children}</Text>
        ) : (
          children
        )
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  disabled: { opacity: 0.5 },
  box: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1.5,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  boxChecked: {
    backgroundColor: semantics.primary,
    borderColor: semantics.primary,
  },
  boxUnchecked: {
    backgroundColor: semantics.inputBackground,
    borderColor: semantics.input,
  },
  label: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansMedium,
    fontSize: fontSizes.sm,
  },
})
