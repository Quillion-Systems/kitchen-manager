import { Link } from "expo-router"
import { type ReactNode, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { PasswordField } from "../../components/PasswordField"
import { SubmitButton } from "../../components/SubmitButton"
import { changePassword, deleteUser, signOut, useSession } from "../../lib/auth-client"

export default function Settings() {
  const { data: session } = useSession()
  // Root layout's guard prevents this subtree from mounting without a session,
  // but the type is nullable — bail on a transient null rather than crash.
  if (!session) return null

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Link href="/" style={styles.back}>
          ← Kitchen Manager
        </Link>
        <Text style={styles.title}>Settings</Text>

        <Section title="Account">
          <Row label="Name" value={session.user.name} />
          <Row label="Email" value={session.user.email} />
        </Section>

        <ChangePasswordSection />

        <DangerZoneSection
          onDeleted={async () => {
            // Wipes the SecureStore session token + local PowerSync DB. The
            // /sign-out API call fails (user is gone) but the local cleanup is
            // what matters; the root layout guard then flips to (auth).
            await signOut()
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

function ChangePasswordSection() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = current.length > 0 && next.length > 0 && next === confirm

  async function onSubmit() {
    setPending(true)
    setError(null)
    setDone(false)
    // revokeOtherSessions: true so a compromised device that already had a
    // session can't keep it after a password rotation. This device keeps its.
    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    })
    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not change password")
      return
    }
    setCurrent("")
    setNext("")
    setConfirm("")
    setDone(true)
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Change password</Text>
      <View style={styles.sectionBody}>
        <PasswordField
          label="Current password"
          testID="current-password-input"
          value={current}
          onChangeText={setCurrent}
          textContentType="password"
        />
        <PasswordField
          label="New password"
          testID="new-password-input"
          value={next}
          onChangeText={setNext}
          textContentType="newPassword"
        />
        <PasswordField
          label="Confirm new password"
          testID="confirm-password-input"
          value={confirm}
          onChangeText={setConfirm}
          textContentType="newPassword"
        />
        {mismatch ? <Text style={styles.error}>Passwords don't match</Text> : null}
        {error ? (
          <Text testID="change-password-error" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {done ? (
          <Text style={styles.success}>Password updated. Other sessions signed out.</Text>
        ) : null}
        <View style={canSubmit ? undefined : styles.dim}>
          <SubmitButton
            testID="change-password-submit"
            pending={pending}
            onPress={() => {
              if (canSubmit) onSubmit()
            }}
          >
            Update password
          </SubmitButton>
        </View>
      </View>
    </View>
  )
}

function DangerZoneSection({ onDeleted }: { onDeleted: () => void | Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete() {
    setPending(true)
    setError(null)
    const result = await deleteUser({ password })
    if (result.error) {
      setPending(false)
      setError(result.error.message ?? "Could not delete account")
      return
    }
    // Don't clear pending — the screen unmounts as the layout swaps to (auth).
    await onDeleted()
  }

  return (
    <View style={styles.danger}>
      <Text style={styles.dangerTitle}>Danger zone</Text>
      <Text style={styles.dangerBody}>
        Deleting your account is permanent. Your notes and sync data will be removed and cannot be
        recovered.
      </Text>
      {!confirming ? (
        <Pressable
          testID="delete-account-button"
          style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonDim]}
          onPress={() => setConfirming(true)}
        >
          <Text style={styles.dangerButtonText}>Delete account</Text>
        </Pressable>
      ) : (
        <View style={styles.dangerForm}>
          <Text style={styles.dangerConfirmBody}>
            Enter your password to confirm. This can't be undone.
          </Text>
          <PasswordField
            testID="delete-password-input"
            value={password}
            onChangeText={setPassword}
            textContentType="password"
          />
          {error ? (
            <Text testID="delete-account-error" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <View style={styles.dangerActions}>
            <Pressable
              testID="delete-confirm"
              disabled={pending || password.length === 0}
              style={({ pressed }) => [
                styles.dangerConfirmButton,
                (pending || password.length === 0 || pressed) && styles.buttonDim,
              ]}
              onPress={onDelete}
            >
              <Text style={styles.dangerConfirmText}>{pending ? "…" : "Delete forever"}</Text>
            </Pressable>
            <Pressable
              testID="delete-cancel"
              style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonDim]}
              onPress={() => {
                setConfirming(false)
                setPassword("")
                setError(null)
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#0a0a0a", flex: 1 },
  scroll: { gap: 24, padding: 24, paddingTop: 72 },
  back: {
    color: "#737373",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { color: "#e5e5e5", fontSize: 24, fontWeight: "600", marginTop: 4 },
  section: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    color: "#a3a3a3",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  sectionBody: { gap: 12 },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "#a3a3a3", fontSize: 14 },
  rowValue: { color: "#e5e5e5", flexShrink: 1, fontSize: 14, marginLeft: 12 },
  error: { color: "#f87171", fontSize: 14 },
  success: { color: "#38bdf8", fontSize: 14 },
  dim: { opacity: 0.5 },
  danger: {
    backgroundColor: "rgba(127, 29, 29, 0.15)",
    borderColor: "#7f1d1d",
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  dangerTitle: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dangerBody: { color: "#a3a3a3", fontSize: 14, lineHeight: 20, marginBottom: 14 },
  dangerButton: {
    alignSelf: "flex-start",
    borderColor: "#991b1b",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dangerButtonText: { color: "#f87171", fontSize: 14, fontWeight: "500" },
  dangerForm: { gap: 12 },
  dangerConfirmBody: { color: "#d4d4d4", fontSize: 14, lineHeight: 20 },
  dangerActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  dangerConfirmButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dangerConfirmText: { color: "#fef2f2", fontSize: 14, fontWeight: "600" },
  cancelButton: {
    borderColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: { color: "#d4d4d4", fontSize: 14, fontWeight: "500" },
  buttonDim: { opacity: 0.7 },
})
