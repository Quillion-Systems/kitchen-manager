import { mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { StyleSheet, Text, View, type ViewStyle } from "react-native"

export type BadgeVariant = "success" | "warning" | "neutral" | "soft" | "primary"

export type BadgeProps = {
  variant?: BadgeVariant
  // Leading colored dot — used by the status variants (Open now, Closing soon,
  // Fully booked). Off by default so dietary/tag uses don't carry it.
  dot?: boolean
  children: ReactNode
}

export function Badge({ variant = "neutral", dot, children }: BadgeProps) {
  const bgStyle = containerStyles[variant]
  const textStyle = textStyles[variant]
  const isSoftOrPrimary = variant === "soft" || variant === "primary"

  return (
    <View style={[styles.base, bgStyle]}>
      {dot ? <View style={[styles.dot, dotStyles[variant]]} /> : null}
      <Text
        style={[styles.text, textStyle, isSoftOrPrimary ? styles.textSemibold : styles.textBold]}
      >
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  text: {
    fontSize: 12,
  },
  textBold: { fontFamily: mobileFonts.sansBold },
  textSemibold: { fontFamily: mobileFonts.sansSemibold },
})

const containerStyles: Record<BadgeVariant, ViewStyle> = {
  success: { backgroundColor: semantics.accent },
  warning: { backgroundColor: primitives.amber[300] },
  neutral: { backgroundColor: semantics.muted },
  soft: { backgroundColor: semantics.soft },
  primary: { backgroundColor: semantics.primary },
}

const textStyles: Record<BadgeVariant, { color: string }> = {
  success: { color: semantics.foreground },
  warning: { color: primitives.amber[700] },
  neutral: { color: semantics.mutedForeground },
  soft: { color: semantics.softForeground },
  primary: { color: semantics.accent },
}

const dotStyles: Record<BadgeVariant, ViewStyle> = {
  success: { backgroundColor: semantics.primary },
  warning: { backgroundColor: primitives.amber[500] },
  neutral: { backgroundColor: semantics.mutedForeground },
  soft: { backgroundColor: semantics.primary },
  primary: { backgroundColor: semantics.accent },
}
