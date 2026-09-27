import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { CheckYourEmail } from "../../components/CheckYourEmail"
import { Field } from "../../components/Field"
import { PasswordField } from "../../components/PasswordField"
import { SubmitButton } from "../../components/SubmitButton"
import { signIn } from "../../lib/auth-client"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Set when Better Auth rejects sign-in because the account exists but hasn't
  // been verified. Swaps to CheckYourEmail (with a Resend button) instead of a
  // dead-end error message.
  const [needsVerification, setNeedsVerification] = useState(false)

  async function onSubmit() {
    setPending(true)
    setError(null)
    const result = await signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      if (result.error.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true)
        return
      }
      setError(result.error.message ?? "Could not sign in")
      return
    }
    // On success, the root layout's guard re-renders into the (app) group.
  }

  if (needsVerification) {
    return <CheckYourEmail email={email} title="Verify your email" />
  }

  return (
    <AuthShell
      title="Sign in"
      footer={
        <Link href="/sign-up" style={styles.link}>
          Need an account? Sign up
        </Link>
      }
    >
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
        testID="password-input"
        toggleTestID="password-toggle"
        value={password}
        onChangeText={setPassword}
        textContentType="password"
      />
      <Link href="/forgot-password" testID="forgot-link" style={styles.forgot}>
        Forgot password?
      </Link>
      {error ? (
        <Text testID="auth-error" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <SubmitButton testID="submit-button" pending={pending} onPress={onSubmit}>
        Sign in
      </SubmitButton>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  link: { color: "#38bdf8" },
  forgot: { color: "#a3a3a3", fontSize: 13, textAlign: "right" },
  error: { color: "#f87171", fontSize: 14 },
})
