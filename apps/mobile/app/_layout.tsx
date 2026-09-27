import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useRef } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useSession } from "../lib/auth-client"

// Root layout for Expo Router. Uses Stack.Protected (SDK 53+) to gate on the
// Better Auth session — guard evaluates on each render, so signing in flips the
// user from the `sign-in` screen to the `(app)` group automatically.
//
// The initialLoad ref is load-bearing: useSession refetches after mutations
// (sign-up, sign-out, etc.) and briefly reports isPending=true again. If we
// returned the spinner on every isPending, that mid-flow refetch would unmount
// the whole Stack and destroy screen-local state — e.g. sign-up's
// awaitingVerification would reset, bouncing the user back to /sign-in instead
// of the CheckYourEmail screen. Only gate on isPending until we've seen data
// resolve once; after that, trust the last-known session value.
export default function RootLayout() {
  const { data: session, isPending } = useSession()
  const initialLoad = useRef(true)
  if (!isPending) initialLoad.current = false

  if (isPending && initialLoad.current) {
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
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: "center", backgroundColor: "#0a0a0a", flex: 1, justifyContent: "center" },
  stackBg: { backgroundColor: "#0a0a0a" },
})
