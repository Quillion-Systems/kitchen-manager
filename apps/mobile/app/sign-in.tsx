// Placeholder route: reuses the pre-router AuthScreen component (combined
// sign-in / sign-up form) so this migration PR stays scoped to routing. The
// follow-up subtask (port sign-in / sign-up to Expo Router screens) will split
// this into dedicated /sign-in and /sign-up screens with the reveal-toggle
// pattern from the web.
export { AuthScreen as default } from "../AuthScreen"
