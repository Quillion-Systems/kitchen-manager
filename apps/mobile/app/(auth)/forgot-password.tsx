import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { Button } from "../../components/Button"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Field } from "../../components/Field"
import { PageTitle } from "../../components/PageTitle"
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
    const result = await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })
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
        title={<PageTitle prefix="Check your" italic="email" />}
        subtitle={
          <Text style={styles.subtitle}>
            If an account exists for <Text style={styles.emailText}>{email}</Text>, we've sent a
            link to reset the password. Open it and set a new one.
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
        <Text style={styles.body}>
          The link expires shortly for security — request a new one if it does.
        </Text>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={<PageTitle prefix="Forgot" italic="password" />}
      subtitle="Enter your account email and we'll send a link to set a new one."
      footer={
        <Text style={styles.footerText}>
          <Link href="/sign-in" style={styles.footerLink}>
            Back to sign in
          </Link>
        </Text>
      }
    >
      {error ? <ErrorBanner testID="forgot-error" message={error} /> : null}

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

      <Button
        testID="submit-button"
        size="lg"
        loading={pending}
        disabled={!email}
        onPress={onSubmit}
      >
        Send reset link
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
