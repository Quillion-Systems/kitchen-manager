import { fontSizes, mobileFonts, primitives, semantics } from "@kitchen-manager/design-tokens"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native"

export type SegmentedControlOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string = string> = {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  variant?: "light" | "dark"
  testID?: string
}

type SegmentLayout = { x: number; width: number }

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  variant = "light",
  testID,
}: SegmentedControlProps<T>) {
  const isDark = variant === "dark"
  const segmentHeight = isDark ? 40 : 44

  // Layout per option, keyed by value. Populated as segments mount and call
  // onLayout — until we have the selected one, don't render the indicator.
  const layoutsRef = useRef<Map<T, SegmentLayout>>(new Map())
  const [selectedLayout, setSelectedLayout] = useState<SegmentLayout | null>(null)

  // Animated.Value is a persistent instance across renders; we drive translateX
  // and width from the same measured layout.
  const translateX = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const hasAnimated = useRef(false)

  const handleLayout = (optionValue: T) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    layoutsRef.current.set(optionValue, { x, width })
    if (optionValue === value) {
      setSelectedLayout({ x, width })
    }
  }

  // When value changes, slide the indicator to the new segment's layout. The
  // first paint snaps (setValue) so the pill doesn't fly in from zero.
  useEffect(() => {
    const target = layoutsRef.current.get(value)
    if (!target) return
    setSelectedLayout(target)
    if (!hasAnimated.current) {
      translateX.setValue(target.x)
      indicatorWidth.setValue(target.width)
      hasAnimated.current = true
      return
    }
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: target.x,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(indicatorWidth, {
        toValue: target.width,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start()
  }, [value, translateX, indicatorWidth])

  const indicatorColors: ViewStyle = isDark ? styles.indicatorDark : styles.indicatorLight

  return (
    <View testID={testID} style={styles.wrapper}>
      {selectedLayout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            indicatorColors,
            {
              height: segmentHeight,
              transform: [{ translateX }],
              width: indicatorWidth,
            },
          ]}
        />
      ) : null}
      <View
        accessibilityRole="radiogroup"
        style={[styles.track, isDark ? styles.trackDark : styles.trackLight]}
      >
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: !!option.disabled }}
              disabled={option.disabled}
              onPress={() => onValueChange(option.value)}
              onLayout={handleLayout(option.value)}
              style={[styles.segment, { height: segmentHeight }]}
            >
              <Text
                style={[
                  isDark ? styles.labelDark : styles.labelLight,
                  isSelected
                    ? isDark
                      ? styles.labelSelectedDark
                      : styles.labelSelectedLight
                    : null,
                  option.disabled && styles.labelDisabled,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Indicator sits inside the track's padding area (top: 4, matches the
  // track's p=4). The track still holds the labels on top.
  indicator: {
    borderRadius: 999,
    position: "absolute",
    top: 4,
    zIndex: 0,
  },
  indicatorDark: { backgroundColor: semantics.accent },
  indicatorLight: {
    backgroundColor: semantics.primary,
    elevation: 3,
    shadowColor: primitives.forest[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  labelDark: {
    color: primitives.forest[200],
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
  },
  labelDisabled: { opacity: 0.5 },
  labelLight: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: 15,
  },
  labelSelectedDark: { color: semantics.accentForeground },
  labelSelectedLight: { color: semantics.accent },
  segment: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    // Labels need to render above the sliding indicator.
    zIndex: 1,
  },
  track: {
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  trackDark: { backgroundColor: semantics.foreground },
  trackLight: { backgroundColor: semantics.muted },
  // Positions the indicator relative to the whole wrapper, not inside the
  // track's padding box — same reason the web version wraps in a `relative`
  // div (avoids an off-by-padding on the first segment).
  wrapper: { position: "relative" },
})
