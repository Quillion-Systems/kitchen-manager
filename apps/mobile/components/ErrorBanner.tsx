import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { X } from "lucide-react-native"
import { useState } from "react"
import { StyleSheet, Text, type TextLayoutEventData, View } from "react-native"

export function ErrorBanner({ message, testID }: { message: string; testID?: string }) {
  // Default to multiline (flex-start) — the safe layout for long copy; a brief
  // overshoot on a single-line error is cheaper than the icon drifting to the
  // vertical middle of a wrapped paragraph.
  const [multiline, setMultiline] = useState(true)

  const onTextLayout = (event: { nativeEvent: TextLayoutEventData }) => {
    setMultiline(event.nativeEvent.lines.length > 1)
  }

  return (
    <View
      testID={testID}
      style={[styles.banner, multiline ? styles.alignStart : styles.alignCenter]}
    >
      <View style={[styles.icon, multiline && styles.iconNudge]}>
        <X size={14} color={semantics.destructiveForeground} strokeWidth={3} />
      </View>
      <Text style={styles.text} onTextLayout={onTextLayout}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  alignCenter: { alignItems: "center" },
  alignStart: { alignItems: "flex-start" },
  banner: {
    backgroundColor: primitives.rust[300],
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  icon: {
    alignItems: "center",
    backgroundColor: semantics.destructive,
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  // Only nudge the icon down when top-aligned, so it sits mid-first-line of
  // the paragraph. When centered we rely on flex alignment instead.
  iconNudge: { marginTop: 2 },
  text: {
    color: primitives.rust[700],
    flex: 1,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
})
