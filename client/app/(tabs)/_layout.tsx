/**
 * Tabs Layout
 * Bottom tab navigation with modern design
 */

import React from "react";
import { Tabs } from "expo-router";
import { COLORS } from "@/utils/colors";
import { SPACING } from "@/utils/spacing";
import { Home, MessageCircle, BookOpen, User, FileText } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray100,
          borderTopWidth: 1,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          height: 70,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: SPACING.xs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Home size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => (
            <MessageCircle size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color }) => (
            <BookOpen size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="pdf-ai"
        options={{
          title: "PDF AI",
          tabBarIcon: ({ color }) => (
            <FileText size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
