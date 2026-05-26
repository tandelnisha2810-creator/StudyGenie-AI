import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "@/firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Authentication error");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    // Production note: This project uses signInWithPopup for web.
    // For native, you should wire expo-auth-session + idToken exchange.
    // Keeping same approach as existing /auth screen.
    const { signInWithPopup } = await import("firebase/auth");
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({ user, loading, error, loginWithGoogle, logout }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);

