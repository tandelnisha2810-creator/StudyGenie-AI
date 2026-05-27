import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { COLORS, TEXT_COLORS } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/spacing';
import { TYPOGRAPHY } from '@/utils/typography';
import { VoiceNote, type VoiceQuizQuestion } from '@/services/voiceService';

export type VoiceNoteItem = VoiceNote & {
  id?: string;
  _id?: string;
};

interface VoiceNoteCardProps {
  item: VoiceNoteItem;
  isBusy?: boolean;
  onDelete: (id: string) => Promise<void> | void;
  onAI?: (id: string) => void;
}

function formatTime(totalSeconds: number) {
  const value = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getNoteId(note: VoiceNoteItem) {
  return note._id ?? note.id ?? '';
}

function normalizeQuiz(quiz: VoiceNoteItem['quiz']): VoiceQuizQuestion[] {
  if (!quiz) {
    return [];
  }

  if (Array.isArray(quiz)) {
    return quiz
      .map((item) => {
        if (typeof item === 'string') {
          return { question: item } as VoiceQuizQuestion;
        }

        if (item && typeof item === 'object') {
          const record = item as VoiceQuizQuestion & Record<string, unknown>;
          return {
            question: String(record.question ?? record.prompt ?? 'Quiz question'),
            options: Array.isArray(record.options) ? record.options.map((option) => String(option)) : undefined,
            answer: typeof record.answer === 'string' ? record.answer : undefined,
            explanation: typeof record.explanation === 'string' ? record.explanation : undefined,
          };
        }

        return null;
      })
      .filter(Boolean) as VoiceQuizQuestion[];
  }

  if (typeof quiz === 'string') {
    try {
      return normalizeQuiz(JSON.parse(quiz));
    } catch {
      return [{ question: quiz }];
    }
  }

  return [];
}

export function VoiceNoteCard({ item, isBusy = false, onDelete, onAI }: VoiceNoteCardProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(item.durationSeconds ? item.durationSeconds * 1000 : 0);


  const playableUri = item.audioUrl || item.audioUri || item.localUri || '';
  const noteId = getNoteId(item);
  const transcript = item.transcript?.trim() ?? '';
  const summary = item.summary?.trim() ?? '';
  const quiz = normalizeQuiz(item.quiz);

  const formattedDate = useMemo(() => {
    const value = item.createdAt ? new Date(item.createdAt) : null;
    if (!value || Number.isNaN(value.getTime())) {
      return 'Recently';
    }

    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [item.createdAt]);

  const durationLabel = useMemo(() => {
    const seconds = item.durationSeconds ?? item.duration ?? Math.round(durationMillis / 1000) ?? 0;
    return formatTime(seconds);
  }, [durationMillis, item.duration, item.durationSeconds]);

  const progress = durationMillis > 0 ? Math.min(1, Math.max(0, positionMillis / durationMillis)) : 0;

  const unload = async () => {
    try {
      await soundRef.current?.unloadAsync();
    } catch {
      // ignore
    } finally {
      soundRef.current = null;
      setIsLoaded(false);
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(item.durationSeconds ? item.durationSeconds * 1000 : 0);
    }
  };

  useEffect(() => {
    return () => {
      void unload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureLoaded = async () => {
    if (!playableUri) {
      throw new Error('Missing audio URI');
    }

    if (soundRef.current && isLoaded) {
      return soundRef.current;
    }

    const sound = new Audio.Sound();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    await sound.loadAsync({ uri: playableUri }, { shouldPlay: false }, true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        return;
      }

      setIsLoaded(true);
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? durationMillis);
      setIsPlaying(Boolean(status.isPlaying));

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(status.durationMillis ?? 0);
      }
    });

    soundRef.current = sound;
    setIsLoaded(true);
    return sound;
  };

  const handleTogglePlay = async () => {
    if (isBusy || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const sound = await ensureLoaded();

      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (status.isLoaded && status.isBuffering) {
        return;
      }

      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('VoiceNoteCard playback error:', error);
      await unload();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (isBusy) {
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
    } catch {
      // ignore
    } finally {
      await unload();
    }
  };

  const previewText = transcript.length > 220 ? `${transcript.slice(0, 220).trimEnd()}…` : transcript;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.metaColumn}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || 'Voice note'}
          </Text>
          <Text style={styles.meta}>
            {formattedDate} • {durationLabel}
          </Text>
        </View>

        <View style={styles.playbackColumn}>
          <Pressable
            onPress={handleTogglePlay}
            disabled={isBusy || isLoading || !playableUri}
            style={({ pressed }) => [
              styles.playButton,
              pressed && !isBusy ? styles.playButtonPressed : null,
              !playableUri ? styles.playButtonDisabled : null,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={COLORS.white} />
            )}
          </Pressable>

          <Pressable onPress={handleStop} disabled={isBusy} style={styles.stopButton}>
            <Ionicons name="square" size={12} color={TEXT_COLORS.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{formatTime(positionMillis / 1000)}</Text>
        <Text style={styles.progressText}>{durationLabel}</Text>
      </View>

      <Text style={styles.sectionLabel}>Transcript</Text>
      <Text style={styles.preview} numberOfLines={4}>
        {previewText || '(No transcript)'}
      </Text>

      {summary ? (
        <View style={styles.block}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <Text style={styles.blockText}>{summary}</Text>
        </View>
      ) : null}

      {quiz.length ? (
        <View style={styles.block}>
          <Text style={styles.sectionLabel}>Quiz</Text>
          {quiz.slice(0, 3).map((question, index) => (
            <View key={`${question.question}-${index}`} style={styles.quizItem}>
              <Text style={styles.quizQuestion}>
                {index + 1}. {question.question}
              </Text>
              {question.options?.length ? (
                <Text style={styles.quizOptions}>{question.options.join(' • ')}</Text>
              ) : null}
            </View>
          ))}
          {quiz.length > 3 ? <Text style={styles.moreText}>+{quiz.length - 3} more questions</Text> : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Button
          title="Delete"
          variant="outline"
          size="small"
          disabled={isBusy}
          style={styles.deleteButton}
          textStyle={styles.deleteButtonText}
          onPress={() => onDelete(noteId)}
        />
        {onAI ? (
          <Button
            title="Open AI"
            variant="ghost"
            size="small"
            disabled={isBusy}
            style={styles.aiButton}
            onPress={() => onAI(noteId)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.white,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaColumn: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '600',
  },
  playbackColumn: {
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressed: {
    opacity: 0.85,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  stopButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '700',
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  preview: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
  },
  block: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  blockText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    lineHeight: 22,
  },
  quizItem: {
    marginBottom: SPACING.sm,
  },
  quizQuestion: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    fontWeight: '700',
    lineHeight: 20,
  },
  quizOptions: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  moreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.14)',
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  aiButton: {
    flex: 1,
  },
});