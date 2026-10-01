import {
  fontSizes,
  mobileFonts,
  semantics,
} from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native"

type Variant =
  | "primary"
  | "accent"
  | "secondary"
  | "soft"
  | "ghost"
  | "destructive"
type Size = "sm" | "md" | "lg"

export type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const sizeDef = sizeStyles[size]
  const variantDef = variantStyles[variant]
  const containerSize =
    variant === "ghost" ? sizeDef.containerGhost : sizeDef.container
  const isInteractive = !disabled && !loading
  const hitSlop = size === "sm" ? 8 : undefined

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        containerSize,
        variantDef.container,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <View style={[styles.content, loading && styles.contentHidden]}>
        {typeof children === "string" ? (
          <Text style={[sizeDef.label, variantDef.label]}>{children}</Text>
        ) : (
          children
        )}
      </View>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="small" color={variantDef.label.color} />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  content: { alignItems: "center", flexDirection: "row", gap: 8 },
  contentHidden: { opacity: 0 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  spinner: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
})

const sizeStyles: Record<
  Size,
  { container: ViewStyle; containerGhost: ViewStyle; label: TextStyle }
> = {
  sm: {
    container: { height: 36, paddingHorizontal: 16 },
    containerGhost: { height: 36, paddingHorizontal: 12 },
    label: { fontSize: fontSizes.sm },
  },
  md: {
    container: { height: 48, paddingHorizontal: 24 },
    containerGhost: { height: 48, paddingHorizontal: 16 },
    label: { fontSize: fontSizes.base },
  },
  lg: {
    container: { height: 56, paddingHorizontal: 28 },
    containerGhost: { height: 56, paddingHorizontal: 20 },
    label: { fontSize: fontSizes.md },
  },
}

const variantStyles: Record<
  Variant,
  { container: ViewStyle; label: TextStyle }
> = {
  primary: {
    container: { backgroundColor: semantics.primary },
    label: { color: semantics.accent, fontFamily: mobileFonts.sansBold },
  },
  accent: {
    container: { backgroundColor: semantics.accent },
    label: {
      color: semantics.accentForeground,
      fontFamily: mobileFonts.sansBold,
    },
  },
  secondary: {
    container: {
      backgroundColor: "transparent",
      borderColor: semantics.primary,
      borderWidth: 1.5,
    },
    label: { color: semantics.primary, fontFamily: mobileFonts.sansSemibold },
  },
  soft: {
    container: { backgroundColor: semantics.soft },
    label: {
      color: semantics.softForeground,
      fontFamily: mobileFonts.sansSemibold,
    },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    label: { color: semantics.primary, fontFamily: mobileFonts.sansSemibold },
  },
  destructive: {
    container: {
      backgroundColor: "transparent",
      borderColor: semantics.destructive,
      borderWidth: 1.5,
    },
    label: {
      color: semantics.destructive,
      fontFamily: mobileFonts.sansSemibold,
    },
  },
}
