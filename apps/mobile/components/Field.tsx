import {
  fontSizes,
  mobileFonts,
  semantics,
} from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Input, type InputProps } from "./Input"

export type FieldProps = InputProps & {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Field({
  label,
  hint,
  error,
  accessibilityLabel,
  ...inputProps
}: FieldProps) {
  const invalid = !!error
  const resolvedA11yLabel =
    accessibilityLabel ?? (typeof label === "string" ? label : undefined)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Input
        {...inputProps}
        accessibilityLabel={resolvedA11yLabel}
        invalid={invalid}
      />
      {error ? (
        typeof error === "string" ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          error
        )
      ) : hint ? (
        typeof hint === "string" ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : (
          hint
        )
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  error: {
    color: semantics.destructive,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
  },
  hint: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
  },
  label: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansMedium,
    fontSize: fontSizes.sm,
  },
})
