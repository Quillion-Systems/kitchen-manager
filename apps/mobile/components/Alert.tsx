import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { Check, TriangleAlert, X } from "lucide-react-native"
import { useState } from "react"
import { StyleSheet, Text, type TextLayoutEventData, View, type ViewStyle } from "react-native"

export type AlertVariant = "error" | "warning" | "success"

export type AlertProps = {
  message: string
  variant?: AlertVariant
  testID?: string
}

export function Alert({ message, variant = "error", testID }: AlertProps) {
  // Default to multiline (flex-start) — the safe layout for long copy; a brief
  // overshoot on a single-line alert is cheaper than the icon drifting to the
  // vertical middle of a wrapped paragraph.
  const [multiline, setMultiline] = useState(true)

  const onTextLayout = (event: { nativeEvent: TextLayoutEventData }) => {
    setMultiline(event.nativeEvent.lines.length > 1)
  }

  const style = variantStyles[variant]
  const Icon = iconFor[variant]

  return (
    <View
      testID={testID}
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={[styles.banner, style.container, multiline ? styles.alignStart : styles.alignCenter]}
    >
      <View style={[styles.icon, style.icon, multiline && styles.iconNudge]}>
        <Icon size={14} color={style.iconColor} strokeWidth={3} />
      </View>
      <Text style={[styles.text, style.text]} onTextLayout={onTextLayout}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  alignCenter: { alignItems: "center" },
  alignStart: { alignItems: "flex-start" },
  banner: {
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  icon: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  // Only nudge the icon down when top-aligned, so it sits mid-first-line of
  // the paragraph. When centered we rely on flex alignment instead.
  iconNudge: { marginTop: 2 },
  text: {
    flex: 1,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
})

const variantStyles: Record<
  AlertVariant,
  { container: ViewStyle; icon: ViewStyle; iconColor: string; text: { color: string } }
> = {
  error: {
    container: { backgroundColor: primitives.rust[300] },
    icon: { backgroundColor: semantics.destructive },
    iconColor: semantics.destructiveForeground,
    text: { color: primitives.rust[700] },
  },
  warning: {
    container: { backgroundColor: primitives.amber[300] },
    icon: { backgroundColor: primitives.amber[500] },
    iconColor: semantics.warningForeground,
    text: { color: primitives.amber[700] },
  },
  success: {
    container: { backgroundColor: semantics.soft },
    icon: { backgroundColor: semantics.primary },
    iconColor: semantics.accent,
    text: { color: semantics.softForeground },
  },
}

const iconFor: Record<AlertVariant, typeof Check> = {
  error: X,
  warning: TriangleAlert,
  success: Check,
}
