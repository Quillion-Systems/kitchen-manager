import { Stack } from "expo-router"
import { PowerSyncProvider } from "../../lib/powersync-provider"

// Signed-in area. Everything under (app) requires a session — the parent root
// layout's Stack.Protected guard enforces it. PowerSyncProvider lives here
// (not at the root) because there's no session to mint a sync JWT with until
// the user is authenticated, and the provider owns the DB connection.
export default function AppLayout() {
  return (
    <PowerSyncProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PowerSyncProvider>
  )
}
