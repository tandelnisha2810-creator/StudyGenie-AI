import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  Clock3,
  FileText,
  Mic,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";
import { getNotes as apiGetNotes } from "@/services/noteService";
import { getVoiceNotes } from "@/services/voiceService";
import { getTasks, getReminders } from "@/services/plannerService";
import { getPdfNotes } from "@/services/pdfService";

type QuickCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  accent: [string, string];
};

type ActivityItem = {
  id: string;
  label: string;
  timestamp: number;
  icon: React.ReactNode;
};

function safeName(name: string | undefined | null) {
  const s = (name ?? "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0];
}

function asTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notesCount, setNotesCount] = useState(0);
  const [voiceNotesCount, setVoiceNotesCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [remindersCount, setRemindersCount] = useState(0);
  const [pdfCount, setPdfCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);

  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const userId = user?.uid;
  const displayName = safeName((user as any)?.displayName);

  const quickCards: QuickCard[] = useMemo(
    () => [
      {
        title: "AI Notes",
        description: "Generate study notes instantly",
        icon: <BookOpen size={22} color="#4F46E5" />,
        route: "/notes",
        accent: ["rgba(79,70,229,0.14)", "rgba(124,58,237,0.14)"],
      },
      {
        title: "Quiz AI",
        description: "Practice with AI-generated quizzes",
        icon: <Sparkles size={22} color="#7C3AED" />,
        route: "/notes",
        accent: ["rgba(124,58,237,0.14)", "rgba(79,70,229,0.14)"],
      },
      {
        title: "Study Planner",
        description: "Plan tasks & reminders",
        icon: <CalendarDays size={22} color="#0EA5E9" />,
        route: "/study-planner",
        accent: ["rgba(14,165,233,0.14)", "rgba(79,70,229,0.12)"],
      },
      {
        title: "AI Chat",
        description: "Ask your AI tutor questions",
        icon: <Bot size={22} color="#10B981" />,
        route: "/chat",
        accent: ["rgba(16,185,129,0.14)", "rgba(14,165,233,0.12)"],
      },
      {
        title: "Voice Notes",
        description: "Record & study from transcripts",
        icon: <Mic size={22} color="#7C3AED" />,
        route: "/voice-notes",
        accent: ["rgba(124,58,237,0.14)", "rgba(16,185,129,0.10)"],
      },
      {
        title: "PDF AI",
        description: "Summarize PDFs with AI",
        icon: <FileText size={22} color="#4F46E5" />,
        route: "/pdf-ai",
        accent: ["rgba(79,70,229,0.14)", "rgba(124,58,237,0.14)"],
      },
    ],
    []
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError(null);
      setRecentActivity([]);
      setNotesCount(0);
      setVoiceNotesCount(0);
      setTasksCount(0);
      setPendingTasksCount(0);
      setRemindersCount(0);
      setPdfCount(0);
      setQuizzesCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [notes, voiceNotes, tasks, reminders, pdfNotes] = await Promise.all([
        apiGetNotes(userId),
        getVoiceNotes(undefined, userId),
        getTasks(userId),
        getReminders(userId),
        getPdfNotes(userId),
      ]);

      const notesArr = Array.isArray(notes) ? notes : [];
      const voiceArr = Array.isArray(voiceNotes) ? (voiceNotes as any[]) : [];
      const tasksArr = Array.isArray(tasks) ? tasks : [];
      const remindersArr = Array.isArray(reminders) ? reminders : [];
      const pdfArr = Array.isArray(pdfNotes) ? (pdfNotes as any[]) : [];

      setNotesCount(notesArr.length);
      setVoiceNotesCount(voiceArr.length);
      setTasksCount(tasksArr.length);
      setPendingTasksCount(tasksArr.filter((t: any) => !t.completed).length);
      setRemindersCount(remindersArr.length);
      setPdfCount(pdfArr.length);

      // Quiz count heuristic: tasks/reminders don't have quizzes; notes/voice notes may have quiz fields
      const noteQuizReady = notesArr.filter((n: any) => Array.isArray(n.quiz) && n.quiz.length > 0)
        .length;
      const voiceQuizReady = voiceArr.filter((n: any) => Array.isArray(n.quiz) && n.quiz.length > 0)
        .length;
      setQuizzesCount(noteQuizReady + voiceQuizReady);

      const activities: ActivityItem[] = [];

      // Notes activity
      for (const n of notesArr.slice(0, 200)) {
        const ts = asTimestamp((n as any).updatedAt ?? (n as any).createdAt);
        if (!ts) continue;
        activities.push({
          id: `note-${(n as any).id ?? (n as any)._id ?? ts}`,
          label: `Created Note: ${(n as any).title ? String((n as any).title) : "Note"}`,
          timestamp: ts,
          icon: <BookOpen size={18} color="#4F46E5" />,
        });
      }

      // Voice notes activity
      for (const v of voiceArr.slice(0, 200)) {
        const ts = asTimestamp((v as any).createdAt ?? (v as any).updatedAt);
        if (!ts) continue;
        activities.push({
          id: `voice-${(v as any).id ?? (v as any)._id ?? ts}`,
          label: `Added Voice Note: ${(v as any).title ? String((v as any).title) : "Voice"}`,
          timestamp: ts,
          icon: <Mic size={18} color="#7C3AED" />,
        });
      }

      // Planner activity (tasks + reminders)
      for (const t of tasksArr.slice(0, 200)) {
        const ts = asTimestamp((t as any).updatedAt ?? (t as any).createdAt);
        if (!ts) continue;
        activities.push({
          id: `task-${(t as any).id ?? (t as any)._id ?? ts}`,
          label: `Added Study Task: ${(t as any).title ? String((t as any).title) : "Task"}`,
          timestamp: ts,
          icon: <Clock3 size={18} color="#0EA5E9" />,
        });
      }

      for (const r of remindersArr.slice(0, 200)) {
        const ts = asTimestamp((r as any).updatedAt ?? (r as any).createdAt);
        if (!ts) continue;
        activities.push({
          id: `rem-${(r as any).id ?? (r as any)._id ?? ts}`,
          label: `Added Exam Reminder: ${(r as any).examTitle ? String((r as any).examTitle) : "Exam"}`,
          timestamp: ts,
          icon: <CalendarDays size={18} color="#7C3AED" />,
        });
      }

      // PDF activity
      for (const p of pdfArr.slice(0, 200)) {
        const ts = asTimestamp((p as any).uploadDate ?? (p as any).createdAt ?? (p as any).updatedAt);
        if (!ts) continue;
        activities.push({
          id: `pdf-${(p as any).id ?? (p as any)._id ?? ts}`,
          label: `Generated PDF Summary: ${(p as any).fileName ? String((p as any).fileName) : "PDF"}`,
          timestamp: ts,
          icon: <FileText size={18} color="#4F46E5" />,
        });
      }

      // Quiz activity heuristic (notes + voice)
      // We'll add up to 10 quiz events
      const quizEvents: ActivityItem[] = [];
      for (const n of notesArr.slice(0, 200)) {
        const quiz = (n as any).quiz;
        if (Array.isArray(quiz) && quiz.length > 0) {
          const ts = asTimestamp((n as any).updatedAt ?? (n as any).createdAt);
          if (!ts) continue;
          quizEvents.push({
            id: `quiz-note-${(n as any).id ?? (n as any)._id ?? ts}`,
            label: `Generated Quiz from Notes: ${(n as any).title ? String((n as any).title) : "Quiz"}`,
            timestamp: ts,
            icon: <Sparkles size={18} color="#7C3AED" />,
          });
        }
      }
      for (const v of voiceArr.slice(0, 200)) {
        const quiz = (v as any).quiz;
        if (Array.isArray(quiz) && quiz.length > 0) {
          const ts = asTimestamp((v as any).updatedAt ?? (v as any).createdAt);
          if (!ts) continue;
          quizEvents.push({
            id: `quiz-voice-${(v as any).id ?? (v as any)._id ?? ts}`,
            label: `Generated Quiz from Voice: ${(v as any).title ? String((v as any).title) : "Quiz"}`,
            timestamp: ts,
            icon: <Sparkles size={18} color="#7C3AED" />,
          });
        }
      }

      activities.push(...quizEvents.slice(0, 50));

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 10));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading) {
      void refresh();
    }
  }, [authLoading, refresh]);

  const formatRelativeTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  if (authLoading || loading) {
    return (
      <AuthGuard>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.hero}>
          <Text style={styles.heroGreeting}>Welcome back, {displayName}</Text>
          <Text style={styles.heroTitle}>Today’s Overview</Text>

          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Clock3 size={18} color="#4F46E5" />
              <Text style={styles.miniValue}>{pendingTasksCount}</Text>
              <Text style={styles.miniLabel}>Pending Tasks</Text>
            </View>
            <View style={styles.miniStat}>
              <CalendarDays size={18} color="#7C3AED" />
              <Text style={styles.miniValue}>{remindersCount}</Text>
              <Text style={styles.miniLabel}>Exam Reminders</Text>
            </View>
            <View style={styles.miniStat}>
              <BookOpen size={18} color="#4F46E5" />
              <Text style={styles.miniValue}>{notesCount}</Text>
              <Text style={styles.miniLabel}>Notes</Text>
            </View>
            <View style={styles.miniStat}>
              <Mic size={18} color="#10B981" />
              <Text style={styles.miniValue}>{voiceNotesCount}</Text>
              <Text style={styles.miniLabel}>Voice Notes</Text>
            </View>
          </View>
        </LinearGradient>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickCards.map((c) => (
            <Pressable
              key={c.title}
              onPress={() => {
                router.push(c.route as any);
              }}
              style={({ pressed }) => [
                styles.quickCard,
                { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <LinearGradient colors={c.accent} style={styles.quickCardBg}>
                <View style={styles.quickCardIcon}>{c.icon}</View>
                <View style={styles.quickCardText}>
                  <Text style={styles.quickCardTitle}>{c.title}</Text>
                  <Text style={styles.quickCardDesc}>{c.description}</Text>
                </View>
                <View style={styles.quickArrow}>
                  <ArrowRight size={18} color="#111827" />
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* ANALYTICS */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Analytics</Text>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{notesCount}</Text>
            <Text style={styles.analyticsLabel}>Notes</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{voiceNotesCount}</Text>
            <Text style={styles.analyticsLabel}>Voice Notes</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{tasksCount}</Text>
            <Text style={styles.analyticsLabel}>Tasks</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{remindersCount}</Text>
            <Text style={styles.analyticsLabel}>Reminders</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{pdfCount}</Text>
            <Text style={styles.analyticsLabel}>PDFs</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{quizzesCount}</Text>
            <Text style={styles.analyticsLabel}>Quizzes</Text>
          </View>
        </View>

        {/* RECENT ACTIVITY */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Recent Activity</Text>

        {recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Brain size={22} color="#4F46E5" />
            </View>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyDesc}>Create notes, voice notes, tasks, reminders, or PDFs to see updates here.</Text>
          </View>
        ) : (
          recentActivity.map((a) => (
            <View key={a.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>{a.icon}</View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {a.label}
                </Text>
                <Text style={styles.activitySub}>{formatRelativeTime(a.timestamp)}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',
  },

  hero: {
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  heroGreeting: {
    color: '#E0E7FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
  },

  miniStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  miniStat: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 10,
  },

  miniLabel: {
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
  },

  sectionHeaderRow: {
    paddingHorizontal: 18,
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  quickGrid: {
    paddingHorizontal: 18,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  quickCard: {
    width: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(15,23,42,0.10)',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  quickCardBg: {
    padding: 14,
    minHeight: 92,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quickCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickCardText: {
    flex: 1,
    marginLeft: 10,
  },

  quickCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  quickCardDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },

  quickArrow: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  analyticsRow: {
    paddingHorizontal: 18,
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  analyticsCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },

  analyticsValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  analyticsLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },

  emptyState: {
    marginHorizontal: 18,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    alignItems: 'center',
  },

  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(79,70,229,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  emptyDesc: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  activityCard: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(79,70,229,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },

  activitySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
});
