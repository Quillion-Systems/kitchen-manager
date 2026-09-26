import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native"

type Props = {
  label: string
  value: string
  onChangeText: (value: string) => void
  testID?: string
} & Pick<
  TextInputProps,
  "autoCapitalize" | "autoComplete" | "autoCorrect" | "keyboardType" | "textContentType"
>

export function Field({ label, value, onChangeText, testID, ...inputProps }: Props) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        placeholderTextColor="#525252"
        value={value}
        onChangeText={onChangeText}
        {...inputProps}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: "#a3a3a3", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#0a0a0a",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    color: "#e5e5e5",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})
