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
  await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
};
