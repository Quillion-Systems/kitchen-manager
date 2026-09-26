import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { Field } from "../../components/Field"
import { PasswordField } from "../../components/PasswordField"
import { SubmitButton } from "../../components/SubmitButton"
import { signUp } from "../../lib/auth-client"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Set once sign-up succeeds but no session was returned — the account exists
  // and now needs email verification. Full CheckYourEmail screen lands in
  // ClickUp 86bc73vr1; until then, show a minimal inline confirmation.
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
          We sent a verification link to <Text style={styles.email}>{email}</Text>. Open it on this
          device to finish creating your account.
        </Text>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <Link href="/sign-in" style={styles.link}>
          Already have an account? Sign in
        </Link>
      }
    >
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
        testID="password-input"
        toggleTestID="password-toggle"
        value={password}
        onChangeText={setPassword}
        textContentType="newPassword"
      />
      {error ? (
        <Text testID="auth-error" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <SubmitButton testID="submit-button" pending={pending} onPress={onSubmit}>
        Sign up
      </SubmitButton>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  link: { color: "#38bdf8" },
  error: { color: "#f87171", fontSize: 14 },
  body: { color: "#d4d4d4", fontSize: 15, lineHeight: 22 },
  email: { color: "#e5e5e5", fontWeight: "600" },
})
