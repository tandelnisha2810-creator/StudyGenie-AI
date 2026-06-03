/**
 * Profile Screen
 * Google-authenticated user profile + logout
 */

import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { clearAuthStorage } from "@/utils/authStorage";
import {
  LogOut,
  Edit2,
  Settings,
  BookMarked,
  Award,
  Clock,
  Mail,
  Calendar,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUser(user?.uid);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await signOut(auth);
            await clearAuthStorage();
            router.replace("/auth" as any);
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
            console.error("Error logging out:", error);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.placeholderText}>
                  {user?.displayName?.charAt(0) || "U"}
                </Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>

              {userProfile?.createdAt && (
                <Text style={styles.joinedDate}>
Joined{' '}
                  {new Date(userProfile.createdAt as any).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  }).replace(/'s/g, "\u2019s")}
                </Text>
              )}
            </View>
          </View>

          {/* Profile Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <BookMarked size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Award size={24} color={COLORS.secondary} />
                </View>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Quizzes</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Clock size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>42h</Text>
                <Text style={styles.statLabel}>Study</Text>
              </Card>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Mail size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
            </Card>

            {userProfile?.createdAt && (
              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Calendar size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Joined Date</Text>
                    <Text style={styles.infoValue}>
                      {new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity>
              <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingIcon}>
                    <Edit2 size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.settingText}>Edit Profile</Text>
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity>
              <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingIcon}>
                    <Settings size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.settingText}>Preferences</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <Button
              title="Logout"
              onPress={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
              variant="outline"
              fullWidth
              icon={<LogOut size={20} color={COLORS.error} />}
              style={styles.logoutButton}
              textStyle={{ color: COLORS.error }}
            />
            <Text style={styles.logoutDescription}>You'll be signed out</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>StudyGenie AI v1.0.0</Text>
            <Text style={styles.footerDescription}>Your personal AI study assistant</Text>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.lg,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.lg,
  },
  placeholderText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  joinedDate: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.tertiary,
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
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  statIcon: {
    marginBottom: SPACING.md,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  infoCard: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: SPACING.lg,
    width: 40,
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
  },
  settingCard: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: SPACING.lg,
    width: 40,
    alignItems: "center",
  },
  settingText: {
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
  },
  logoutButton: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  logoutDescription: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  footer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    marginTop: SPACING.xxl,
  },
  footerText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  footerDescription: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
});

