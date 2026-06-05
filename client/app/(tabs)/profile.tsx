/**
 * Profile Screen
 * Dynamic user profile + logout + statistics dashboard
 */

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
} from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  LogOut,
  Edit2,
  Settings,
  BookMarked,
  Award,
  Clock,
  Mail,
  Calendar,
  Mic,
  FileText,
  Brain,
  ClipboardList,
  Bell,
} from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import { auth } from "@/firebase";

import {
  getUserProfile,
  saveUserProfile,
} from "@/services/firestore";
import { clearAuthStorage } from "@/utils/authStorage";

import { getNotes } from "@/services/noteService";
import { getPdfNotes } from "@/services/pdfService";
import { getVoiceNotes } from "@/services/voiceService";
import {
  getTasks,
  getReminders,
  getStats,
} from "@/services/plannerService";


// Reuse project storage helpers (AsyncStorage on native, localStorage on web)
import {
  getStoredAuthToken,
  TOKEN_KEY,
  USER_KEY,
  saveAuthToken,
  saveAuthSession,
} from "@/utils/authStorage";

type Preferences = {
  darkMode: boolean;
  notifications: boolean;
  studyReminders: boolean;
};

const PREF_KEY = "profile.preferences.v1";

function safeParseBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function defaultPrefs(): Preferences {
  return {
    darkMode: false,
    notifications: true,
    studyReminders: true,
  };
}

async function loadPrefs(): Promise<Preferences> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (!raw) return defaultPrefs();
      const parsed = JSON.parse(raw);
      return {
        darkMode: safeParseBool(parsed?.darkMode, defaultPrefs().darkMode),
        notifications: safeParseBool(
          parsed?.notifications,
          defaultPrefs().notifications
        ),
        studyReminders: safeParseBool(
          parsed?.studyReminders,
          defaultPrefs().studyReminders
        ),
      };
    }


    // Native path uses AsyncStorage abstraction from authStorage
    const storageMod = await import("@/utils/authStorage");
    const storage: any = (storageMod as any).default;
    if (storage?.getItem) {
      const raw = await storage.getItem(PREF_KEY);
      if (!raw) return defaultPrefs();
      const parsed = JSON.parse(raw);
      return {
        darkMode: safeParseBool(parsed?.darkMode, defaultPrefs().darkMode),
        notifications: safeParseBool(
          parsed?.notifications,
          defaultPrefs().notifications
        ),
        studyReminders: safeParseBool(
          parsed?.studyReminders,
          defaultPrefs().studyReminders
        ),
      };
    }

    // If storage abstraction doesn't provide a string value, fall back safely.
    return defaultPrefs();
  } catch {
    return defaultPrefs();
  }
}

async function savePrefs(prefs: Preferences) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      return;
    }

    // Native storage via AsyncStorage helper is already abstracted in authStorage
    const storageMod = await import("@/utils/authStorage");
    const storage = (storageMod as any).default;
    // fallback: use setItem if available
    if (storage?.setItem) {
      await storage.setItem(PREF_KEY, JSON.stringify(prefs));
      return;
    }

    if ((storageMod as any).saveAuthSession) {
      // no-op (should not happen)
    }
  } catch {
    // ignore
  }
}

function initialsFromName(name?: string | null) {
  const value = (name || "").trim();
  if (!value) return "U";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatStudyHoursFromMinutes(totalMinutes: number) {
  const hours = totalMinutes / 60;
  return hours.toFixed(hours % 1 === 0 ? 0 : 1) + "h";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();

  const [prefs, setPrefsState] = useState<Preferences>(defaultPrefs());
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Dashboard queries
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [notesCount, setNotesCount] = useState<number>(0);
  const [quizCount, setQuizCount] = useState<number>(0);
  const [pdfCount, setPdfCount] = useState<number>(0);
  const [voiceCount, setVoiceCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  const [studyHoursMinutes, setStudyHoursMinutes] = useState<number>(0);

  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentPdfs, setRecentPdfs] = useState<any[]>([]);
  const [recentVoiceNotes, setRecentVoiceNotes] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentReminders, setRecentReminders] = useState<any[]>([]);

  // Profile editing
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>("");
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string>("");

  const displayName = useMemo(() => {
    return draftName || user?.displayName || "User";
  }, [draftName, user?.displayName]);

  const userProfileCreatedAtText = "—";


  const joinedJoinedDate = useMemo(() => {
    // Keep existing behavior: only show date when available
    return null;
  }, []);

  // Keep cached user profile fields in sync
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user?.uid) return;
      setProfileLoading(true);
      setProfileError(null);
      try {
        const u = await getUserProfile(user.uid);
        if (!mounted) return;
        setDraftName(u?.name || user?.displayName || "");
        setDraftPhotoUrl(u?.photoURL || user?.photoURL || "");
      } catch (e: any) {
        // Don't block; user still sees dashboard
        if (!mounted) return;
        setProfileError(e?.message || "Failed to load profile");
      } finally {
        if (!mounted) return;
        setProfileLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setPrefsLoading(true);
      setPrefsError(null);
      try {
        const loaded = await loadPrefs();
        if (!mounted) return;
        setPrefsState(loaded);
      } catch (e: any) {
        if (!mounted) return;
        setPrefsError(e?.message || "Failed to load preferences");
      } finally {
        if (!mounted) return;
        setPrefsLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshDashboard = async () => {
    if (!user?.uid) return;

    setLoadingDashboard(true);
    setDashboardError(null);

    try {
      const userId = user.uid;

      // Notes
      const notes = await getNotes(userId);
      const safeNotes = Array.isArray(notes) ? notes : [];
      setNotesCount(safeNotes.length);
      setRecentNotes(safeNotes.slice(0, 5));

      // PDFs (summaries)
      const pdfNotes = await getPdfNotes(userId);
      const safePdfs = Array.isArray(pdfNotes) ? pdfNotes : [];
      setPdfCount(safePdfs.length);
      setRecentPdfs(safePdfs.slice(0, 5));

      // Voice notes
      // voiceService.getVoiceNotes signature expects token?: string, userId?: string
      const voice = await getVoiceNotes(undefined, userId);
      const safeVoice = Array.isArray(voice) ? voice : [];
      setVoiceCount(safeVoice.length);
      setRecentVoiceNotes(safeVoice.slice(0, 5));

      // Quizzes
      // Existing system stores quizzes as embedded objects in notes/voice notes.
      // Aggregate quiz counts from both sources.
      const quizFromNotes = safeNotes.reduce((acc: number, n: any) => {
        const q = n?.quiz;
        if (Array.isArray(q)) return acc + q.length;
        return acc;
      }, 0);

      const quizFromVoice = safeVoice.reduce((acc: number, vn: any) => {
        const q = vn?.quiz;
        if (Array.isArray(q)) return acc + q.length;
        return acc;
      }, 0);

      const totalQuiz = quizFromNotes + quizFromVoice;
      setQuizCount(totalQuiz);

      // Recent quizzes: take first quiz item from any notes/voice notes
      const quizItems: any[] = [];
      for (const n of safeNotes) {
        if (Array.isArray(n?.quiz)) {
          for (const qi of n.quiz) quizItems.push({ ...qi, source: "note" });
        }
      }
      for (const vn of safeVoice) {
        if (Array.isArray(vn?.quiz)) {
          for (const qi of vn.quiz) quizItems.push({ ...qi, source: "voice" });
        }
      }
      setRecentQuizzes(quizItems.slice(0, 5));

      // Planner stats: tasks + reminders + total study hours.
      const [tasks, reminders, stats] = await Promise.all([
        getTasks(userId),
        getReminders(userId),
        getStats(userId),
      ]);

      const safeTasks = Array.isArray(tasks) ? tasks : [];
      const safeReminders = Array.isArray(reminders) ? reminders : [];

      setTasksCount(safeTasks.length);
      setRemindersCount(safeReminders.length);
      setRecentTasks(safeTasks.slice(0, 5));
      setRecentReminders(safeReminders.slice(0, 5));

      // Study hours:
      // plannerService.getStats returns completedPomodoroSessions but not minutes total.
      // We'll compute study minutes by loading timer history indirectly is not available via plannerService in current architecture.
      // Fallback: use completedPomodoroSessions * 25 minutes.
      // Keep it derived from server-provided stats.
      const completedSessions = stats?.completedPomodoroSessions ?? 0;
      const assumedMinutesPerSession = 25;
      setStudyHoursMinutes(completedSessions * assumedMinutesPerSession);
    } catch (e: any) {
      setDashboardError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const onSaveProfile = async () => {
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in again to save your profile.");
      return;
    }

    setProfileError(null);
    setProfileLoading(true);

    try {
      // Validate photo URL: if empty, treat as unset.
      const trimmedPhoto = (draftPhotoUrl || "").trim();
      const photoURL = trimmedPhoto ? trimmedPhoto : undefined;

      await saveUserProfile({
        uid: user.uid,
        name: draftName,
        photoURL,
      });

      // Refresh UI immediately (dashboard + profile fields)
      await refreshDashboard();

      try {
        const u = await getUserProfile(user.uid);
        setDraftName(u?.name || user?.displayName || "");
        setDraftPhotoUrl(u?.photoURL || user?.photoURL || "");
      } catch (e: any) {
        // If the doc still isn't visible immediately, don't leave UI stuck.
        // The save already succeeded, so just keep draft values.
        console.warn("Profile saved, but profile doc could not be reloaded yet:", e);
      }

      Alert.alert("Profile updated", "Your profile changes have been saved.");
    } catch (e: any) {
      setProfileError(e?.message || "Failed to update profile");
    } finally {
      // Guarantee spinner reset.
      setProfileLoading(false);
    }
  };


  const onSavePrefs = async (next: Preferences) => {
    setPrefsState(next);
    try {
      await savePrefs(next);
    } catch {
      // ignore
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    Alert.alert("Logout", "Are you sure you want to logout?", [

      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);

            // Securely clear session + cached user profile
            await signOut(auth);
            await clearAuthStorage();

            // Clear any cached preferences/user state
            setDraftName("");
            setDraftPhotoUrl("");

            // Redirect
            router.replace("/auth" as any);
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to logout");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (authLoading) {
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {draftPhotoUrl || user?.photoURL ? (
                <Image
                  source={{ uri: draftPhotoUrl || user?.photoURL || "" }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.placeholderText}>
                    {initialsFromName(draftName || user?.displayName)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || draftName || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>

              <Text style={styles.joinedDate}>
                Joined{"\n"}
                {"—"}
              </Text>
            </View>
          </View>

          {/* Skeleton stats while loading */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>

            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <BookMarked size={24} color={COLORS.primary} />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{notesCount}</Text>
                )}
                <Text style={styles.statLabel}>Notes</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Award size={24} color={COLORS.secondary} />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{quizCount}</Text>
                )}
                <Text style={styles.statLabel}>Quizzes</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Clock size={24} color="#10B981" />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{formatStudyHoursFromMinutes(studyHoursMinutes)}</Text>
                )}
                <Text style={styles.statLabel}>Study Hours</Text>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <FileText size={24} color={COLORS.primary} />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{pdfCount}</Text>
                )}
                <Text style={styles.statLabel}>PDF Summaries</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Mic size={24} color={COLORS.secondary} />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{voiceCount}</Text>
                )}
                <Text style={styles.statLabel}>Voice Notes</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <ClipboardList size={24} color="#F97316" />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{tasksCount}</Text>
                )}
                <Text style={styles.statLabel}>Study Tasks</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Bell size={24} color="#7C3AED" />
                </View>
                {loadingDashboard ? (
                  <Text style={styles.statValue}>...</Text>
                ) : (
                  <Text style={styles.statValue}>{remindersCount}</Text>
                )}
                <Text style={styles.statLabel}>Reminders</Text>
              </Card>
            </View>

            {dashboardError ? (
              <Text style={{ marginTop: SPACING.md, color: COLORS.error, ...TYPOGRAPHY.body }}>
                {dashboardError}
              </Text>
            ) : null}

            {!dashboardError && !loadingDashboard &&
            notesCount === 0 &&
            pdfCount === 0 &&
            voiceCount === 0 &&
            quizCount === 0 &&
            tasksCount === 0 &&
            remindersCount === 0 ? (
              <Text style={{ marginTop: SPACING.md, ...TYPOGRAPHY.body, color: TEXT_COLORS.tertiary }}>
                No activity yet. Start creating notes, summarizing PDFs, or using the study planner.
              </Text>
            ) : null}
          </View>

          {/* Activity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>

            {loadingDashboard ? (
              <View>
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: TEXT_COLORS.tertiary }}>Loading activity…</Text>
              </View>
            ) : (
              <View>
                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Recent Notes</Text>
                  {recentNotes.length ? (
                    recentNotes.map((n) => (
                      <View key={n.id} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {n.title || "Untitled"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No notes yet.</Text>
                  )}
                </Card>

                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Recent PDFs</Text>
                  {recentPdfs.length ? (
                    recentPdfs.map((p) => (
                      <View key={p.id} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {p.fileName || "PDF"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No PDF summaries yet.</Text>
                  )}
                </Card>

                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Recent Voice Notes</Text>
                  {recentVoiceNotes.length ? (
                    recentVoiceNotes.map((v) => (
                      <View key={v.id || v._id} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {v.title || "Voice Note"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No voice notes yet.</Text>
                  )}
                </Card>

                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Recent Quizzes</Text>
                  {recentQuizzes.length ? (
                    recentQuizzes.map((q, idx) => (
                      <View key={`${q.source}-${idx}`} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {q.question || "Quiz"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No quizzes yet.</Text>
                  )}
                </Card>

                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Study Tasks</Text>
                  {recentTasks.length ? (
                    recentTasks.map((t) => (
                      <View key={t.id} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {t.title || "Task"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No study tasks yet.</Text>
                  )}
                </Card>

                <Card style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Exam Reminders</Text>
                  {recentReminders.length ? (
                    recentReminders.map((r) => (
                      <View key={r.id} style={styles.activityRow}>
                        <Text style={styles.activityPrimaryText} numberOfLines={1}>
                          {r.examTitle || "Reminder"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.activityEmptyText}>No reminders yet.</Text>
                  )}
                </Card>
              </View>
            )}
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

            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Joined</Text>
                  <Text style={styles.infoValue}>—</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Settings/Profile Edit */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Edit2 size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Your name"
                  placeholderTextColor={TEXT_COLORS.tertiary}
                  style={styles.input}
                />

                <Text style={styles.formLabel}>Profile Image URL</Text>
                <TextInput
                  value={draftPhotoUrl}
                  onChangeText={setDraftPhotoUrl}
                  placeholder="https://..."
                  placeholderTextColor={TEXT_COLORS.tertiary}
                  style={styles.input}
                />

                {profileError ? (
                  <Text style={{ color: COLORS.error, ...TYPOGRAPHY.caption }}>{profileError}</Text>
                ) : null}

                <Button
                  title={profileLoading ? "Saving…" : "Save"}
                  onPress={onSaveProfile}
                  loading={profileLoading}
                  disabled={profileLoading}
                  variant="outline"
                  fullWidth
                  style={styles.saveButton}
                  textStyle={{ color: COLORS.primary }}
                />
              </View>
            </Card>

            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Settings size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.settingText}>Preferences</Text>
              </View>

              <View style={styles.prefs}>
                <PreferenceToggle
                  label="Dark Mode"
                  value={prefs.darkMode}
                  onToggle={(v) => onSavePrefs({ ...prefs, darkMode: v })}
                />

                <PreferenceToggle
                  label="Notifications"
                  value={prefs.notifications}
                  onToggle={(v) => onSavePrefs({ ...prefs, notifications: v })}
                />

                <PreferenceToggle
                  label="Study Reminders"
                  value={prefs.studyReminders}
                  onToggle={(v) => onSavePrefs({ ...prefs, studyReminders: v })}
                />
              </View>

              {prefsError ? (
                <Text style={{ color: COLORS.error, ...TYPOGRAPHY.caption, marginTop: SPACING.sm }}>
                  {prefsError}
                </Text>
              ) : null}
            </Card>
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
  avatarContainer: {
    marginRight: SPACING.lg,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
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
    flexWrap: "wrap" as any,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
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
    marginBottom: SPACING.md,
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
  saveButton: {
    marginTop: SPACING.md,
    borderRadius: 12,
  },
  form: {
    marginTop: SPACING.md,
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
  prefs: {
    marginTop: SPACING.md,
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
  activityCard: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  activityTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  activityRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  activityPrimaryText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
  },
  activityEmptyText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.tertiary,
  },
});

