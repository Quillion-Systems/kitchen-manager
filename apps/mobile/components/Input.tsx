import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { type ReactNode, useState } from "react"
import { StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from "react-native"

export type InputProps = Omit<TextInputProps, "style"> & {
  invalid?: boolean
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  containerStyle?: ViewStyle
}

export function Input({
  invalid = false,
  leftSlot,
  rightSlot,
  containerStyle,
  onFocus,
  onBlur,
  editable,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const disabled = editable === false

  const borderColor = invalid
    ? semantics.destructive
    : focused
      ? semantics.primary
      : disabled
        ? semantics.border
        : semantics.input
  const backgroundColor = disabled ? semantics.muted : semantics.inputBackground
  const textColor = disabled ? semantics.mutedForeground : semantics.foreground

  return (
    <View style={[styles.container, { backgroundColor, borderColor }, containerStyle]}>
      {leftSlot ? <View style={styles.slotLeft}>{leftSlot}</View> : null}
      <TextInput
        placeholderTextColor={semantics.mutedForeground}
        selectionColor={semantics.accent}
        editable={editable}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[styles.input, { color: textColor }]}
        {...rest}
      />
      {rightSlot ? <View style={styles.slotRight}>{rightSlot}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    height: 52,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
    // iOS adds vertical padding on TextInput by default; zero it so the
    // 52px container height controls the perceived field height.
    paddingVertical: 0,
  },
  slotLeft: { marginRight: 8 },
  slotRight: { marginLeft: 8 },
})
