import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { AuthTitle } from "../../components/AuthTitle"
import { Button } from "../../components/Button"
import { CheckYourEmail } from "../../components/CheckYourEmail"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Field } from "../../components/Field"
import { PasswordField } from "../../components/PasswordField"
import { signUp } from "../../lib/auth-client"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Set once sign-up succeeds but no session was returned — the account exists
  // and now needs email verification. Renders <CheckYourEmail> which handles
  // the resend flow.
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  async function onSubmit() {
    setPending(true)
    setError(null)
    const result = await signUp.email({ name, email, password })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not create account")
      return
    }
    const signedIn = Boolean((result.data as { token?: string | null } | null)?.token)
    if (signedIn) {
      // Root layout guard flips to (app) on next render.
      return
    }
    setAwaitingVerification(true)
  }

  if (awaitingVerification) {
    return <CheckYourEmail email={email} />
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Create" italic="account" />}
      subtitle="Save the recipes you love, plan your week, and shop from one simple list."
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/sign-in" style={styles.footerLink}>
            Sign in
          </Link>
        </Text>
      }
    >
      {error ? <ErrorBanner testID="auth-error">{error}</ErrorBanner> : null}

      <Field
        label="Name"
        testID="name-input"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
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
      <PasswordField
        label="Password"
        testID="password-input"
        toggleTestID="password-toggle"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <Button
        testID="submit-button"
        size="lg"
        loading={pending}
        disabled={!name || !email || !password}
        onPress={onSubmit}
      >
        Create account
      </Button>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
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
