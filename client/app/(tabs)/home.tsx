/**
 * Home Screen
 * Main dashboard with gradient header, welcome section, and feature cards
 */

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import {
  Brain,
  Zap,
  BookMarked,
  MessageSquare,
  TrendingUp,
} from "lucide-react-native";

interface ActivityItem {
  id: string;
  title: string;
  time: string;
}

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: "1",
      title: "Started AI Chat Session",
      time: "2 hours ago",
    },
    {
      id: "2",
      title: "Generated Quiz on Mathematics",
      time: "Yesterday",
    },
    {
      id: "3",
      title: "Saved 3 Study Notes",
      time: "2 days ago",
    },
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const features = [
    {
      id: "1",
      title: "AI Notes Generator",
      description: "Create comprehensive notes with AI",
      icon: <Brain size={32} color={COLORS.white} />,
      color: COLORS.primary,
    },
    {
      id: "2",
      title: "Quiz AI",
      description: "Generate quiz questions instantly",
      icon: <Zap size={32} color={COLORS.white} />,
      color: COLORS.secondary,
    },
    {
      id: "3",
      title: "Study Planner",
      description: "Plan your study schedule",
      icon: <BookMarked size={32} color={COLORS.white} />,
      color: "#10B981",
    },
    {
      id: "4",
      title: "AI Chatbot",
      description: "Chat with AI assistant",
      icon: <MessageSquare size={32} color={COLORS.white} />,
      color: "#F59E0B",
    },
  ];

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Gradient Header */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.displayName || "Student"}</Text>
          <Text style={styles.subtitle}>
            Ready to boost your learning today?
          </Text>
        </LinearGradient>

        {/* AI Study Assistant Card */}
        <View style={styles.section}>
          <Card
            variant="gradient"
            style={styles.aiCard}
          >
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiCardGradient}
            >
              <View style={styles.aiCardContent}>
                <Text style={styles.aiCardTitle}>Your AI Study Assistant</Text>
                <Text style={styles.aiCardDescription}>
                  Get instant help with concepts, generate quizzes, and summarize
                  your notes
                </Text>
                <Button
                  title="Start Chat"
                  onPress={() => {}}
                  variant="outline"
                  size="small"
                  style={styles.aiCardButton}
                  textStyle={{ color: COLORS.white }}
                />
              </View>
            </LinearGradient>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {features.map((feature) => (
              <Card
                key={feature.id}
                style={[styles.featureCard, { borderLeftWidth: 4, borderLeftColor: feature.color }]}
                onPress={() => {}}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: feature.color + "20" },
                  ]}
                >
                  {feature.icon}
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TrendingUp size={24} color={COLORS.primary} />
          </View>
          {activity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIndicator} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Notes Created</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Quizzes Taken</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>8h</Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </Card>
          </View>
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
  header: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    opacity: 0.85,
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
  aiCard: {
    padding: 0,
    overflow: "hidden",
  },
  aiCardGradient: {
    padding: SPACING.xxl,
  },
  aiCardContent: {},
  aiCardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  aiCardDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  aiCardButton: {
    borderColor: COLORS.white,
    borderWidth: 2,
    alignSelf: "flex-start",
  },
  actionsGrid: {
    gap: SPACING.lg,
  },
  featureCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  activityIndicator: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.lg,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    textAlign: "center",
  },
});
