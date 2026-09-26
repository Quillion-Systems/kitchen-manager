import type { ReactNode } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native"

export function SubmitButton({
  onPress,
  pending,
  children,
  testID,
}: {
  onPress: () => void
  pending: boolean
  children: ReactNode
  testID?: string
}) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.button, (pending || pressed) && styles.buttonDim]}
      onPress={onPress}
      disabled={pending}
    >
      {pending ? (
        <ActivityIndicator color="#0a0a0a" />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 12,
  },
  buttonDim: { opacity: 0.7 },
  text: { color: "#0a0a0a", fontSize: 15, fontWeight: "600" },
})
