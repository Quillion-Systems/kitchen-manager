import { useEffect, useState } from "react"

// After a verify or reset flow completes on the web, offer to hand off into the
// installed mobile app via its scheme (`kitchenmanager://…`). Renders a button
// that always works; on mobile user agents it also auto-attempts the scheme
// once, so users who have the app get it opened without an extra tap.
//
// Silent-fail behavior is deliberate: if the app isn't installed, tapping (or
// the auto-attempt) does nothing visible — the user just stays on the success
// page, which is a valid end state. No error UI, no "please install" nag; the
// web flow already completed the actual action (verified / reset).
//
// This is Option 3 of the mobile deep-link strategy (ClickUp 86bc73vqr). When
// the app ships to stores and Universal Links land, the emails will still point
// here, so this handoff becomes redundant for installed users but harmless.
export function MobileHandoff({
  schemeUrl,
  label = "Open Kitchen Manager",
  autoAttempt = true,
}: {
  schemeUrl: string
  label?: string
  autoAttempt?: boolean
}) {
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!autoAttempt || attempted) return
    if (typeof window === "undefined") return
    if (!isMobileUserAgent(window.navigator.userAgent)) return
    // Small delay so the success state renders first — otherwise iOS/Android's
    // "Open in Kitchen Manager?" prompt fires before the user sees why.
    const t = window.setTimeout(() => {
      window.location.href = schemeUrl
      setAttempted(true)
    }, 400)
    return () => window.clearTimeout(t)
  }, [autoAttempt, attempted, schemeUrl])

  return (
    <a
      href={schemeUrl}
      className="inline-block rounded-lg bg-sky-500 px-4 py-2 font-medium text-neutral-950 transition hover:bg-sky-400"
    >
      {label}
    </a>
  )
}

// UA sniff is a rough signal — good enough to decide "should we try firing the
// scheme automatically?" A false positive (fires on a desktop that happens to
// match) is harmless: the browser blocks unknown-protocol navigations. A false
// negative just means the user has to tap the button.
function isMobileUserAgent(ua: string): boolean {
  return /iPad|iPhone|iPod|Android/.test(ua)
}
