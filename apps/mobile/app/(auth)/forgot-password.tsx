import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { Field } from "../../components/Field"
import { SubmitButton } from "../../components/SubmitButton"
import { requestPasswordReset } from "../../lib/auth-client"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  // Same "if the address exists" confirmation for both success and failure —
  // leaking whether an email is registered would enable account enumeration.
  // Only a real network/transport error surfaces.
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setPending(true)
    setError(null)
    // redirectTo isn't strictly needed (the API rewrites the URL onto WEB_URL
    // itself in api/src/auth.ts) but Better Auth wants it for its own default-
    // URL path; harmless when the server-side override kicks in.
    const result = await requestPasswordReset({ email, redirectTo: "/reset-password" })
    setPending(false)
    // Better Auth returns 400 for "unknown email" — fall through to the
    // enumeration-safe success state. Real transport failures surface an error.
    if (result.error && result.error.status !== 400) {
      setError(result.error.message ?? "Couldn't send the reset email")
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthShell
        title="Check your email"
        footer={
          <Link href="/sign-in" style={styles.link}>
            Back to sign in
          </Link>
        }
      >
        <Text style={styles.body}>
          If an account exists for <Text style={styles.email}>{email}</Text>, we've sent a link to
          reset the password. Open it and set a new one.
        </Text>
        <Text style={styles.body}>
          The link expires shortly for security — request a new one if it does.
        </Text>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      footer={
        <Link href="/sign-in" style={styles.link}>
          Back to sign in
        </Link>
      }
    >
      <Text style={styles.body}>
        Enter your account email and we'll send a link to set a new password.
      </Text>
      <Field
        label="Email"
        testID="email-input"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="username"
      />
      {error ? (
        <Text testID="forgot-error" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <SubmitButton testID="submit-button" pending={pending} onPress={onSubmit}>
        Send reset link
      </SubmitButton>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  link: { color: "#38bdf8" },
  body: { color: "#a3a3a3", fontSize: 14, lineHeight: 20 },
  email: { color: "#e5e5e5", fontWeight: "600" },
  error: { color: "#f87171", fontSize: 14 },
})
