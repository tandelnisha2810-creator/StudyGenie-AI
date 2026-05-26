/**
 * NoteModal Component
 * Modal editor for creating and updating study notes.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "../utils/colors";
import { SPACING, BORDER_RADIUS } from "../utils/spacing";
import { TYPOGRAPHY } from "../utils/typography";

export interface NoteDraft {
  title: string;
  content: string;
  subject: string;
  tags: string;
  summary?: string;
  color?: string;
}

interface NoteModalProps {
  visible: boolean;
  isSaving: boolean;
  isEditing: boolean;
  draft: NoteDraft;
  errorMessage?: string;
  subjects: string[];
  onClose: () => void;
  onSave: () => Promise<void>;
  onDraftChange: (field: keyof NoteDraft, value: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  visible,
  isSaving,
  isEditing,
  draft,
  errorMessage,
  subjects,
  onClose,
  onSave,
  onDraftChange,
}) => {
  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    if (!visible) {
      setLocalError("");
    }
  }, [visible]);

  const validateForm = (): boolean => {
    if (!draft.title?.trim()) {
      setLocalError("Please enter a note title");
      return false;
    }
    if (!draft.content?.trim()) {
      setLocalError("Please enter note content");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleCreatePress = async () => {
    console.log("🔵 NoteModal.handleCreatePress - clicked");

    if (!validateForm()) {
      console.log("❌ Form validation failed", {
        title: draft.title,
        content: draft.content,
        subject: draft.subject,
        tags: draft.tags,
      });
      return;
    }

    const noteData = {
      title: draft.title,
      subject: draft.subject,
      tags: draft.tags,
      content: draft.content,
      color: draft.color || "yellow",
    };

    console.log("📝 NoteModal submitting note data:", noteData);

    try {
      await onSave();
      console.log("✅ NoteModal.onSave completed successfully");
    } catch (err) {
      console.error("❌ NoteModal.handleCreatePress error:", err);
      setLocalError(
        err instanceof Error ? err.message : "Failed to save note. Please try again."
      );
    }
  };

  const colorOptions = ["yellow", "blue", "green", "pink", "purple"];
  const currentColor = draft.color || "yellow";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Note" : "Create New Note"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Save study notes, organize by subject, and add tags.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <Input
              placeholder="Note Title"
              value={draft.title}
              onChangeText={(value) => onDraftChange("title", value)}
              containerStyle={styles.field}
              placeholderTextColor={COLORS.gray400}
            />

            {/* Subject Dropdown */}
            <View style={styles.field}>
              <Text style={styles.label}>Subject</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subjectScroll}
              >
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectChip,
                      draft.subject === subject && styles.subjectChipActive,
                    ]}
                    onPress={() => onDraftChange("subject", subject)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        draft.subject === subject &&
                          styles.subjectChipTextActive,
                      ]}
                    >
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Note Color</Text>
              <View style={styles.colorRow}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: getColorValue(color) },
                      currentColor === color && styles.colorDotSelected,
                    ]}
                    onPress={() => onDraftChange("color", color)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>

            {/* Tags Input */}
            <Input
              placeholder="Tags (comma-separated, e.g. React, Hooks, State)"
              value={draft.tags}
              onChangeText={(value) => onDraftChange("tags", value)}
              containerStyle={styles.field}
              placeholderTextColor={COLORS.gray400}
            />

            {/* Content Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Note Content</Text>
              <Input
                placeholder="Write your study notes here..."
                value={draft.content}
                onChangeText={(value) => onDraftChange("content", value)}
                multiline
                numberOfLines={8}
                containerStyle={styles.textArea}
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            {/* Summary Display */}
            {draft.summary ? (
              <View style={styles.summaryPanel}>
                <Text style={styles.summaryLabel}>✨ AI Summary</Text>
                <Text style={styles.summaryText}>{draft.summary}</Text>
              </View>
            ) : null}

            {/* Error Message */}
            {(errorMessage || localError) ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>❌ {errorMessage || localError}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                fullWidth
                style={styles.button}
              />
              <TouchableOpacity
                style={[
                  styles.createButton,
                  isSaving && styles.createButtonDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleCreatePress}
                disabled={isSaving}
              >
                <Text style={styles.createButtonText}>
                  {isSaving
                    ? "Saving..."
                    : isEditing
                    ? "Update Note"
                    : "Create Note"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Helper function to get color values
const getColorValue = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    yellow: "#FEF3C7",
    blue: "#DBEAFE",
    green: "#DCFCE7",
    pink: "#FBCFE8",
    purple: "#E9D5FF",
  };
  return colorMap[color] || "#FEF3C7";
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(13, 17, 32, 0.5)",
  },
  modalOverlayTouchable: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modalBackground: {
    width: "92%",
    maxWidth: 720,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    marginTop: SPACING.xs,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: TEXT_COLORS.primary,
    fontSize: 20,
  },
  modalBody: {
    paddingBottom: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  subjectScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  subjectChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.sm,
  },
  subjectChipActive: {
    backgroundColor: COLORS.primary,
  },
  subjectChipText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  subjectChipTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  colorDotSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  textArea: {
    minHeight: 160,
  },
  summaryPanel: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.secondaryLight,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  summaryText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
  createButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: "600",
  },
  errorContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.errorLight,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    textAlign: "center",
  },
});
