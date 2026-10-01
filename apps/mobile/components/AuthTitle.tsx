import { mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { StyleSheet, Text } from "react-native"

// Auth screens share a "Prefix _italic_" title treatment (Bricolage extrabold
// + Instrument Serif italic on the last word): "Welcome _back_",
// "Create _account_", "Set a new _password_", "Check your _email_", …
export function AuthTitle({
  prefix,
  italic,
}: {
  prefix: string
  italic: string
}) {
  return (
    <Text style={styles.title}>
      {prefix} <Text style={styles.italic}>{italic}</Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  title: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansExtrabold,
    fontSize: 44,
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  italic: {
    fontFamily: mobileFonts.serifItalic,
  },
})
