import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { type BarcodeType, CameraView, useCameraPermissions } from "expo-camera"
import { useEffect, useRef, useState } from "react"
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native"
import { Button } from "./Button"

const DEFAULT_FORMATS: BarcodeType[] = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "qr",
]

export type BarcodeScannerProps = {
  onDetect: (code: string, type: BarcodeType) => void
  formats?: BarcodeType[]
  // Minimum time (ms) between two detect callbacks for the same code — keeps
  // the camera from firing dozens of callbacks per second once it locks on.
  cooldownMs?: number
  testID?: string
}

export function BarcodeScanner({
  onDetect,
  formats = DEFAULT_FORMATS,
  cooldownMs = 1500,
  testID,
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const lastDetectRef = useRef<{ code: string; at: number } | null>(null)

  // Loading — permission hook returns null until the first check settles.
  if (!permission) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.text}>…</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.body}>
          Scanning barcodes needs camera permission. We only use it while you're on this screen.
        </Text>
        <Button onPress={requestPermission}>Allow camera</Button>
      </View>
    )
  }

  const handleScan = ({ data, type }: { data: string; type: string }) => {
    const now = Date.now()
    const last = lastDetectRef.current
    // Skip if the same code just fired within the cooldown window — avoids a
    // burst of callbacks for the same item.
    if (last && last.code === data && now - last.at < cooldownMs) return
    lastDetectRef.current = { code: data, at: now }
    onDetect(data, type as BarcodeType)
  }

  return (
    <View style={styles.cameraWrap} testID={testID}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: formats }}
      />
      <Reticle />
      <View pointerEvents="none" style={styles.helpPill}>
        <Text style={styles.helpText}>Line up the barcode in the frame</Text>
      </View>
    </View>
  )
}

// Four L-brackets at the corners of the aim area + a glowing scan line that
// sweeps top↔bottom inside it. Matches the design file's BARCODE SCANNER mock.
function Reticle() {
  const [reticleHeight, setReticleHeight] = useState(0)
  const translateY = useRef(new Animated.Value(0)).current

  const onLayout = (event: LayoutChangeEvent) => {
    setReticleHeight(event.nativeEvent.layout.height)
  }

  useEffect(() => {
    if (reticleHeight <= 0) return
    // Loop 0 → 1 → 0 so the line sweeps down then back up. 2.2s total mirrors
    // the web keyframes for a consistent cadence across platforms.
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [reticleHeight, translateY])

  // Scan line is 2px; interpolate to leave it fully inside the aim box.
  const translateYInterpolated = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, reticleHeight - 2)],
  })

  return (
    <View pointerEvents="none" style={styles.reticle} onLayout={onLayout}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      {reticleHeight > 0 ? (
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: translateYInterpolated }] }]}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
  cameraWrap: {
    aspectRatio: 1,
    backgroundColor: semantics.foreground,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  container: {
    alignItems: "center",
    backgroundColor: semantics.muted,
    borderRadius: 24,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  // Reticle wrap defines the aim box (60% × 60% of the camera area). Corner
  // brackets sit at each inside corner; scan line animates vertically within.
  // Rounded + overflow:hidden so the scan line gets clipped by the same
  // 14px curve the brackets round into, instead of overshooting the corners.
  reticle: {
    borderRadius: 14,
    bottom: "20%",
    left: "12%",
    overflow: "hidden",
    position: "absolute",
    right: "12%",
    top: "20%",
  },
  corner: {
    borderColor: semantics.accent,
    height: 32,
    position: "absolute",
    width: 32,
  },
  cornerTL: {
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
    borderTopWidth: 4,
    left: 0,
    top: 0,
  },
  cornerTR: {
    borderRightWidth: 4,
    borderTopRightRadius: 14,
    borderTopWidth: 4,
    right: 0,
    top: 0,
  },
  cornerBL: {
    borderBottomLeftRadius: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    borderBottomRightRadius: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: 0,
    right: 0,
  },
  scanLine: {
    backgroundColor: semantics.accent,
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    // Lime glow on iOS; Android drops the shadow (no boxShadow for non-text
    // Views), but the solid line still reads clearly against the camera feed.
    shadowColor: semantics.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    top: 0,
  },
  helpPill: {
    alignSelf: "center",
    backgroundColor: semantics.foreground,
    borderRadius: 999,
    bottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: "absolute",
  },
  helpText: {
    color: semantics.background,
    fontFamily: mobileFonts.sansRegular,
    fontSize: 13,
  },
  text: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
  },
  title: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansBold,
    fontSize: fontSizes.base,
    textAlign: "center",
  },
})
