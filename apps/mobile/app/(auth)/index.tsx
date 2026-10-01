import {
  fontSizes,
  mobileFonts,
  primitives,
} from "@kitchen-manager/design-tokens"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../../components/Button"

// Marketing / landing screen shown to signed-out users on cold open. Intentionally
// dark-mode invariant — this screen stays the same regardless of system theme.
// Primitives are referenced directly rather than through semantics for exactly
// this reason: when dark-mode semantics eventually land, this screen opts out.
export default function Welcome() {
  const router = useRouter()
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>
            thyme<Text style={styles.wordmarkStar}>✱</Text>
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Tonight's dinner,</Text>
          <Text style={styles.titleItalic}>sorted</Text>
          <Text style={styles.subtitle}>
            Save the recipes you love, plan your week, and shop from one
            simple list.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            variant="accent"
            size="lg"
            onPress={() => router.push("/sign-up")}
          >
            Create account
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/sign-in")}
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.signInButtonPressed,
            ]}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
          <Text style={styles.legal}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: primitives.forest[800], flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  header: { paddingTop: 16 },
  wordmark: {
    color: primitives.cream[50],
    fontFamily: mobileFonts.serifRegular,
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 32,
  },
  wordmarkStar: { color: primitives.lime[500] },
  content: { flex: 1, justifyContent: "center" },
  title: {
    color: primitives.cream[50],
    fontFamily: mobileFonts.sansExtrabold,
    fontSize: 44,
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  titleItalic: {
    color: primitives.lime[500],
    fontFamily: mobileFonts.serifItalic,
    fontSize: 52,
    lineHeight: 56,
    marginTop: 4,
  },
  subtitle: {
    color: primitives.cream[200],
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
    lineHeight: 24,
    marginTop: 20,
  },
  actions: { gap: 12, paddingBottom: 8 },
  signInButton: {
    alignItems: "center",
    borderColor: primitives.cream[50],
    borderRadius: 999,
    borderWidth: 1.5,
    height: 56,
    justifyContent: "center",
  },
  signInButtonPressed: { opacity: 0.75 },
  signInText: {
    color: primitives.cream[50],
    fontFamily: mobileFonts.sansSemibold,
    fontSize: fontSizes.base,
  },
  legal: {
    color: primitives.forest[400],
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.xs,
    marginTop: 8,
    textAlign: "center",
  },
})
