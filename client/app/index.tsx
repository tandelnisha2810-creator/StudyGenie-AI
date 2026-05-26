import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";


export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/home");
      else router.replace("/auth");
      setChecking(false);
    });
    return unsubscribe;
  }, [router]);

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </SafeAreaView>
    );
  }

  return null;
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F5FF",
  },
});
