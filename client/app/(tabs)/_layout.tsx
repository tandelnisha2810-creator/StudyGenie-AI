/**
 * Tabs Layout
 * Bottom tab navigation with modern design
 */

import React from "react";
import { Tabs } from "expo-router";
import { COLORS } from "@/utils/colors";
import { SPACING } from "@/utils/spacing";
import { Ionicons } from "@expo/vector-icons";

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
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pdf-ai"
        options={{
          title: "PDF AI",
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice-notes"
        options={{
          title: "Voice Notes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study-planner"
        options={{
          title: "Study Planner",
          tabBarIcon: ({ color }) => (
            <Ionicons name="timer" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
