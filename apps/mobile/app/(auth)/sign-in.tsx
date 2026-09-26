import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { Field } from "../../components/Field"
import { PasswordField } from "../../components/PasswordField"
import { SubmitButton } from "../../components/SubmitButton"
import { signIn } from "../../lib/auth-client"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit() {
    setPending(true)
    setError(null)
    const result = await signIn.email({ email, password })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not sign in")
      return
    }
    // On success, the root layout's guard re-renders into the (app) group.
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
  error: { color: "#f87171", fontSize: 14 },
})
