import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

// Password input with a Show/Hide text toggle. Text over an icon glyph: RN has
// no native SVG, adding react-native-svg or @expo/vector-icons for one control
// is overkill, and the visible word acts as its own accessible label.
export function PasswordField({
  label = "Password",
  value,
  onChangeText,
  textContentType,
  testID,
  toggleTestID,
}: {
  label?: string
  value: string
  onChangeText: (value: string) => void
  textContentType?: "password" | "newPassword"
  testID?: string
  toggleTestID?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          testID={testID}
          style={styles.input}
          placeholderTextColor="#525252"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={textContentType}
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable
          testID={toggleTestID}
          style={styles.toggle}
          onPress={() => setShow((s) => !s)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
        >
          <Text style={styles.toggleText}>{show ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: "#a3a3a3", fontSize: 13, marginBottom: 6 },
  row: { position: "relative" },
  input: {
    backgroundColor: "#0a0a0a",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    color: "#e5e5e5",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingRight: 60,
    paddingVertical: 10,
  },
  toggle: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    top: 0,
  },
  toggleText: { color: "#a3a3a3", fontSize: 13, fontWeight: "500" },
})
