import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Pressable, StyleSheet, Text, View } from "react-native"

export type RadioOption<T extends string = string> = {
  value: T
  label: string
  note?: string
  disabled?: boolean
}

export type RadioProps<T extends string = string> = {
  value: T | null
  onValueChange: (value: T) => void
  options: RadioOption<T>[]
  testID?: string
}

export function Radio<T extends string = string>({
  value,
  onValueChange,
  options,
  testID,
}: RadioProps<T>) {
  return (
    <View testID={testID} accessibilityRole="radiogroup" style={styles.group}>
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: !!option.disabled }}
            disabled={option.disabled}
            onPress={() => onValueChange(option.value)}
            style={({ pressed }) => [
              styles.card,
              isSelected ? styles.cardSelected : styles.cardUnselected,
              option.disabled && styles.cardDisabled,
              pressed && !option.disabled && styles.cardPressed,
            ]}
          >
            <View
              style={[styles.circle, isSelected ? styles.circleSelected : styles.circleUnselected]}
            >
              {isSelected ? <View style={styles.dot} /> : null}
            </View>
            <View style={styles.labelStack}>
              <Text style={styles.label}>{option.label}</Text>
              {option.note ? <Text style={styles.note}>{option.note}</Text> : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardDisabled: { opacity: 0.5 },
  cardPressed: { opacity: 0.85 },
  cardSelected: {
    backgroundColor: semantics.inputBackground,
    borderColor: semantics.primary,
  },
  cardUnselected: {
    backgroundColor: "transparent",
    borderColor: semantics.border,
  },
  circle: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  circleSelected: { borderColor: semantics.primary },
  circleUnselected: { borderColor: semantics.input },
  dot: {
    backgroundColor: semantics.primary,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  group: { gap: 12 },
  label: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.base,
  },
  labelStack: { gap: 2 },
  note: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: 13,
  },
})
