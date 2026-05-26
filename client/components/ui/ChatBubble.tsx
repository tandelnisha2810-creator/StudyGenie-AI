/**
 * ChatBubble Component
 * Message bubble for chat UI
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  style?: ViewStyle;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        style,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.message,
            isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message}
        </Text>
      </View>
      {timestamp && (
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.aiTimestamp,
          ]}
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </View>
  );
};

/**
 * Typing Indicator Component
 * Shows AI is typing
 */
export const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingDot, styles.typingDot1]} />
      <View style={[styles.typingDot, styles.typingDot2]} />
      <View style={[styles.typingDot, styles.typingDot3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  aiContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.xs,
  },
  aiBubble: {
    backgroundColor: COLORS.gray100,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
  },
  message: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  aiText: {
    color: TEXT_COLORS.primary,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    color: TEXT_COLORS.tertiary,
  },
  userTimestamp: {
    marginRight: SPACING.sm,
  },
  aiTimestamp: {
    marginLeft: SPACING.sm,
  },
  typingContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    width: 60,
    justifyContent: "center",
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.gray400,
  },
  typingDot1: {
    opacity: 0.3,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 1,
  },
});
