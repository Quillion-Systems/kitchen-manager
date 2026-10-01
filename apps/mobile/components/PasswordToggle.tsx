import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Pressable, StyleSheet, Text } from "react-native"

export function PasswordToggle({
  show,
  onToggle,
  testID,
}: {
  show: boolean
  onToggle: () => void
  testID?: string
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      hitSlop={8}
      accessibilityLabel={show ? "Hide password" : "Show password"}
    >
      <Text style={styles.text}>{show ? "Hide" : "Show"}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansMedium,
    fontSize: fontSizes.sm,
    textDecorationLine: "underline",
  },
})
