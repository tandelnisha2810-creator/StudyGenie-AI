/**
 * Button Component
 * Reusable button component with multiple variants
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BORDER_RADIUS.lg,
      gap: SPACING.sm,
    };

    const sizeStyles = {
      small: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
      },
      medium: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
      },
      large: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xxl,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? COLORS.gray300 : COLORS.primary,
      },
      secondary: {
        backgroundColor: disabled ? COLORS.gray200 : COLORS.secondary,
      },
      outline: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: disabled ? COLORS.gray300 : COLORS.primary,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? "100%" : "auto",
    };
  };

  const getTextStyle = (): TextStyle => {
    const variantTextColors = {
      primary: COLORS.white,
      secondary: COLORS.white,
      outline: COLORS.primary,
      ghost: COLORS.primary,
    };

    return {
      ...TYPOGRAPHY.button,
      color: disabled ? COLORS.gray500 : variantTextColors[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={() => {
        try {
          console.log("Button pressed:", title);
        } catch (e) {}
        onPress && onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "secondary" ? COLORS.white : COLORS.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
