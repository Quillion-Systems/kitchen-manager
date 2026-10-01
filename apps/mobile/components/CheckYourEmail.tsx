import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Link } from "expo-router"
import { type ReactNode, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { resendVerificationEmail } from "../lib/auth-client"
import { AuthShell } from "./AuthShell"
import { AuthTitle } from "./AuthTitle"
import { Button } from "./Button"
import { ErrorBanner } from "./ErrorBanner"

// Shown after sign-up and reused when an unverified user tries to sign in: the
// account exists but is gated until the emailed link is clicked. Offers a
// resend so the user has a path forward if the mail didn't arrive.
export function CheckYourEmail({ email, title }: { email: string; title?: ReactNode }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function onResend() {
    setStatus("sending")
    const result = await resendVerificationEmail(email)
    setStatus(result.error ? "error" : "sent")
  }

  return (
    <AuthShell
      title={title ?? <AuthTitle prefix="Check your" italic="email" />}
      subtitle={
        <Text style={styles.subtitle}>
          We sent a verification link to <Text style={styles.emailText}>{email}</Text>. Open it to
          activate your account.
        </Text>
      }
      footer={
        <Text style={styles.footerText}>
          <Link href="/sign-in" style={styles.footerLink}>
            Back to sign in
          </Link>
        </Text>
      }
    >
      <Text style={styles.body}>Didn't get it? Check spam, or resend below.</Text>
      {status === "error" ? (
        <ErrorBanner testID="resend-error">
          Couldn't resend right now. Try again in a moment.
        </ErrorBanner>
      ) : null}
      <Button
        testID="resend-verification"
        variant="secondary"
        size="lg"
        loading={status === "sending"}
        disabled={status === "sent"}
        onPress={onResend}
      >
        {status === "sent" ? "Sent — check your inbox" : "Resend email"}
      </Button>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
    lineHeight: 24,
    marginTop: 12,
  },
  body: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
    lineHeight: 24,
  },
  emailText: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
  },
  footerText: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
  },
  footerLink: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    textDecorationLine: "underline",
  },
})
