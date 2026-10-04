import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { type BarcodeType, CameraView, useCameraPermissions } from "expo-camera"
import { useRef } from "react"
import { StyleSheet, Text, View } from "react-native"
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
      {/* Thin visual aim box so users know where to point. */}
      <View pointerEvents="none" style={styles.reticle} />
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
  reticle: {
    borderColor: semantics.accent,
    borderRadius: 16,
    borderWidth: 2,
    height: "60%",
    left: "20%",
    position: "absolute",
    top: "20%",
    width: "60%",
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
