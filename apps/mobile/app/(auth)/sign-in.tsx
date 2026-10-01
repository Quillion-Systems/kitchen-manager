import {
  fontSizes,
  mobileFonts,
  semantics,
} from "@kitchen-manager/design-tokens"
import { Link } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { AuthTitle } from "../../components/AuthTitle"
import { Button } from "../../components/Button"
import { Checkbox } from "../../components/Checkbox"
import { CheckYourEmail } from "../../components/CheckYourEmail"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Field } from "../../components/Field"
import { PasswordToggle } from "../../components/PasswordToggle"
import { signIn } from "../../lib/auth-client"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
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
    // Root layout's guard swaps to (app) on next render.
  }

  if (needsVerification) {
    return (
      <CheckYourEmail
        email={email}
        title={<AuthTitle prefix="Verify your" italic="email" />}
      />
    )
  }

  return (
    <AuthShell
      title={<AuthTitle prefix="Welcome" italic="back" />}
      subtitle="Sign in to access your recipes and weekly meal plans."
      footer={
        <Text style={styles.footerText}>
          New to thyme?{" "}
          <Link href="/sign-up" style={styles.footerLink}>
            Create an account
          </Link>
        </Text>
      }
    >
      {error ? (
        <ErrorBanner testID="auth-error">
          {`${error}. Try again, or reset it below.`}
        </ErrorBanner>
      ) : null}

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
      <Field
        label="Password"
        testID="password-input"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="current-password"
        textContentType="password"
        invalid={!!error}
        rightSlot={
          <PasswordToggle
            testID="password-toggle"
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
          />
        }
      />

      <View style={styles.row}>
        <Checkbox checked={remember} onCheckedChange={setRemember}>
          Remember me
        </Checkbox>
        <Link href="/forgot-password" testID="forgot-link" style={styles.forgotLink}>
          Forgot password?
        </Link>
      </View>

      <Button
        testID="submit-button"
        size="lg"
        loading={pending}
        disabled={!email || !password}
        onPress={onSubmit}
      >
        Sign in
      </Button>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forgotLink: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
    textDecorationLine: "underline",
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
