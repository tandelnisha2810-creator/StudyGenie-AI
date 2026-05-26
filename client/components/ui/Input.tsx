/**
 * Input Component
 * Reusable text input field
 */

import React, { useState } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS, SHADOW } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  containerStyle,
  label,
  error,
  icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.container,
          isFocused && styles.focused,
          error && styles.errorBorder,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : undefined]}
          placeholderTextColor={COLORS.gray400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// Re-export Text for error message
import { Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  focused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: TEXT_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: 0,
  },
  inputWithIcon: {
    paddingHorizontal: SPACING.md,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
