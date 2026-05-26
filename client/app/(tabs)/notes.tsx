 /**
 * Notes Screen
 * REST-backed modern Notes management using NoteCard and NoteModal
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COLORS, TEXT_COLORS } from "../../utils/colors";
import { SPACING, BORDER_RADIUS } from "../../utils/spacing";
import { TYPOGRAPHY } from "../../utils/typography";
import {
  getNotes as apiGetNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  summarizeNote as apiSummarizeNote,
} from "@/services/noteService";
import { NoteCard, NoteItem } from "@/components/NoteCard";
import { NoteModal, NoteDraft } from "@/components/NoteModal";

export default function NotesScreen() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusyId, setIsBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>({
    title: "",
    content: "",
    subject: "General",
    tags: "",
    summary: "",
    color: "yellow",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const [subjects] = useState<string[]>([
    "React",
    "JavaScript",
    "DSA",
    "DBMS",
    "OS",
    "CN",
    "General",
  ]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user?.uid) {
        loadNotes();
      } else {
        console.debug("NotesScreen: no user authenticated");
        setNotes([]);
        setFilteredNotes([]);
        setLoading(false);
      }
    }
  }, [user?.uid, authLoading]);

  // Filter notes based on search and subject
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    let results = notes.slice();

    if (q) {
      results = results.filter((note) => {
        return (
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          (note.subject || "").toLowerCase().includes(q) ||
          (note.tags || []).some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }

    if (selectedSubject) {
      results = results.filter((note) => note.subject === selectedSubject);
    }

    setFilteredNotes(results);
  }, [searchText, notes, selectedSubject]);

  const loadNotes = async () => {
    console.debug("🔵 NotesScreen.loadNotes: starting", { userId: user?.uid });
    try {
      setLoading(true);
      if (!user?.uid) {
        setNotes([]);
        return;
      }

      const userNotes = await apiGetNotes(user.uid);
      console.debug("✅ NotesScreen.loadNotes: got notes", {
        count: userNotes?.length,
      });

      const sortedNotes: NoteItem[] = (userNotes || []).slice();
      sortedNotes.sort((a: NoteItem, b: NoteItem) => {
        if (a.isPinned === b.isPinned) {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        return a.isPinned ? -1 : 1;
      });

      setNotes(sortedNotes);
      setErrorMessage("");
    } catch (error) {
      console.error("❌ NotesScreen.loadNotes error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to load notes";
      setErrorMessage(errorMsg);
      Alert.alert("Error", errorMsg);
      setNotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  const handleAddNote = () => {
    console.log("📝 handleAddNote clicked");
    setIsEditing(false);
    setDraft({
      title: "",
      content: "",
      subject: "General",
      tags: "",
      summary: "",
      color: "yellow",
    });
    setErrorMessage("");
    setModalVisible(true);
  };

  const handleEditNote = (note: NoteItem) => {
    console.log("✏️ handleEditNote:", note.id);
    setIsEditing(true);
    setDraft({
      title: note.title,
      content: note.content,
      subject: note.subject || "General",
      tags: (note.tags || []).join(", "),
      summary: note.summary || "",
      color: note.color || "yellow",
    });
    setErrorMessage("");
    setModalVisible(true);
    setIsBusyId(note.id);
  };

  const handleCreateNote = async () => {
    console.log("📝 handleCreateNote started");

    if (!draft.title?.trim()) {
      setErrorMessage("Please enter a note title");
      return;
    }

    if (!draft.content?.trim()) {
      setErrorMessage("Please enter note content");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      if (isEditing && isBusyId) {
        // Update existing note
        console.log("✏️ Updating note:", isBusyId);
        const updatedPayload = {
          title: draft.title,
          content: draft.content,
          subject: draft.subject,
          color: draft.color || "yellow",
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        };

        console.log("📌 Update payload:", updatedPayload);

        // Optimistic update
        setNotes((prev) =>
          prev.map((note) =>
            note.id === isBusyId
              ? { ...note, ...updatedPayload, tags: updatedPayload.tags }
              : note
          )
        );

        await apiUpdateNote(isBusyId, updatedPayload);
        console.log("✅ Note updated");
        Alert.alert("Success", "Note updated successfully");
      } else if (!user?.uid) {
        throw new Error("User is not signed in. Please login before creating notes.");
      } else {
        // Create new note
        console.log("➕ Creating new note");
        const payload = {
          userId: user.uid,
          title: draft.title,
          content: draft.content,
          subject: draft.subject,
          color: draft.color || "yellow",
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        };

        console.log("📦 API payload:", payload);

        const created = await apiCreateNote(payload);
        console.log("✅ Note created result:", created);

        if (!created || !created.id) {
          throw new Error("Note creation returned no valid note");
        }

        // Optimistic update - add to front
        setNotes((prev) => [created, ...prev]);
        setFilteredNotes((prev) =>
          selectedSubject && selectedSubject !== created.subject
            ? prev
            : [created, ...prev]
        );
        Alert.alert("Success", "Note created successfully");
      }

      setModalVisible(false);
      setIsBusyId(null);
      setDraft({
        title: "",
        content: "",
        subject: "General",
        tags: "",
        summary: "",
        color: "yellow",
      });
    } catch (error) {
      console.error("❌ handleCreateNote error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to save note";
      setErrorMessage(errorMsg);
      Alert.alert("Error", errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, mongoId?: string) => {
    console.log("🚀 handleDeleteNote called with:", id);
    const idToUse = id?.toString?.() || mongoId?.toString?.();
    const safeId = idToUse?.toString?.();
    if (!safeId) {
      console.error("❌ handleDeleteNote - invalid noteId:", { id, mongoId });
      Alert.alert("Error", "Invalid note id");
      return;
    }



    Alert.alert(
      "Are you sure you want to delete this note?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("🗑️ handleDeleteNote - deleting note id:", { id: safeId, type: typeof safeId });

            setIsBusyId(safeId);

            // Optimistic update: remove immediately from UI and local lists
            console.log("🗑️ Optimistically removing from UI:", { id: safeId });
            setNotes((prev) =>
              prev.filter(
                (note) => note.id !== safeId && (note as any)._id !== safeId
              )
            );
            setFilteredNotes((prev) =>
              prev.filter(
                (note) => note.id !== safeId && (note as any)._id !== safeId
              )
            );



            try {
              const resp = await apiDeleteNote(safeId);

              console.log("✅ apiDeleteNote returned:", resp);
              console.log("✅ handleDeleteNote - backend delete success");
              Alert.alert("Success", "Note deleted successfully");

              // Refresh in background to keep ordering/counters consistent
              loadNotes();
            } catch (error) {
              console.error("❌ handleDeleteNote error:", error);
              Alert.alert("Error", "Failed to delete note");
              await loadNotes();
            } finally {
              setIsBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = async (note: NoteItem) => {
    console.log("📌 Toggling pin:", note.id);
    setIsBusyId(note.id);
    try {
      const updated = { isPinned: !note.isPinned };
      // Optimistic update
      setNotes((prev) =>
        prev.map((item) => (item.id === note.id ? { ...item, ...updated } : item))
      );
      await apiUpdateNote(note.id, updated);
      console.log("✅ Pin toggled");
      loadNotes();
    } catch (error) {
      console.error("❌ handleTogglePin error:", error);
      await loadNotes();
    } finally {
      setIsBusyId(null);
    }
  };

  const handleToggleFavorite = async (note: NoteItem) => {
    console.log("⭐ Toggling favorite:", note.id);
    setIsBusyId(note.id);
    try {
      const updated = { isFavorite: !note.isFavorite };
      // Optimistic update
      setNotes((prev) =>
        prev.map((item) => (item.id === note.id ? { ...item, ...updated } : item))
      );
      await apiUpdateNote(note.id, updated);
      console.log("✅ Favorite toggled");
    } catch (error) {
      console.error("❌ handleToggleFavorite error:", error);
      await loadNotes();
    } finally {
      setIsBusyId(null);
    }
  };

  const handleSummarize = async (note: NoteItem) => {
    console.log("✨ Summarizing note:", note.id);
    setIsBusyId(note.id);
    try {
      const updatedNote = await apiSummarizeNote(note.id);
      if (updatedNote) {
        console.log("✅ Summary generated");
        setNotes((prev) => prev.map((item) => (item.id === note.id ? updatedNote : item)));
      }
      Alert.alert("Success", "AI summary generated and saved");
    } catch (error) {
      console.error("❌ handleSummarize error:", error);
      Alert.alert("Error", "Failed to generate summary");
    } finally {
      setIsBusyId(null);
    }
  };

  const renderNote = ({ item }: { item: NoteItem }) => (
    <NoteCard
       note={item}
      onPress={() => handleEditNote(item)}
      onTogglePin={() => handleTogglePin(item)}
      onToggleFavorite={() => handleToggleFavorite(item)}
      onSummarize={() => handleSummarize(item)}
      onDelete={(noteId, mongoId) => {
            console.log("🗑 DELETE CLICKED");
            console.log("🗑 NOTE DATA:", item);
            console.log(
              "🗑 NOTE ID:",
              noteId,
              mongoId
            );
            handleDeleteNote(noteId || (item as any).id, mongoId);
          }}
      isBusy={isBusyId === (item as any).id || isBusyId === (item as any)._id}

    />
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📕</Text>
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first study note to get started.
      </Text>
      <Button
        title="Create Your First Note"
        onPress={handleAddNote}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>📚 Study Notes</Text>
            <Text style={styles.headerSubtitle}>
              {notes.length} note{notes.length !== 1 ? "s" : ""} saved
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>❌ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by title, subject, or tags..."
            value={searchText}
            onChangeText={setSearchText}
            containerStyle={styles.searchInput}
            placeholderTextColor={COLORS.gray400}
          />
        </View>

        {/* Category Filter Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedSubject && styles.chipActive]}
            onPress={() => setSelectedSubject(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, !selectedSubject && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[styles.chip, selectedSubject === subject && styles.chipActive]}
              onPress={() =>
                setSelectedSubject(selectedSubject === subject ? null : subject)
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSubject === subject && styles.chipTextActive,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : notes.length === 0 ? (
          renderEmptyState()
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyDescription}>
              Try a different search or create a new note.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        {/* Note Modal */}
        <NoteModal
          visible={modalVisible}
          isSaving={isSaving}
          isEditing={isEditing}
          draft={draft}
          errorMessage={errorMessage}
          subjects={subjects}
          onClose={() => {
            setModalVisible(false);
            setIsBusyId(null);
            setErrorMessage("");
          }}
          onSave={handleCreateNote}
          onDraftChange={(field, value) =>
            setDraft((current) => ({ ...current, [field]: value }))
          }
        />

        {/* Floating Action Button */}
        {notes.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddNote}
            activeOpacity={0.8}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  errorBanner: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.errorLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    width: "100%",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  chip: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: COLORS.white,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  emptyButton: {
    minWidth: 180,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: "300",
  },
});

