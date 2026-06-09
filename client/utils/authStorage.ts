import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const TOKEN_KEY = "token";
export const USER_KEY = "user";

export const saveAuthToken = async (token: string) => {
  await storage.setItem(TOKEN_KEY, token);
};

export const saveUserData = async (userData: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}) => {
  await storage.setItem(USER_KEY, JSON.stringify(userData));
};

export const saveAuthSession = async (
  token: string,
  userData: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }
) => {
  await Promise.all([saveAuthToken(token), saveUserData(userData)]);
};

export const getStoredAuthToken = async (): Promise<string | null> => {
  return storage.getItem(TOKEN_KEY);
};

export const getStoredUser = async (): Promise<{
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
} | null> => {
  const value = await storage.getItem(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const clearAuthStorage = async () => {
  try {
    // Remove canonical auth keys
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);

    // Remove any other likely auth/session keys from AsyncStorage/localStorage
    if (!isWeb) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const toRemove = keys.filter((k: string) => /auth|token|session|user/i.test(k));
      if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
    } else {
      // Web: scan localStorage keys
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && /auth|token|session|user/i.test(k)) window.localStorage.removeItem(k);
      }
    }

    // Try clearing SecureStore entries if expo-secure-store is available
    try {
      // dynamic require to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SecureStore = require('expo-secure-store');
      if (SecureStore && SecureStore.deleteItemAsync) {
        await Promise.all([
          SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync(USER_KEY).catch(() => {}),
        ]);
      }
    } catch {}
  } catch (err) {
    // Non-fatal; log for diagnostics
    // eslint-disable-next-line no-console
    console.warn('clearAuthStorage: partial failure', err);
  }
};
