import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

export type ActionMenuAction = {
  type?: "action"
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export type ActionMenuDivider = { type: "divider" }

export type ActionMenuItem = ActionMenuAction | ActionMenuDivider

export type ActionMenuProps = {
  // Accessible label for the trigger button (there's no visible text — the
  // trigger is a "···" glyph).
  label: string
  items: ActionMenuItem[]
  testID?: string
}

export function ActionMenu({ label, items, testID }: ActionMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <Text style={styles.triggerDots}>···</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.sheetInner}>
              {items.map((item, idx) =>
                item.type === "divider" ? (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: menu items are positional and don't reorder; dividers have no stable id.
                    key={`d-${idx}`}
                    style={styles.divider}
                  />
                ) : (
                  <Pressable
                    // biome-ignore lint/suspicious/noArrayIndexKey: see divider note above.
                    key={`i-${idx}`}
                    disabled={item.disabled}
                    onPress={() => {
                      item.onSelect()
                      setOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && !item.disabled && styles.itemPressed,
                      item.disabled && styles.itemDisabled,
                    ]}
                  >
                    <Text
                      style={[styles.itemLabel, item.destructive && styles.itemLabelDestructive]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(19,36,26,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  divider: {
    backgroundColor: primitives.forest[800],
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  item: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    height: 44,
    paddingHorizontal: 12,
  },
  itemDisabled: { opacity: 0.5 },
  itemLabel: {
    color: semantics.background,
    fontFamily: mobileFonts.sansRegular,
    fontSize: 15,
  },
  itemLabelDestructive: { color: primitives.rust[400] },
  itemPressed: { backgroundColor: primitives.forest[800] },
  sheet: {
    backgroundColor: primitives.forest[900],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "70%",
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sheetInner: { gap: 2 },
  trigger: {
    alignItems: "center",
    backgroundColor: semantics.inputBackground,
    borderColor: semantics.input,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  triggerDots: {
    color: semantics.primary,
    fontFamily: mobileFonts.sansExtrabold,
    fontSize: fontSizes.base,
    letterSpacing: 1,
  },
  triggerPressed: { borderColor: semantics.primary },
})
