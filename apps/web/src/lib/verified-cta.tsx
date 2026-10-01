import { Link } from "@tanstack/react-router"

// After a post-auth flow completes on the web (email verify, password reset),
// point the user at the right "next step" based on device:
//   mobile UA → button that fires the `kitchenmanager://` scheme, opening the
//     installed app (silent no-op if not installed).
//   desktop UA → plain link into the web app.
//
// UA is a rough signal — see the false-negative for iPad-in-desktop-mode below
// — but the stakes are low: a mistaken mobile branch just tries a scheme URL
// the browser will drop.
export function VerifiedCta({
  schemeUrl,
  webFallbackHref,
  mobileLabel = "Open Just in Thyme",
  webLabel = "Continue to sign in",
}: {
  schemeUrl: string
  webFallbackHref: string
  mobileLabel?: string
  webLabel?: string
}) {
  if (isMobileUserAgent()) {
    return (
      <a href={schemeUrl} className={buttonClasses}>
        {mobileLabel}
      </a>
    )
  }
  return (
    <Link to={webFallbackHref} className={buttonClasses}>
      {webLabel}
    </Link>
  )
}

const buttonClasses =
  "inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 font-sans text-base font-bold text-accent transition-colors hover:bg-forest-900"

// SPA-only app, so window is defined at render time in the browser. Regex
// catches phones + Android tablets; iPadOS ≥13 Safari lies and reports as
// Macintosh, so real iPads read as desktop here. Acceptable false negative —
// iPad users get the "Continue to sign in" link, which works fine.
function isMobileUserAgent(): boolean {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod|Android/.test(window.navigator.userAgent)
}
