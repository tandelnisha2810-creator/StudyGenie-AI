import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

// NOTE:
// This route is kept only to avoid breaking existing navigation links/builds.
// Registration was removed. App now uses Google-only auth in /auth.

export default function SignupScreen_Deprecated() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [loading, user, router]);

  const goAuth = async () => {
    if (pending) return;
    setPending(true);
    try {
      router.replace("/auth" as any);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
          style={styles.logo}
        />
        <Text style={styles.heading}>StudyGenie AI</Text>
        <Text style={styles.subtitle}>Signup is removed. Use Google sign-in.</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={goAuth}
          disabled={pending}
        >
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>Redirecting to the Google sign-in screen.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#4E41F7", padding: 20, justifyContent: "center" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#4E41F7" },
  hero: { alignItems: "center", marginBottom: 24 },
  logo: { width: 96, height: 96, marginBottom: 14 },
  heading: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#DCDcff", marginTop: 10, textAlign: "center" },
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
  googleButton: { backgroundColor: "#6C63FF", paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  googleButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { marginTop: 12, color: "#6b6b8a", textAlign: "center", fontWeight: "600", fontSize: 12 },
});

