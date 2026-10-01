import {
  fontSizes,
  mobileFonts,
  primitives,
  semantics,
} from "@kitchen-manager/design-tokens"
import { Link } from "expo-router"
import { X } from "lucide-react-native"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { AuthShell } from "../../components/AuthShell"
import { Button } from "../../components/Button"
import { Checkbox } from "../../components/Checkbox"
import { CheckYourEmail } from "../../components/CheckYourEmail"
import { Field } from "../../components/Field"
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
    return <CheckYourEmail email={email} title="Verify your email" />
  }

  return (
    <AuthShell
      title={
        <Text style={styles.title}>
          Welcome <Text style={styles.titleItalic}>back</Text>
        </Text>
      }
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
      {error ? <ErrorBanner message={error} /> : null}

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
        error={error ? "Incorrect password. Try again or reset it." : undefined}
        rightSlot={
          <Pressable
            testID="password-toggle"
            onPress={() => setShowPassword((s) => !s)}
            hitSlop={8}
          >
            <Text style={styles.showToggle}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <View testID="auth-error" style={styles.banner}>
      <View style={styles.bannerIcon}>
        <X size={14} color={semantics.destructiveForeground} strokeWidth={3} />
      </View>
      <Text style={styles.bannerText}>
        {message} Try again, or reset it below.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansExtrabold,
    fontSize: 44,
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  titleItalic: {
    fontFamily: mobileFonts.serifRegular,
    fontStyle: "italic",
  },
  showToggle: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansMedium,
    fontSize: fontSizes.sm,
    textDecorationLine: "underline",
  },
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
  banner: {
    alignItems: "flex-start",
    backgroundColor: primitives.rust[300],
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  bannerIcon: {
    alignItems: "center",
    backgroundColor: semantics.destructive,
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 2,
    width: 24,
  },
  bannerText: {
    color: primitives.rust[700],
    flex: 1,
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
})
