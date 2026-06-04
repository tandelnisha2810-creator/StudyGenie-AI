import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthGuard } from '@/components/AuthGuard';
import { VoiceRecorder, type VoiceRecordingDraft } from '@/components/voice/VoiceRecorder';
import { VoiceNoteCard, type VoiceNoteItem } from '@/components/voice/VoiceNoteCard';
import { useAuth } from '@/hooks/useAuth';
import { createVoiceNote, deleteVoiceNote, getVoiceNotes, type VoiceNote } from '@/services/voiceService';
import { createNote } from '@/services/noteService';

import { COLORS, TEXT_COLORS } from '@/utils/colors';
import { BORDER_RADIUS, SPACING } from '@/utils/spacing';
import { TYPOGRAPHY } from '@/utils/typography';

function sortNotes(notes: VoiceNote[]) {
  return [...notes].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function getNoteId(note: VoiceNoteItem) {
  return note._id ?? note.id ?? '';
}

export default function VoiceNotesScreen() {
  const { user, loading: authLoading } = useAuth();

  const [token, setToken] = useState<string | undefined>();
  const [notes, setNotes] = useState<VoiceNoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceRecordingDraft | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolveToken = async () => {
      if (!user) {
        if (mounted) {
          setToken(undefined);
        }
        return;
      }

      try {
        const nextToken = await user.getIdToken();
        if (mounted) {
          setToken(nextToken);
        }
      } catch {
        if (mounted) {
          setToken(undefined);
        }
      }
    };

    void resolveToken();

    return () => {
      mounted = false;
    };
  }, [user]);

  const loadNotes = useCallback(async () => {
    try {
      setLoadingNotes(true);

      if (!user?.uid) {
        setNotes([]);
        return;
      }

      const result = await getVoiceNotes(token, user.uid);
      setNotes(sortNotes(result) as VoiceNoteItem[]);
    } catch (error) {
      console.error('loadNotes error', error);
      Alert.alert('Error', 'Failed to load voice notes.');
      setNotes([]);
    } finally {
      setLoadingNotes(false);
      setRefreshing(false);
    }
  }, [token, user?.uid]);

  useEffect(() => {
    if (!authLoading) {
      void loadNotes();
    }
  }, [authLoading, loadNotes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadNotes();
  }, [loadNotes]);

  const handleSave = useCallback(
    async (recordingDraft: VoiceRecordingDraft) => {
      if (!user?.uid) {
        throw new Error('User not signed in');
      }

      const audioUri = recordingDraft.localUri || recordingDraft.audioUri;

      // 1) Persist into voice notes collection (voice library)
      const createdVoice = await createVoiceNote({
        audioUri,
        transcript: recordingDraft.transcript,
        durationSeconds: recordingDraft.durationSeconds,
        title: recordingDraft.title,
        summary: recordingDraft.summary,
        quiz: recordingDraft.quiz,
        mimeType: recordingDraft.mimeType,
        fileName: recordingDraft.fileName,
        token,
        userId: user.uid,
      });

      // Immediately show newest note on top using returned payload
      setNotes((current) => [createdVoice as VoiceNoteItem, ...current]);

      // 2) ALSO persist into main study notes collection so Notes tab syncs
      await createNote({
        userId: user.uid,
        type: 'voice-note',
        title: recordingDraft.title || 'Voice Note',
        content: recordingDraft.transcript,
        summary: recordingDraft.summary || '',
        quiz: recordingDraft.quiz || [],
        audioUri: audioUri || '',
        subject: 'General',
        tags: ['Voice Notes'],
        color: 'purple',
        image: '',
        isPinned: false,
        isFavorite: false,
      });

      setDraft({
        ...recordingDraft,
        status: 'saved',
      });

      // Fallback: guarantee UI is in sync even if returned payload is partial
      void loadNotes();
    },
    [token, user?.uid, loadNotes],
  );



  const handleDelete = useCallback(
    async (noteId: string) => {
      console.log('STEP 1 CLICK');
      console.log('STEP 2 ID', noteId);

      if (!noteId) {
        console.error('VOICE DELETE: missing noteId');
        Alert.alert('Error', 'Invalid voice note id.');
        return;
      }

      // Web: Alert button callbacks are unreliable in RN Web/Expo.
      if (Platform.OS === 'web') {
        console.log('STEP 3 BEFORE CONFIRM');
        const confirmed = window.confirm('Delete voice note?');
        console.log('STEP 4 CONFIRM RESULT', confirmed);

        if (!confirmed) {
          console.log('USER CANCELLED');
          return;
        }

        try {
          console.log('STEP 5 BEFORE API');
          const result = await deleteVoiceNote(noteId, token);
          console.log('STEP 6 AFTER API', result);

          console.log('STEP 7 BEFORE UI UPDATE');
          setNotes((prev) => prev.filter((item) => getNoteId(item) !== noteId));
          console.log('STEP 8 DONE');

          await loadNotes();
          Alert.alert('Deleted', 'Voice note deleted successfully');
        } catch (error) {
          console.error('VOICE DELETE ERROR (web)', error);
          Alert.alert('Error', 'Failed to delete voice note.');
          void loadNotes();
        }

        return;
      }

      // Native: keep Alert but still add step logs.
      Alert.alert('Delete voice note?', 'This action cannot be undone.', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('USER CANCELLED (native)'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('STEP 3 BEFORE CONFIRM');
              console.log('STEP 4 CONFIRM RESULT', true);

              setBusyId(noteId);

              console.log('STEP 5 BEFORE API');
              const result = await deleteVoiceNote(noteId, token);
              console.log('STEP 6 AFTER API', result);

              console.log('STEP 7 BEFORE UI UPDATE');
              setNotes((prev) => prev.filter((item) => getNoteId(item) !== noteId));
              console.log('STEP 8 DONE');

              await loadNotes();
              Alert.alert('Deleted', 'Voice note deleted successfully');
            } catch (error) {
              console.error('VOICE DELETE ERROR (native)', error);
              Alert.alert('Error', 'Failed to delete voice note.');
              void loadNotes();
            } finally {
              setBusyId(null);
            }
          },
        },
      ]);
    },
    [loadNotes, token],
  );


  const stats = useMemo(() => {
    const transcripted = notes.filter((note) => Boolean(note.transcript?.trim()));
    const summarized = notes.filter((note) => Boolean(note.summary?.trim()));
    const quizReady = notes.filter((note) => Array.isArray(note.quiz) && note.quiz.length > 0);

    return [
      { label: 'Notes', value: notes.length, icon: 'library' as const },
      { label: 'Transcripts', value: transcripted.length, icon: 'text' as const },
      { label: 'Summaries', value: summarized.length, icon: 'sparkles' as const },
      { label: 'Quizzes', value: quizReady.length, icon: 'help-circle' as const },
    ];
  }, [notes]);

  const latestNote = notes[0];
  const recentPreview = latestNote?.transcript?.trim() || draft?.transcript?.trim() || 'Start a recording to see your live transcript here.';

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="mic-outline" size={30} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No voice notes yet</Text>
      <Text style={styles.emptyDescription}>
        Record your first note, generate an AI summary or quiz, then save it into your library.
      </Text>
    </View>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="mic" size={16} color={COLORS.primary} />
              <Text style={styles.heroBadgeText}>Voice Notes</Text>
            </View>
            <Text style={styles.heroTitle}>Record, transcribe, and study faster</Text>
            <Text style={styles.heroCopy}>
              A polished recorder for lecture notes, meeting memos, and quick study drafts.
            </Text>

            <View style={styles.heroStats}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Ionicons name={stat.icon} size={18} color={COLORS.primary} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <VoiceRecorder
            token={token}
            userId={user?.uid}
            onDraftChange={setDraft}
            onSave={handleSave}
            onSaved={() => {
              void loadNotes();
            }}
          />

          <View style={styles.previewCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transcript</Text>
              <View style={styles.sectionChip}>
                <Text style={styles.sectionChipText}>{notes.length} saved</Text>
              </View>
            </View>
            <Text style={styles.previewText}>
              {recentPreview}
            </Text>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your Library</Text>
            <Pressable onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {loadingNotes ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.list}>
              {notes.length === 0 ? (
                <View style={styles.libraryEmptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="mic-outline" size={30} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No voice notes yet</Text>
                  <Text style={styles.emptyDescription}>
                    Record your first note, generate an AI summary or quiz, then save it into your library.
                  </Text>
                </View>
              ) : (
                notes.map((item) => (
                  <VoiceNoteCard
                    key={getNoteId(item) || item.createdAt || item.title}
                    item={item}
                    isBusy={busyId === getNoteId(item)}
                    onDelete={handleDelete}
                  />
                ))
              )}

            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  hero: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.lg,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.12)',
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
  },
  heroTitle: {
    ...TYPOGRAPHY.h2,
    color: TEXT_COLORS.primary,
    marginBottom: 8,
  },
  heroCopy: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    minWidth: '47%',
    flexGrow: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: 6,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '700',
  },
  previewCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
  },
  sectionChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.12)',
  },
  sectionChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
  },
  previewText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(79,70,229,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.10)',
  },
  refreshText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  emptyState: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  libraryEmptySpacer: {
    height: 8,
  },
  libraryEmptyState: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },


  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(79,70,229,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: 6,
  },
  emptyDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loaderWrap: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});