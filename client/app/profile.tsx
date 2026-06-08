import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';

import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { router } from 'expo-router';
import { clearAuthStorage } from '@/utils/authStorage';
import {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteProfile,
} from '@/services/profileService';

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  profileImage: string;
  createdAt: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    studyReminders: boolean;
  };
}

export default function ProfileScreen() {
  const user = auth.currentUser;

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Preferences state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const data = await getProfile();
      console.log('[PROFILE] Loaded:', data);

      if (data) {
        setProfile(data);
        setFullName(data.fullName || '');
        setProfileImageUrl(data.profileImage || '');
        setDarkMode(data.preferences?.darkMode ?? false);
        setNotifications(data.preferences?.notifications ?? true);
        setStudyReminders(data.preferences?.studyReminders ?? true);
      }
    } catch (err) {
      console.error('[PROFILE] Load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get avatar initials
  const getAvatarInitials = (): string => {
    if (!profile?.fullName) return 'U';
    const names = profile.fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return profile.fullName.substring(0, 2).toUpperCase();
  };

  // Format joined date
  const formatJoinedDate = (): string => {
    if (!profile?.createdAt) return 'Unknown';
    const date = new Date(profile.createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle profile update
  const handleUpdateProfile = useCallback(async () => {
    try {
      if (!fullName.trim()) {
        setError('Full Name is required');
        return;
      }

      setError('');
      setSuccess('');
      setUpdateLoading(true);

      await updateProfile({
        fullName: fullName.trim(),
        profileImage: profileImageUrl.trim(),
      });

      setSuccess('Profile updated successfully!');
      await loadProfile();

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('[PROFILE UPDATE] Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  }, [fullName, profileImageUrl, loadProfile]);

  // Handle preferences update
  const handleUpdatePreferences = useCallback(async () => {
    try {
      setError('');
      setSuccess('');
      setPreferencesLoading(true);

      await updatePreferences({
        darkMode,
        notifications,
        studyReminders,
      });

      setSuccess('Preferences saved successfully!');

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('[PREFERENCES UPDATE] Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  }, [darkMode, notifications, studyReminders]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      await clearAuthStorage();
      router.replace('/auth' as any);
    } catch (err) {
      console.error('[LOGOUT] Failed:', err);
      setError('Logout failed. Please try again.');
    }
  }, []);

  // Handle delete account with confirmation
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setError('');
              await deleteProfile();
              await signOut(auth);
              await clearAuthStorage();
              router.replace('/auth' as any);
            } catch (err) {
              console.error('[DELETE ACCOUNT] Failed:', err);
              setError(err instanceof Error ? err.message : 'Failed to delete account');
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const hasProfileImage = profileImageUrl && profileImageUrl.trim().length > 0;
  const initials = getAvatarInitials();

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Error Message */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Text style={styles.errorClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Success Message */}
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {success}</Text>
          </View>
        ) : null}

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {hasProfileImage ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
                defaultSource={require('@/assets/images/icon.png')}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{profile?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || 'Email'}</Text>
          <View style={styles.joinedDateContainer}>
            <Text style={styles.joinedDateLabel}>Joined: </Text>
            <Text style={styles.joinedDate}>{formatJoinedDate()}</Text>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#D1D5DB"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile Photo URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/photo.jpg"
              value={profileImageUrl}
              onChangeText={setProfileImageUrl}
              placeholderTextColor="#D1D5DB"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              updateLoading && styles.buttonDisabled,
            ]}
            onPress={handleUpdateProfile}
            disabled={updateLoading}
          >
            {updateLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
              <Text style={styles.preferenceDescription}>Enable dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={darkMode ? '#1F2937' : '#F5F7FB'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive app notifications
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={notifications ? '#1F2937' : '#F5F7FB'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceLabel}>Study Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Remind me to study regularly
              </Text>
            </View>
            <Switch
              value={studyReminders}
              onValueChange={setStudyReminders}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={studyReminders ? '#1F2937' : '#F5F7FB'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              preferencesLoading && styles.buttonDisabled,
            ]}
            onPress={handleUpdatePreferences}
            disabled={preferencesLoading}
          >
            {preferencesLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // Banner styles
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  errorClose: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  successBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  successText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '500',
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },

  avatarContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarImage: {
    width: 120,
    height: 120,
  },

  avatarPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#3B82F6',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarInitials: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },

  joinedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  joinedDateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  joinedDate: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },

  // Input styles
  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },

  // Button styles
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },

  dangerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Preference styles
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  preferenceTextContainer: {
    flex: 1,
    marginRight: 12,
  },

  preferenceLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },

  preferenceDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  bottomSpacing: {
    height: 20,
  },
});

