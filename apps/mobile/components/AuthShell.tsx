import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Kitchen Manager</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>{children}</View>
        <Text style={styles.footer}>{footer}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#0a0a0a", flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  eyebrow: {
    color: "#737373",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: { color: "#e5e5e5", fontSize: 24, fontWeight: "600", marginBottom: 20 },
  card: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  footer: { color: "#a3a3a3", fontSize: 14, marginTop: 16, textAlign: "center" },
})
