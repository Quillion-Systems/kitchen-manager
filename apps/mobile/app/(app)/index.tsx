import { Link } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { signOut, useSession } from "../../lib/auth-client"

// Home for signed-in users. Ported from the pre-router App.tsx `SignedIn`
// component. Still hard-coded sample tasks; real task list arrives once the
// Notes/notes-adjacent flows are wired to PowerSync on mobile.
const sampleTasks = [
  { id: 1, title: "Set up the monorepo", done: true },
  { id: 2, title: "Stand up the web + desktop shells", done: true },
  { id: 3, title: "Get the mobile shell on a real device", done: true },
  { id: 4, title: 'Figure out what a "task" actually is in Kitchen Manager', done: false },
]

export default function Home() {
  const { data: session } = useSession()
  // Should always exist here — the root layout's guard prevents mounting this
  // subtree when there's no session — but guard against a transient null.
  if (!session) return null

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.authBar}>
        <Text testID="signed-in" style={styles.authBarText} numberOfLines={1}>
          Signed in as <Text style={styles.authBarEmail}>{session.user.email}</Text>
        </Text>
        <View style={styles.authBarActions}>
          <Link href="/settings" testID="settings-link" style={styles.authBarLink}>
            Settings
          </Link>
          <Pressable testID="sign-out" onPress={() => signOut()}>
            <Text style={styles.authBarLink}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.brand}>Kitchen Manager</Text>
      <Text style={styles.tag}>web · desktop · mobile — one stack</Text>
      <Text style={styles.eyebrow}>Native shell · signed in</Text>

      <Text style={styles.section}>Sample tasks (hard-coded)</Text>
      {sampleTasks.map((task) => (
        <View key={task.id} style={styles.task}>
          <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
            {task.done ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <Text style={[styles.taskText, task.done && styles.taskTextDone]}>{task.title}</Text>
        </View>
      ))}

      <Text style={styles.footer}>
        Still fake data — but the account above is real, authenticated against the same API the web
        and desktop apps use.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8, padding: 24, paddingTop: 72 },
  authBar: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  authBarText: { color: "#a3a3a3", fontSize: 13, flexShrink: 1 },
  authBarEmail: { color: "#e5e5e5" },
  authBarActions: { alignItems: "center", flexDirection: "row", gap: 14, marginLeft: 12 },
  authBarLink: { color: "#a3a3a3", fontSize: 13 },
  brand: { color: "#e5e5e5", fontSize: 44, fontWeight: "700" },
  tag: { color: "#a3a3a3", fontSize: 16, fontStyle: "italic", marginTop: 4 },
  eyebrow: {
    color: "#737373",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 12,
    textTransform: "uppercase",
  },
  section: {
    color: "#a3a3a3",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 28,
    textTransform: "uppercase",
  },
  task: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#525252",
    borderRadius: 5,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxDone: { backgroundColor: "rgba(16,185,129,0.2)", borderColor: "#10b981" },
  check: { color: "#34d399", fontSize: 12 },
  taskText: { color: "#e5e5e5", flexShrink: 1, fontSize: 15 },
  taskTextDone: { color: "#737373", textDecorationLine: "line-through" },
  footer: { color: "#525252", fontSize: 12, lineHeight: 18, marginTop: 32 },
})
