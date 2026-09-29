import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, bearer, jwt } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { db } from "./db"
import { household, householdMember } from "./db/household"
import * as schema from "./db/schema"
import { sendEmail } from "./email/mailer"
import { resetPasswordEmail, verificationEmail } from "./email/templates"
import { env } from "./env"

// Parsed once at module load so the create hook doesn't re-split on every
// sign-up. Empty env → empty set → no automatic promotions.
const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)

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
  databaseHooks: {
    user: {
      create: {
        // Every new user gets a default household + membership so downstream
        // code can assume `ctx.householdId` exists. Not wrapped in a
        // transaction with the user insert (Better Auth doesn't hand us the
        // outer tx), so a failure here would leave a user without a
        // household — trpc/init.ts throws INTERNAL_SERVER_ERROR in that case
        // to fail loudly rather than silently work with orphaned data.
        after: async (createdUser) => {
          const [h] = await db.insert(household).values({ name: "My Kitchen" }).returning()
          if (!h) throw new Error("Failed to create default household")
          await db.insert(householdMember).values({ householdId: h.id, userId: createdUser.id })
          // Auto-promote to admin when the new user's email is in the
          // ADMIN_EMAILS allowlist. Migration 0004 backfills the same rule
          // for users that existed before the plugin landed; this covers
          // future signups. Lowercased on both sides since emails are
          // case-insensitive in practice.
          if (adminEmails.has(createdUser.email.toLowerCase())) {
            await db
              .update(schema.user)
              .set({ role: "admin" })
              .where(eq(schema.user.id, createdUser.id))
          }
        },
      },
    },
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
    // Admin plugin: adds role/banned/banReason/banExpires to user, plus
    // /api/auth/admin/* endpoints (list-users, ban-user, remove-user,
    // set-role, …). New users get defaultRole "user"; only users with role
    // in adminRoles can call the admin endpoints. Membership in that role
    // is granted via ADMIN_EMAILS at signup — no manual promotion needed.
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    jwt({
      jwt: {
        audience: "powersync",
        getSubject: (session) => session.user.id,
        // Household id in the token so PowerSync sync rules can scope by
        // household (see powersync/sync-config.yaml). Membership is created at
        // sign-up and never removed, so this lookup always resolves for a
        // valid session. If someday users can belong to multiple households,
        // switch to an array claim + parametrized streams.
        definePayload: async (session) => {
          const [membership] = await db
            .select({ householdId: householdMember.householdId })
            .from(householdMember)
            .where(eq(householdMember.userId, session.user.id))
            .limit(1)
          if (!membership) {
            throw new Error(`User ${session.user.id} has no household — cannot mint PowerSync JWT`)
          }
          return { household_id: membership.householdId }
        },
      },
    }),
  ],
})
