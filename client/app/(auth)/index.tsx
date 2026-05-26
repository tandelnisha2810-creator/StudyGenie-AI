import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithPopup, getRedirectResult, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { provider as googleProvider } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    // Use the provider exported from firebase.js. Keeping local reference for clarity.
    return googleProvider;
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [loading, user, router]);

  const handleContinueWithGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // Expo Web: use popup flow.
      if (Platform.OS === "web") {
        provider.setCustomParameters({ prompt: "select_account" });

        const redirectResult = await getRedirectResult(auth).catch(() => null);
        if (redirectResult?.user) {
          router.replace("/home");
          return;
        }

        await signInWithPopup(auth, provider);
        router.replace("/home");
        return;
      }

      // Native: rely on the same popup-style flow only if it's supported.
      // If your native platform uses expo-auth-session instead, wire it here.
      // Production-safe fallback: direct sign-in attempts will show Firebase errors.
      await signInWithPopup(auth, provider);
      router.replace("/home");
    } catch (e: any) {
      const msg = e?.message || "Google sign-in failed";
      setError(msg);

      // If partial state left behind, ensure we don't stay in a broken auth state.
      // (Signing out is safe; session persistence will handle successful retries.)
      try {
        if (!auth.currentUser) {
          await signOut(auth);
        }
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </SafeAreaView>
    );
  }

  if (user) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
            style={styles.logo}
          />
          <Text style={styles.heading}>StudyGenie AI</Text>
          <Text style={styles.subtitle}>
            Continue with Google to access your notes and AI study assistant.
          </Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.googleButton, submitting && styles.googleButtonDisabled]}
            onPress={handleContinueWithGoogle}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.googleButtonInner}>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to Firebase Authentication terms.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#4E41F7" },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 20, paddingTop: 24 },
  hero: { alignItems: "center", marginBottom: 24 },
  logo: { width: 96, height: 96, marginBottom: 14 },
  heading: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center" },
  subtitle: {
    marginTop: 10,
    color: "#DCDcff",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
    maxWidth: 340,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 16,
  },
  googleButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonDisabled: { opacity: 0.7 },
  googleButtonInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  googleButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errorText: { color: "#dc2626", textAlign: "center", marginTop: 12, fontWeight: "600" },
  footer: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#eee" },
  footerText: { color: "#6b6b8a", fontSize: 12, textAlign: "center", fontWeight: "600" },
});

