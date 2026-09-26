import { Link } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { useSession } from "../lib/auth-client"

// Landing screen for the `kitchenmanager://verified` deep link — the web SPA
// already ran the actual token verification (Option 3, ClickUp 86bc73vqr) and
// handed off here. This is a minimal stub; the celebration UX + auto-redirect
// lands in ClickUp 86bc73vr1.
//
// Public route: sits at the root of app/ so the root layout renders it whether
// or not there's a session. The CTA branches on session state — signed-in users
// go home (their address just got verified from another surface), signed-out
// users go to sign-in. Both `/` and `/sign-in` live behind Stack.Protected
// guards; a wrong target would silently no-op.
export default function Verified() {
  const { data: session } = useSession()
  const target = session ? "/" : "/sign-in"
  const label = session ? "Continue to Kitchen Manager" : "Continue to sign in"

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>Kitchen Manager</Text>
      <Text style={styles.title}>Email verified</Text>
      <Text style={styles.body}>
        Your email is confirmed. {session ? "You're all set." : "You can sign in now."}
      </Text>
      <Link href={target} style={styles.link}>
        {label}
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0a0a0a",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    color: "#737373",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { color: "#e5e5e5", fontSize: 24, fontWeight: "600" },
  body: { color: "#a3a3a3", fontSize: 15, lineHeight: 22, marginBottom: 8 },
  link: { color: "#38bdf8", fontSize: 15 },
})
