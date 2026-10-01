import {
  fontSizes,
  mobileFonts,
  semantics,
} from "@kitchen-manager/design-tokens"
import { useRouter } from "expo-router"
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
  children: ReactNode
}) {
  const router = useRouter()
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
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={22} color={semantics.foreground} />
          </Pressable>
        ) : null}

        <Text style={styles.title}>
          {typeof title === "string" ? title : title}
        </Text>
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
            {typeof footer === "string" ? (
              <Text style={styles.footerText}>{footer}</Text>
            ) : (
              footer
            )}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: semantics.background, flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24 },
  backButton: {
    alignItems: "center",
    backgroundColor: semantics.surface,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    marginBottom: 16,
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
