import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { bearer, jwt } from "better-auth/plugins"
import { db } from "./db"
import * as schema from "./db/schema"
import { sendEmail } from "./email/mailer"
import { resetPasswordEmail, verificationEmail } from "./email/templates"
import { env } from "./env"

// The mobile app (apps/mobile) authenticates via its deep-link scheme rather
// than a browser origin; the expo() plugin handles its token-in-header flow.
const MOBILE_SCHEME = "kitchenmanager://"

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [...env.TRUSTED_ORIGINS.split(","), MOBILE_SCHEME],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Enable /api/auth/delete-user. Hard-deletes the user + cascades to session /
  // account / verification rows. No grace period — user is required to re-enter
  // their password on the client to confirm.
  user: {
    deleteUser: { enabled: true },
  },
  emailAndPassword: {
    enabled: true,
    // Behind a flag: when on, sign-up creates no session and sends a verification
    // email, and sign-in is blocked until the address is verified. Off by default
    // (dev/CI/preview) so those flows stay email-free; prod turns it on via
    // PROD_EMAIL_ENABLED → REQUIRE_EMAIL_VERIFICATION in render-env.sh.
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
    // Password reset. Better Auth passes us the token; we build the public link
    // so the recipient lands on our /reset-password page (same host as the SPA)
    // regardless of what URL Better Auth would default to.
    sendResetPassword: async ({ user, token }) => {
      const url = `${env.WEB_URL}/reset-password?token=${token}`
      await sendEmail(resetPasswordEmail(user.email, url))
    },
  },
  // Email verification. sendOnSignUp mails the link the moment an account is
  // created; autoSignInAfterVerification signs the user in when they click it (in
  // the browser — mobile/desktop then return to the app and sign in). The link
  // Better Auth builds points at BETTER_AUTH_URL; we rewrite the callbackURL to
  // WEB_URL so every platform lands on the same /verified page.
  emailVerification: {
    // Only mail on sign-up when the gate is actually on. With it off (dev / CI /
    // preview default) sign-up stays a pure, email-free path — existing e2e flows
    // are untouched and no SMTP server is needed.
    sendOnSignUp: env.REQUIRE_EMAIL_VERIFICATION,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1 hour
    sendVerificationEmail: async ({ user, token }) => {
      const url = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(`${env.WEB_URL}/verified`)}`
      await sendEmail(verificationEmail(user.email, url))
    },
  },
  // expo(): mobile token-in-header flow. bearer(): lets the packaged desktop app
  // (served from tauri://, where cross-site cookies aren't sent) authenticate
  // with an Authorization: Bearer token instead. Web stays on cookies.
  //
  // jwt(): mints a short-lived JWT (EdDSA) and serves its public keys at
  // /api/auth/jwks, so the self-hosted PowerSync service can authenticate a
  // signed-in user. `sub` is the user id — sync rules read it as auth.user_id() —
  // and `aud` matches PowerSync's client_auth.audience. Keys persist in a `jwks`
  // table (added by auth:generate).
  plugins: [
    expo(),
    bearer(),
    jwt({
      jwt: {
        audience: "powersync",
        getSubject: (session) => session.user.id,
        // PowerSync only needs the subject (user id); don't ship the user's
        // name/email in the token. Add claims here if sync rules ever need them.
        definePayload: () => ({}),
      },
    }),
  ],
})
