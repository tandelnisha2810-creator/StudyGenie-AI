import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { LogOut, Settings, Trash2, Mail, Calendar, Moon, Bell } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import { auth } from "@/firebase";
import { clearAuthStorage } from "@/utils/authStorage";

import {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteProfile as deleteProfileApi,
} from "@/services/profileService";
import { uploadProfilePhoto } from "@/services/profileService";
import { deleteFirebaseUser } from "@/services/authAccountService";



type Preferences = {
  darkMode: boolean;
  notifications: boolean;
  studyReminders: boolean;
};

type MongoProfile = {
  userId: string;
  fullName: string;
  email: string;
  profileImage: string;
  preferences?: Preferences;
  createdAt?: string;
  updatedAt?: string;
};

function initialsFromName(name?: string | null) {
  const value = (name || "").trim();
  if (!value) return "U";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoinedDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function PreferenceToggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onToggle(!value)}
      style={toggleStyles.row}
    >
      <Text style={toggleStyles.label}>{label}</Text>
      <View
        style={[
          toggleStyles.track,
          { backgroundColor: value ? COLORS.primary : COLORS.gray200 },
        ]}
      >
        <View
          style={[
            toggleStyles.thumb,
            { alignSelf: value ? "flex-end" : "flex-start" },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
    flex: 1,
    marginRight: SPACING.md,
  },
  track: {
    width: 48,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  // Only show errors after user actions.
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);




  const [profile, setProfile] = useState<MongoProfile | null>(null);

  const [draftFullName, setDraftFullName] = useState("");
  const [draftProfileImage, setDraftProfileImage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Keep drafts aligned with MongoDB whenever profile is refreshed.
    setDraftFullName(profile.fullName || "");
    setDraftProfileImage(profile.profileImage || "");
  }, [profile?.userId]);

  const [prefs, setPrefs] = useState<Preferences>({
    darkMode: false,
    notifications: true,
    studyReminders: true,
  });

  const joinedDateText = useMemo(() => formatJoinedDate(profile?.createdAt), [profile?.createdAt]);

  const displayName = useMemo(
    () => profile?.fullName || user?.displayName || "User",
    [profile?.fullName, user?.displayName]
  );

  const displayEmail = useMemo(
    () => user?.email || profile?.email || "",
    [user?.email, profile?.email]
  );

  const displayImageUri = useMemo(() => {
    if (profile?.profileImage?.trim()) return profile.profileImage.trim();
    if (user?.photoURL?.trim()) return user.photoURL.trim();
    return "";
  }, [profile?.profileImage, user?.photoURL]);

  const avatarInitials = useMemo(() => initialsFromName(profile?.fullName || user?.displayName), [profile?.fullName, user?.displayName]);


  const ensureProfileExists = async () => {
    if (!user) return;

    // GET /api/profile is expected to auto-create for authenticated users.
    // For initial load we never want to show validation/errors about "not found".
    const p = await getProfile();
    console.log("[PROFILE LOADED]", p);
    setProfile(p);
    setImageLoadError(false);

    // Everything visible must come from MongoDB.
    setDraftFullName(p?.fullName || "");
    setDraftProfileImage(p?.profileImage || "");
    setPrefs({
      darkMode: !!p?.preferences?.darkMode,
      notifications: p?.preferences?.notifications ?? true,
      studyReminders: p?.preferences?.studyReminders ?? true,
    });
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setInitialLoadError(null);
      setUpdateError(null);
      setPrefsError(null);
      try {
        await ensureProfileExists();
      } catch (e: any) {
        if (!mounted) return;
        // Never show validation errors during initial profile auto-load.
        setInitialLoadError(e?.message || "Unable to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const onSaveProfile = async () => {
    if (!user) return;

    const payload: { fullName: string; profileImage?: string } = {
      fullName: draftFullName.trim(),
    };

    if (draftProfileImage?.trim()) {
      payload.profileImage = draftProfileImage.trim();
    }

    console.log("Full Name State:", draftFullName);
    console.log("Update Payload:", payload);

    if (!payload.fullName) {
      setUpdateError("Full Name cannot be empty.");
      return;
    }

    setProfileLoading(true);
    setUpdateError(null);
    try {
      const next = await updateProfile(payload);
      console.log("[PROFILE UPDATE] response:", next);
      setProfile(next);
      setImageLoadError(false);
      await ensureProfileExists();
      Alert.alert("Profile updated", "Profile updated successfully.");
    } catch (e: any) {
      setUpdateError(e?.message || "Unable to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return Alert.alert('Not authenticated');

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access photos is required to upload a profile photo.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Cancelled by user
      // @ts-ignore
      if (pickerResult.cancelled === true || pickerResult.canceled === true) return;

      // @ts-ignore
      const localUri = pickerResult.uri || (pickerResult.assets && pickerResult.assets[0]?.uri);
      if (!localUri) return Alert.alert('Unable to read image');

      setUploadingPhoto(true);
      setUploadError(null);
      setUploadMessage(null);
      setImageLoadError(false);

      const response = await fetch(localUri);
      const blob = await response.blob();
      const filename = localUri.split('/').pop() || `photo-${Date.now()}.jpg`;
      const mime = blob.type || 'image/jpeg';

      const formData = new FormData();
      if (Platform.OS === 'web') {
        formData.append('photo', blob, filename);
      } else {
        // React Native: append file object with uri, name, type
        // @ts-ignore
        formData.append('photo', { uri: localUri, name: filename, type: mime });
      }

      const uploadResult = await uploadProfilePhoto(formData);
      const imageUrl = uploadResult.imageUrl;
      const savedProfile = uploadResult.profile;

      if (!imageUrl) {
        throw new Error('Upload succeeded but no image URL was returned');
      }

      setDraftProfileImage(imageUrl);
      setProfile((prev) => {
        if (savedProfile) return savedProfile;
        return prev ? { ...prev, profileImage: imageUrl } : prev;
      });
      setImageLoadError(false);
      setUploadMessage('Profile photo uploaded and saved successfully.');
    } catch (e: any) {
      console.error('[UPLOAD PHOTO] Failed:', e?.message || e);
      setUploadError(e?.message || 'Unable to upload photo');
      Alert.alert('Upload failed', e?.message || 'Unable to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSavePrefs = async (next: Preferences) => {
    if (!user) return;

    setPrefsSaving(true);
    setPrefsError(null);
    try {
      const updated = await updatePreferences(next);
      setPrefs(next);
      setProfile(updated);
      Alert.alert("Preferences saved", "Preferences saved successfully.");
    } catch (e: any) {
      setPrefsError(e?.message || "Unable to update preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    console.log("STEP 1 - Logout handler entered");
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      console.log("STEP 2 - Starting Firebase signOut");
      await signOut(auth);
      console.log("STEP 3 - Firebase signOut success");

      console.log("STEP 4 - Clearing local storage");
      await clearAuthStorage();

      console.log("STEP 5 - Clearing profile state");
      setProfile(null);
      setDraftFullName("");
      setDraftProfileImage("");

      console.log("STEP 6 - Navigating to /auth");
      router.dismissAll?.();
      router.replace("/auth");

      console.log("STEP 7 - Navigation complete");
    } catch (error: any) {
      console.error("LOGOUT ERROR:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    console.log("DELETE STEP 1 - Handler entered");

    // Expo Web: bypass Alert to ensure the confirmation callback runs.
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to permanently delete your account?\n\nThis action cannot be undone.\nAll profile data, notes, preferences, and account information will be permanently removed."
      );
      console.log("DELETE STEP 2 - Confirmation shown");
      console.log("DELETE STEP 3 - Confirmation accepted", confirmed);

      if (!confirmed) return;

      try {
        setIsDeleting(true);

        console.log("DELETE STEP 4 - MongoDB deletion started");
        await deleteProfileApi();
        console.log("DELETE STEP 5 - MongoDB deletion success");
        console.log("MongoDB profile deleted");
        console.log("User-related data deleted");

        console.log("DELETE STEP 6 - Firebase deletion started");
        await deleteFirebaseUser();
        console.log("DELETE STEP 7 - Firebase deletion success");
        console.log("Firebase account deleted");

        console.log("DELETE STEP 8 - Local session cleared");
        await clearAuthStorage();

        // Clear local UI state
        setProfile(null);
        setDraftFullName("");
        setDraftProfileImage("");
        setPrefs({
          darkMode: false,
          notifications: true,
          studyReminders: true,
        });
        setImageLoadError(false);
        setInitialLoadError(null);
        setUpdateError(null);
        setUploadError(null);
        setUploadMessage(null);
        setPrefsError(null);

        console.log("Local session cleared");

              console.log("DELETE STEP 9 - Redirecting to /auth");

              // Avoid dismissAll() stack operations that can trigger:
              // "POP_TO_TOP was not handled by any navigator" on Expo Router.
              router.replace({ pathname: "/auth" });

              console.log("Navigation completed");
      } catch (error: any) {
        console.error("DELETE ERROR:", error);
        Alert.alert("Error", String(error?.message || error));
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => {
            // Cancel only closes dialog
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("DELETE STEP 2 - Confirmation shown");
            console.log("DELETE STEP 3 - Confirmation accepted");

            try {
              setIsDeleting(true);

              console.log("DELETE STEP 4 - MongoDB deletion started");
              await deleteProfileApi();
              console.log("DELETE STEP 5 - MongoDB deletion success");
              console.log("MongoDB profile deleted");
              console.log("User-related data deleted");

              console.log("DELETE STEP 6 - Firebase deletion started");
              await deleteFirebaseUser();
              console.log("DELETE STEP 7 - Firebase deletion success");
              console.log("Firebase account deleted");

              console.log("DELETE STEP 8 - Local session cleared");
              await clearAuthStorage();

              // Step 5/6 - reset local UI state (AuthGuard will redirect once user becomes null)
              setProfile(null);
              setDraftFullName("");
              setDraftProfileImage("");
              setPrefs({
                darkMode: false,
                notifications: true,
                studyReminders: true,
              });
              setImageLoadError(false);
              setInitialLoadError(null);
              setUpdateError(null);
              setUploadError(null);
              setUploadMessage(null);
              setPrefsError(null);

              console.log("Local session cleared");

              console.log("DELETE STEP 9 - Redirecting to /auth");
              router.dismissAll?.();
              router.replace({ pathname: "/auth" });

              console.log("Navigation completed");
            } catch (error: any) {
              console.error("DELETE ERROR:", error);
              Alert.alert("Error", String(error?.message || error));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user && authError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: COLORS.error, ...TYPOGRAPHY.body }}>{authError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* PROFILE SECTION */}
          <View style={styles.section}>
            <Card style={styles.headerCard}>
              <TouchableOpacity activeOpacity={0.8} style={styles.avatarWrap} onPress={handlePickImage}>
                {displayImageUri && !imageLoadError ? (
                  <Image
                    source={{ uri: displayImageUri }}
                    style={styles.profileImage}
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.placeholderText}>{avatarInitials}</Text>
                  </View>
                )}

                <View style={styles.cameraOverlay} pointerEvents="none">
                  <Text style={styles.cameraOverlayText}>📷</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.profileFullName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
              <Text style={styles.joinedDate}>Joined {joinedDateText}</Text>

              {initialLoadError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{initialLoadError}</Text>
                </View>
              ) : null}

              <View style={{ height: SPACING.md }} />

              <View style={styles.formGrid}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  value={draftFullName}
                  onChangeText={setDraftFullName}
                  placeholder="Your full name"
                  placeholderTextColor={TEXT_COLORS.tertiary}
                  style={styles.input}
                />

                {updateError ? (
                  <Text style={{ color: COLORS.error, ...TYPOGRAPHY.caption }}>{updateError}</Text>
                ) : null}
                {uploadError ? (
                  <Text style={{ color: COLORS.error, ...TYPOGRAPHY.caption }}>{uploadError}</Text>
                ) : null}
                {uploadMessage ? (
                  <Text style={{ color: COLORS.success, ...TYPOGRAPHY.caption }}>{uploadMessage}</Text>
                ) : null}

                <Button
                  title={uploadingPhoto ? 'Uploading…' : 'Upload Photo'}
                  onPress={handlePickImage}
                  loading={uploadingPhoto}
                  disabled={uploadingPhoto || profileLoading || loading}
                  variant="outline"
                  fullWidth
                  textStyle={{ color: COLORS.primary }}
                />

                <View style={{ height: SPACING.sm }} />

                <Button
                  title={profileLoading ? "Saving…" : "Update Profile"}
                  onPress={onSaveProfile}
                  loading={profileLoading}
                  disabled={profileLoading || loading}
                  variant="outline"
                  fullWidth
                  icon={<Settings size={18} color={COLORS.primary} />}
                  textStyle={{ color: COLORS.primary }}
                />
              </View>
            </Card>
          </View>

          {/* PREFERENCES SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <Card style={styles.sectionCard}>
              <View style={styles.prefRowTop}>
                <Moon size={18} color={COLORS.primary} />
                <Text style={styles.prefTitle}>Dark Mode</Text>
              </View>
              <PreferenceToggle label="Dark Mode" value={prefs.darkMode} onToggle={(v) => setPrefs({ ...prefs, darkMode: v })} />

              <View style={styles.prefRowTop}>
                <Bell size={18} color={COLORS.primary} />
                <Text style={styles.prefTitle}>Notifications</Text>
              </View>
              <PreferenceToggle
                label="Notifications"
                value={prefs.notifications}
                onToggle={(v) => setPrefs({ ...prefs, notifications: v })}
              />

              <PreferenceToggle
                label="Study Reminders"
                value={prefs.studyReminders}
                onToggle={(v) => setPrefs({ ...prefs, studyReminders: v })}
              />

              <View style={{ height: SPACING.md }} />
              {prefsError ? (
                <Text style={{ color: COLORS.error, ...TYPOGRAPHY.caption, marginBottom: SPACING.sm }}>
                  {prefsError}
                </Text>
              ) : null}
              <Button
                title={prefsSaving ? "Saving…" : "Save Preferences"}
                onPress={() => onSavePrefs(prefs)}
                loading={prefsSaving}
                disabled={prefsSaving || loading}
                variant="outline"
                fullWidth
                textStyle={{ color: COLORS.primary }}
              />
            </Card>
          </View>

          {/* ACCOUNT SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Card style={styles.sectionCard}>
              <Button
                title="Logout"
                onPress={async () => {
                  console.log("STEP 0 - Logout Button onPress");
                  await handleLogout();
                }}
                loading={isLoggingOut}
                disabled={isLoggingOut}
                variant="outline"
                fullWidth
                icon={<LogOut size={18} color={COLORS.error} />}
                textStyle={{ color: COLORS.error }}
              />

              <View style={{ height: SPACING.md }} />

              <Button
                title={isDeleting ? "Deleting…" : "Delete Account"}
                onPress={handleDeleteAccount}
                loading={isDeleting}
                disabled={isDeleting}
                variant="outline"
                fullWidth
                icon={<Trash2 size={18} color={COLORS.error} />}
                textStyle={{ color: COLORS.error }}
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.lg,
  },
  headerCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  cameraOverlay: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cameraOverlayText: {
    color: COLORS.white,
    fontSize: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: BORDER_RADIUS.round,
  },
  profileImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
  },
  errorContainer: {
    padding: SPACING.sm,
    borderRadius: 14,
    backgroundColor: COLORS.errorLight,
    marginBottom: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  profileFullName: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  userId: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.tertiary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  joinedDate: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.tertiary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  sectionCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  formGrid: {
    marginTop: SPACING.sm,
  },
  formLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  prefRowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  prefTitle: {
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
    marginLeft: SPACING.sm,
  },
});

