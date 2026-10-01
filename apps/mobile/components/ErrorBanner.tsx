import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { X } from "lucide-react-native"
import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

export function ErrorBanner({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={styles.banner}>
      <View style={styles.icon}>
        <X size={14} color={semantics.destructiveForeground} strokeWidth={3} />
      </View>
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "flex-start",
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
    marginTop: 2,
    width: 24,
  },
  text: {
    color: primitives.rust[700],
    flex: 1,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
})
