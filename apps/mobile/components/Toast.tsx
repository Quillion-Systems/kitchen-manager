import { mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

export type ToastAction = {
  label: string
  onPress: () => void
}

export type ToastProps = {
  message: string
  // Leading glyph — the design uses a lime "✱" (Sparkles). Takes a ReactNode
  // so callers choose their own lucide icon.
  icon?: ReactNode
  action?: ToastAction
  testID?: string
  actionTestID?: string
}

export function Toast({ message, icon, action, testID, actionTestID }: ToastProps) {
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[styles.toast, action ? styles.toastWithAction : styles.toastNoAction]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {action ? (
        <Pressable
          testID={actionTestID}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: semantics.primary,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  actionLabel: {
    color: semantics.accent,
    fontFamily: mobileFonts.sansBold,
    fontSize: 14,
  },
  actionPressed: { backgroundColor: primitives.forest[700] },
  icon: { alignItems: "center", justifyContent: "center" },
  message: {
    color: semantics.background,
    flex: 1,
    fontFamily: mobileFonts.sansRegular,
    fontSize: 15,
  },
  toast: {
    alignItems: "center",
    backgroundColor: semantics.foreground,
    borderRadius: 999,
    elevation: 8,
    flexDirection: "row",
    gap: 12,
    paddingLeft: 20,
    paddingVertical: 8,
    shadowColor: primitives.forest[900],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  // Pull the right edge tighter when the action button sits there, so it
  // doesn't float with extra space; use a symmetric 20px when there's no
  // button to balance against the left padding.
  toastNoAction: { paddingRight: 20 },
  toastWithAction: { paddingRight: 8 },
})
