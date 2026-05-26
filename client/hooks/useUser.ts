/**
 * useUser Hook
 * Custom hook for user profile data
 */

import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "../services/firestore";

export const useUser = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile(userId);
        setUserProfile(profile);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return { userProfile, loading, error };
};
