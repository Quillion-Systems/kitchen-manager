import { mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { X } from "lucide-react-native"
import { Pressable, StyleSheet, Text, View } from "react-native"

export type RemovableChipProps = {
  // String-only so we can auto-build the × button's accessibilityLabel from
  // the chip text. Reach for Chip or Badge if you need richer content.
  children: string
  onRemove: () => void
  removeLabel?: string
  testID?: string
  removeTestID?: string
}

export function RemovableChip({
  children,
  onRemove,
  removeLabel,
  testID,
  removeTestID,
}: RemovableChipProps) {
  return (
    <View testID={testID} style={styles.chip}>
      <Text style={styles.label}>{children}</Text>
      <Pressable
        testID={removeTestID}
        accessibilityRole="button"
        accessibilityLabel={removeLabel ?? `Remove ${children}`}
        onPress={onRemove}
        style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
      >
        <X size={14} color={semantics.background} strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: semantics.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    height: 32,
    paddingLeft: 14,
    paddingRight: 6,
  },
  label: {
    color: semantics.background,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: 13,
  },
  removeBtn: {
    alignItems: "center",
    backgroundColor: primitives.forest[700],
    borderRadius: 999,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  removeBtnPressed: { backgroundColor: primitives.forest[600] },
})
