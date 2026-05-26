/**
 * AI Chat Screen
 * Interactive chat with Gemini AI for studying
 */

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatBubble, TypingIndicator } from "@/components/ui/ChatBubble";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import {
  sendMessageToGemini,
  generateQuiz,
  summarizeNotes,
  explainConcept,
  solveDoubt,
} from "@/services/gemini";
import { Send, Lightbulb } from "lucide-react-native";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type ChatMode = "general" | "quiz" | "summarize" | "explain" | "doubt";

export default function ChatScreen() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! 👋 I'm your AI Study Assistant. I can help you with:\n\n• Explaining concepts\n• Generating quizzes\n• Summarizing notes\n• Solving doubts\n\nWhat can I help you with today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = async (message: string, mode: ChatMode) => {
    try {
      console.log("Requesting AI response", { mode, message });
      let response = "";

      switch (mode) {
        case "quiz":
          response = await generateQuiz(message, 5);
          break;
        case "summarize":
          response = await summarizeNotes(message);
          break;
        case "explain":
          response = await explainConcept(message, "intermediate");
          break;
        case "doubt":
          response = await solveDoubt(message);
          break;
        default:
          response = await sendMessageToGemini(message);
      }

      console.log("Received AI response from service:", response);
      return response;
    } catch (error) {
      console.error("Error getting AI response:", error);
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Sorry, I encountered an error. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Detect mode from user input
      let mode: ChatMode = "general";
      if (
        userMessage.toLowerCase().includes("quiz") ||
        userMessage.toLowerCase().includes("question")
      ) {
        mode = "quiz";
      } else if (
        userMessage.toLowerCase().includes("summarize") ||
        userMessage.toLowerCase().includes("summary")
      ) {
        mode = "summarize";
      } else if (
        userMessage.toLowerCase().includes("explain") ||
        userMessage.toLowerCase().includes("what is")
      ) {
        mode = "explain";
      } else if (
        userMessage.toLowerCase().includes("doubt") ||
        userMessage.toLowerCase().includes("problem") ||
        userMessage.toLowerCase().includes("solve")
      ) {
        mode = "doubt";
      }

      const aiResponse = await getAIResponse(userMessage, mode);
      console.log("Parsed message used for assistant bubble:", aiResponse);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Study Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Chat with your personal AI tutor
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <Button
                title="📝 Explain Concept"
                onPress={() => setInput("Explain ")}
                variant="outline"
                size="small"
              />
            </View>
            <View style={styles.quickAction}>
              <Button
                title="❓ Generate Quiz"
                onPress={() => setInput("Generate quiz on ")}
                variant="outline"
                size="small"
              />
            </View>
            <View style={styles.quickAction}>
              <Button
                title="📄 Summarize Notes"
                onPress={() => setInput("Summarize: ")}
                variant="outline"
                size="small"
              />
            </View>
            <View style={styles.quickAction}>
              <Button
                title="🤔 Solve Doubt"
                onPress={() => setInput("Help me with: ")}
                variant="outline"
                size="small"
              />
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Ask me anything about your studies..."
              value={input}
              onChangeText={setInput}
              editable={!isLoading}
              multiline
              containerStyle={styles.inputContainer}
            />
            <Button
              title=""
              onPress={handleSendMessage}
              disabled={!input.trim() || isLoading}
              icon={<Send size={20} color={COLORS.white} />}
              style={styles.sendButton}
            />
          </View>
          <Text style={styles.disclaimer}>
            <Lightbulb size={12} color={COLORS.warning} /> Tip: Ask questions
            about concepts, generate quizzes, or get help with doubts!
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.lg,
  },
  typingContainer: {
    alignItems: "flex-start",
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  quickActions: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  quickAction: {
    marginVertical: SPACING.xs,
  },
  inputArea: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  inputContainer: {
    marginBottom: SPACING.sm,
    maxHeight: 100,
  },
  inputWrapper: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "flex-end",
    marginBottom: SPACING.md,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    paddingHorizontal: 0,
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.tertiary,
    fontStyle: "italic",
  },
});
