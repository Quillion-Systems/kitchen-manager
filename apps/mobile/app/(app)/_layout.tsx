import { Stack } from "expo-router"

// Signed-in area. Everything under (app) requires a session — the parent root
// layout's Stack.Protected guard enforces it. Add more screens here (settings,
// notes, etc.) as they land.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
