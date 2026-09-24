import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useSession } from "../lib/auth-client"

// Root layout for Expo Router. Uses Stack.Protected (SDK 53+) to gate on the
// Better Auth session — guard evaluates on each render, so signing in flips the
// user from the `sign-in` screen to the `(app)` group automatically.
export default function RootLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color="#e5e5e5" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackBg }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: "center", backgroundColor: "#0a0a0a", flex: 1, justifyContent: "center" },
  stackBg: { backgroundColor: "#0a0a0a" },
})
