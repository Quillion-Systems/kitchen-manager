import { BrowserMultiFormatReader } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType, type Result as DecodeResult } from "@zxing/library"
import { useEffect, useRef, useState } from "react"
import { Button } from "./button"

const DEFAULT_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
]

export type BarcodeScannerProps = {
  onDetect: (code: string, format: BarcodeFormat) => void
  formats?: BarcodeFormat[]
  // Minimum time (ms) between two detect callbacks for the same code — ZXing
  // fires per-frame once it locks on, so we debounce to avoid dozens of
  // callbacks for the same scan.
  cooldownMs?: number
  className?: string
}

type Status = "idle" | "starting" | "running" | "denied" | "unsupported" | "error"

export function BarcodeScanner({
  onDetect,
  formats = DEFAULT_FORMATS,
  cooldownMs = 1500,
  className,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastDetectRef = useRef<{ code: string; at: number } | null>(null)
  const onDetectRef = useRef(onDetect)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Bump to re-run the start effect after a permission denial.
  const [retryKey, setRetryKey] = useState(0)

  // Keep the latest onDetect in a ref so the start effect doesn't re-run (and
  // tear down the camera) every time the caller passes a new callback.
  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey is a deliberate cache-buster — bumping it from the Retry button re-runs the effect even though its value isn't read inside.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported")
      return
    }

    const hints = new Map<DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, formats]])
    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader
    setStatus("starting")

    let cancelled = false
    let controls: Awaited<ReturnType<typeof reader.decodeFromVideoDevice>> | null = null

    reader
      .decodeFromVideoDevice(undefined, video, (result: DecodeResult | undefined) => {
        if (!result) return
        const code = result.getText()
        const now = Date.now()
        const last = lastDetectRef.current
        if (last && last.code === code && now - last.at < cooldownMs) return
        lastDetectRef.current = { code, at: now }
        onDetectRef.current(code, result.getBarcodeFormat())
      })
      .then((c) => {
        if (cancelled) {
          c.stop()
          return
        }
        controls = c
        setStatus("running")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = (err as { name?: string } | null)?.name
        if (name === "NotAllowedError") {
          setStatus("denied")
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("unsupported")
        } else {
          setStatus("error")
          setErrorMessage(
            (err as { message?: string } | null)?.message ?? "Could not start the camera.",
          )
        }
      })

    return () => {
      cancelled = true
      controls?.stop()
      readerRef.current = null
    }
  }, [formats, cooldownMs, retryKey])

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-3xl bg-foreground ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${status === "running" ? "opacity-100" : "opacity-0"}`}
      />
      {/* Reticle so users know where to aim. */}
      {status === "running" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[20%] rounded-2xl border-2 border-accent"
        />
      ) : null}

      {status === "starting" ? <StatusCard>Starting camera…</StatusCard> : null}
      {status === "denied" ? (
        <StatusCard title="Camera access needed">
          <p className="text-center text-sm text-muted-foreground">
            Scanning barcodes needs camera permission. Enable it in your browser settings, then
            retry.
          </p>
          <Button onClick={() => setRetryKey((k) => k + 1)}>Try again</Button>
        </StatusCard>
      ) : null}
      {status === "unsupported" ? (
        <StatusCard title="Camera not available">
          <p className="text-center text-sm text-muted-foreground">
            This device or browser doesn't expose a camera we can use.
          </p>
        </StatusCard>
      ) : null}
      {status === "error" ? (
        <StatusCard title="Camera error">
          <p className="text-center text-sm text-muted-foreground">
            {errorMessage ?? "Could not start the camera."}
          </p>
          <Button onClick={() => setRetryKey((k) => k + 1)}>Try again</Button>
        </StatusCard>
      ) : null}
    </div>
  )
}

function StatusCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6">
      {title ? <p className="text-base font-bold text-foreground">{title}</p> : null}
      {typeof children === "string" ? (
        <p className="text-sm text-muted-foreground">{children}</p>
      ) : (
        children
      )}
    </div>
  )
}
