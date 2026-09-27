import { Link } from "expo-router"
import { useState } from "react"
import { Pressable, StyleSheet, Text } from "react-native"
import { resendVerificationEmail } from "../lib/auth-client"
import { AuthShell } from "./AuthShell"

// Shown after sign-up (and reusable when an unverified user tries to sign in):
// account exists but is gated on verification. Includes a Resend action so the
// user has a path forward if the mail didn't arrive.
export function CheckYourEmail({
  email,
  title = "Check your email",
}: {
  email: string
  title?: string
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function onResend() {
    setStatus("sending")
    const result = await resendVerificationEmail(email)
    setStatus(result.error ? "error" : "sent")
  }

  const disabled = status === "sending" || status === "sent"
  const label =
    status === "sending" ? "…" : status === "sent" ? "Sent — check your inbox" : "Resend email"

  return (
    <AuthShell
      title={title}
      footer={
        <Link href="/sign-in" style={styles.link}>
          Back to sign in
        </Link>
      }
    >
      <Text style={styles.body}>
        We sent a verification link to <Text style={styles.email}>{email}</Text>. Open it to
        activate your account.
      </Text>
      <Text style={styles.body}>Didn't get it? Check spam, or resend below.</Text>
      <Pressable
        testID="resend-verification"
        style={({ pressed }) => [styles.button, (disabled || pressed) && styles.buttonDim]}
        onPress={onResend}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
      {status === "error" ? (
        <Text testID="resend-error" style={styles.error}>
          Couldn't resend right now. Try again in a moment.
        </Text>
      ) : null}
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  link: { color: "#38bdf8" },
  body: { color: "#a3a3a3", fontSize: 14, lineHeight: 20 },
  email: { color: "#e5e5e5", fontWeight: "600" },
  button: {
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
  },
  buttonDim: { opacity: 0.6 },
  buttonText: { color: "#e5e5e5", fontSize: 15, fontWeight: "500" },
  error: { color: "#f87171", fontSize: 14 },
})
