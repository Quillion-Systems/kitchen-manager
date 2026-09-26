import { Stack } from "expo-router"

// Signed-out area. Everything under (auth) is gated on !session by the root
// layout's Stack.Protected. Adds forgot-password / reset-password screens as
// they land (see ClickUp 86bc73vra).
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
