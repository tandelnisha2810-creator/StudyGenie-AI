/**
 * Header Component
 * Reusable header with gradient background
 */

import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  style?: ViewStyle;
  withGradient?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  action,
  style,
  withGradient = true,
}) => {
  const headerContent = (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );

  if (withGradient) {
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return <View style={[styles.gradientFallback, style]}>{headerContent}</View>;
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  gradientFallback: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    opacity: 0.9,
  },
  action: {
    marginLeft: SPACING.lg,
  },
});
