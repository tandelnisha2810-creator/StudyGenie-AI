/**
 * Card Component
 * Reusable card component with consistent styling
 */

import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from "react-native";
import { COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS, SHADOW } from "../../utils/spacing";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: "default" | "gradient" | "outlined";
  shadow?: "sm" | "md" | "lg" | "none";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = "default",
  shadow = "md",
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      overflow: "hidden",
    };

    const variantStyles = {
      default: {
        backgroundColor: COLORS.white,
      },
      gradient: {
        backgroundColor: COLORS.primaryLight,
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: COLORS.gray200,
      },
    };

    const shadowStyles = shadow !== "none" ? SHADOW[shadow as "sm" | "md" | "lg"] : {};

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...shadowStyles,
    };
  };

  const Component = onPress ? Pressable : View;

  return (
    <Component
      style={[getCardStyle(), style]}
      onPress={onPress}
      {...(onPress && { android_ripple: { color: COLORS.gray200 } })}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {},
});
