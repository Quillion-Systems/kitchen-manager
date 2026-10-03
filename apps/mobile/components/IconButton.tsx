import { semantics } from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { Pressable, type PressableProps, StyleSheet, View, type ViewStyle } from "react-native"

type Variant = "primary" | "accent" | "secondary" | "soft" | "ghost" | "destructive" | "white"
type Size = "sm" | "md"

export type IconButtonProps = Omit<PressableProps, "style" | "children" | "accessibilityLabel"> & {
  variant?: Variant
  size?: Size
  // Icon-only — a label is the only way a screen-reader user knows what this
  // button does, so require it explicitly rather than leaving it optional.
  accessibilityLabel: string
  children: ReactNode
}

export function IconButton({
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...rest
}: IconButtonProps) {
  const sizeDef = sizeStyles[size]
  const variantDef = variantStyles[variant]
  // Keep the 48px / 36px visual size but ensure the hit area meets the 44pt
  // iOS / 48dp Android guideline — the design file calls this out explicitly.
  const hitSlop = size === "sm" ? 6 : undefined

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        sizeDef,
        variantDef,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <View style={styles.content}>{children}</View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
})

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { borderRadius: 999, height: 36, width: 36 },
  md: { borderRadius: 999, height: 48, width: 48 },
}

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: semantics.primary },
  accent: { backgroundColor: semantics.accent },
  secondary: {
    backgroundColor: "transparent",
    borderColor: semantics.primary,
    borderWidth: 1.5,
  },
  soft: { backgroundColor: semantics.soft },
  ghost: { backgroundColor: "transparent" },
  destructive: {
    backgroundColor: "transparent",
    borderColor: semantics.destructive,
    borderWidth: 1.5,
  },
  white: {
    backgroundColor: semantics.inputBackground,
    borderColor: semantics.border,
    borderWidth: 1.5,
  },
}

// RN has no CSS color inheritance, so lucide-react-native icons need an
// explicit `color` prop. Callers pair this map with the chosen variant.
export const iconButtonIconColor: Record<Variant, string> = {
  primary: semantics.accent,
  accent: semantics.accentForeground,
  secondary: semantics.primary,
  soft: semantics.softForeground,
  ghost: semantics.primary,
  destructive: semantics.destructive,
  white: semantics.foreground,
}
