import { fontSizes, mobileFonts, semantics } from "@kitchen-manager/design-tokens"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ChevronLeft } from "lucide-react-native"
import type { ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export function AuthShell({
  title,
  subtitle,
  footer,
  showBack = true,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  showBack?: boolean
  children?: ReactNode
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  // Only render the back button if there's actually a screen to pop. On root
  // screens (opening the app cold on /sign-in) canGoBack() is false and tapping
  // back raises "GO_BACK was not handled" — the button has to disappear, not
  // just no-op.
  const canGoBack = showBack && router.canGoBack()
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={semantics.foreground} />
          </Pressable>
        ) : null}

        <Text style={styles.title}>{typeof title === "string" ? title : title}</Text>
        {subtitle ? (
          typeof subtitle === "string" ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )
        ) : null}

        <View style={styles.body}>{children}</View>

        {footer ? (
          <View style={styles.footer}>
            {typeof footer === "string" ? <Text style={styles.footerText}>{footer}</Text> : footer}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: semantics.background, flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24 },
  backButton: {
    alignItems: "center",
    backgroundColor: semantics.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    width: 44,
  },
  title: {
    color: semantics.foreground,
    fontFamily: mobileFonts.sansExtrabold,
    fontSize: 44,
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  subtitle: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.base,
    marginTop: 12,
  },
  body: { gap: 20, marginTop: 32 },
  footer: { alignItems: "center", marginTop: 32 },
  footerText: {
    color: semantics.mutedForeground,
    fontFamily: mobileFonts.sansRegular,
    fontSize: fontSizes.sm,
  },
})
