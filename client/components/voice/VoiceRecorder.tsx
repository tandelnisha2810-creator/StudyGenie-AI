import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { WaveAnimation } from './WaveAnimation';
import { Button } from '@/components/ui/Button';
import { COLORS, TEXT_COLORS } from '@/utils/colors';
import { SPACING, BORDER_RADIUS } from '@/utils/spacing';
import { TYPOGRAPHY } from '@/utils/typography';
import { createSpeechService, type SpeechServiceController, type SpeechTranscriptEvent } from '@/services/speechService';
import { generateVoiceQuiz, summarizeVoiceTranscript, type VoiceQuizQuestion } from '@/services/voiceService';

export interface VoiceRecordingDraft {
  title: string;
  transcript: string;
  audioUri: string;
  localUri?: string;
  durationSeconds: number;
  summary?: string;
  quiz?: VoiceQuizQuestion[];
  mimeType?: string;
  fileName?: string;
  status: 'idle' | 'recording' | 'paused' | 'finalized' | 'saving' | 'saved';
}

interface VoiceRecorderProps {
  token?: string;
  userId?: string;
  onSave?: (draft: VoiceRecordingDraft) => Promise<void> | void;
  onDraftChange?: (draft: VoiceRecordingDraft) => void;
  onSaved?: (draft: VoiceRecordingDraft) => void;
}

const RECORDING_OPTIONS = Audio.RecordingOptionsPresets.HIGH_QUALITY;
const FALLBACK_TITLE = 'Voice note';

function formatDuration(totalSeconds: number) {
  const value = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function inferFileExtension(uri?: string, mimeType?: string) {
  if (mimeType?.includes('webm')) return 'webm';
  if (mimeType?.includes('wav')) return 'wav';
  if (mimeType?.includes('mp4')) return 'm4a';
  if (uri?.toLowerCase().endsWith('.webm')) return 'webm';
  if (uri?.toLowerCase().endsWith('.wav')) return 'wav';
  return 'm4a';
}

function inferMimeType(uri?: string, mimeType?: string) {
  if (mimeType) return mimeType;
  const extension = inferFileExtension(uri);
  if (extension === 'webm') return 'audio/webm';
  if (extension === 'wav') return 'audio/wav';
  return 'audio/m4a';
}

function createDraftTitle(transcript: string) {
  const clean = transcript.replace(/\s+/g, ' ').trim();
  if (!clean) {
    return FALLBACK_TITLE;
  }

  return clean.length > 48 ? `${clean.slice(0, 48).trimEnd()}…` : clean;
}

function normalizeTranscriptChunk(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function mergeTranscript(existing: string, chunk: string) {
  const current = normalizeTranscriptChunk(existing);
  const next = normalizeTranscriptChunk(chunk);

  if (!current) return next;
  if (!next) return current;
  if (current === next) return current;
  if (next.startsWith(current)) return next;
  if (current.startsWith(next)) return current;

  return `${current} ${next}`.replace(/\s+/g, ' ').trim();
}

async function ensureRecordingDirectory() {
  const baseDirectory = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''}voice-notes/`;
  if (!baseDirectory) {
    return '';
  }

  const info = await FileSystem.getInfoAsync(baseDirectory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(baseDirectory, { intermediates: true });
  }

  return baseDirectory;
}

async function persistRecordingLocally(sourceUri: string, extension: string) {
  if (!sourceUri) {
    return '';
  }

  if (Platform.OS === 'web') {
    return sourceUri;
  }

  const directory = await ensureRecordingDirectory();
  if (!directory || !sourceUri.startsWith('file://')) {
    return sourceUri;
  }

  const targetUri = `${directory}voice-note-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
    return targetUri;
  } catch {
    return sourceUri;
  }
}

async function cleanupSpeechService(service: SpeechServiceController | null) {
  try {
    await service?.destroy();
  } catch {
    // ignore
  }
}

export function VoiceRecorder({
  token,
  userId,
  onSave,
  onDraftChange,
  onSaved,
}: VoiceRecorderProps) {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState<VoiceRecordingDraft['status']>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [summary, setSummary] = useState<string | undefined>();
  const [quiz, setQuiz] = useState<VoiceQuizQuestion[] | undefined>();
  const [audioUri, setAudioUri] = useState('');
  const [localUri, setLocalUri] = useState('');
  const [fileName, setFileName] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string>('audio/m4a');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechServiceRef = useRef<SpeechServiceController | null>(null);
  const titleTouchedRef = useRef(false);

  if (!speechServiceRef.current) {
    speechServiceRef.current = createSpeechService({
      onTranscript: (event: SpeechTranscriptEvent) => {
        if (event.isFinal) {
          setTranscript((current) => mergeTranscript(current, event.transcript));
          setLiveTranscript('');
        } else {
          setLiveTranscript(normalizeTranscriptChunk(event.transcript));
        }
      },
      onEnd: () => {
        setLiveTranscript('');
      },
      onError: (error) => {
        console.warn('Speech recognition error:', error);
      },
      onPermissionDenied: () => {
        Alert.alert(
          'Speech permission denied',
          'Enable microphone access to capture live transcripts.',
        );
      },
    });
  }

  const supportsSpeech = useMemo(() => Boolean(speechServiceRef.current?.isSupported), []);

  const buildCurrentDraft = (): VoiceRecordingDraft => {
    const currentTranscript = mergeTranscript(transcript, liveTranscript);
    const resolvedUri = localUri || audioUri;

    return {
      title: title.trim() || createDraftTitle(currentTranscript),
      transcript: currentTranscript,
      audioUri: resolvedUri,
      localUri: localUri || undefined,
      durationSeconds: elapsedSeconds,
      summary,
      quiz,
      mimeType,
      fileName,
      status,
    };
  };

  const emitDraft = () => {
    onDraftChange?.(buildCurrentDraft());
  };

  useEffect(() => {
    emitDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, transcript, liveTranscript, summary, quiz, audioUri, localUri, elapsedSeconds, mimeType, fileName, status]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
  };

  const requestMicrophonePermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      const granted = permission.status === 'granted';
      setHasMicPermission(granted);

      if (!granted) {
        Alert.alert(
          'Microphone permission required',
          'Please allow microphone access to record a voice note.',
        );
      }

      return granted;
    } catch (error) {
      console.warn('requestMicrophonePermission error', error);
      Alert.alert('Permission error', 'Unable to request microphone permission.');
      return false;
    }
  };

  const unloadRecording = async () => {
    const recording = recordingRef.current;
    recordingRef.current = null;

    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // ignore
    }
  };

  const startSpeechCapture = async (resetTranscript = true) => {
    if (!speechServiceRef.current?.isSupported) {
      return;
    }

    try {
      await speechServiceRef.current.start({
        resetTranscript,
        locale: 'en-US',
      });
    } catch (error) {
      console.warn('startSpeechCapture error', error);
    }
  };

  const stopSpeechCapture = async () => {
    try {
      await speechServiceRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }

    const allowed = hasMicPermission ?? (await requestMicrophonePermission());
    if (!allowed) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        playThroughEarpieceAndroid: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recording.setProgressUpdateInterval(250);
      recording.setOnRecordingStatusUpdate((statusUpdate) => {
        if (typeof statusUpdate.durationMillis === 'number') {
          setElapsedSeconds(Math.max(0, Math.floor(statusUpdate.durationMillis / 1000)));
        }
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setIsPaused(false);
      setStatus('recording');
      setElapsedSeconds(0);
      setTranscript('');
      setLiveTranscript('');
      setSummary(undefined);
      setQuiz(undefined);
      setAudioUri('');
      setLocalUri('');
      setMimeType('audio/m4a');
      setFileName(undefined);
      titleTouchedRef.current = false;
      setTitle(FALLBACK_TITLE);

      startTimer();
      await startSpeechCapture(true);
    } catch (error) {
      console.error('startRecording error', error);
      Alert.alert('Recording failed', 'Could not start voice recording.');
      setIsRecording(false);
      setIsPaused(false);
      setStatus('idle');
      stopTimer();
      await stopSpeechCapture();
      await unloadRecording();
    }
  };

  const pauseRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return;
    }

    try {
      await recording.pauseAsync();
      setIsPaused(true);
      setStatus('paused');
      stopTimer();
      await stopSpeechCapture();
    } catch (error) {
      console.error('pauseRecording error', error);
    }
  };

  const resumeRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return;
    }

    try {
      await recording.startAsync();
      setIsPaused(false);
      setStatus('recording');
      startTimer();
      await startSpeechCapture(false);
    } catch (error) {
      console.error('resumeRecording error', error);
    }
  };

  const finalizeTranscript = () => {
    setTranscript((current) => mergeTranscript(current, liveTranscript));
    setLiveTranscript('');
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      return;
    }

    stopTimer();
    await stopSpeechCapture();

    try {
      const recording = recordingRef.current;
      finalizeTranscript();

      await recording.stopAndUnloadAsync();
      const rawUri = recording.getURI() ?? '';
      const extension = inferFileExtension(rawUri, mimeType);
      const persistedUri = await persistRecordingLocally(rawUri, extension);
      const normalizedMimeType = inferMimeType(persistedUri || rawUri, mimeType);
      const generatedFileName = `voice-note-${Date.now()}.${extension}`;

      setAudioUri(rawUri || persistedUri);
      setLocalUri(persistedUri);
      setMimeType(normalizedMimeType);
      setFileName(generatedFileName);
      setStatus('finalized');
      setIsRecording(false);
      setIsPaused(false);

      if (!titleTouchedRef.current) {
        setTitle((current) => {
          const merged = mergeTranscript(transcript, liveTranscript);
          const nextTitle = createDraftTitle(merged);
          return current.trim() && current !== FALLBACK_TITLE ? current : nextTitle;
        });
      }
    } catch (error) {
      console.error('stopRecording error', error);
      Alert.alert('Recording failed', 'Could not stop and save the recording.');
      setStatus('idle');
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(false);

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          playThroughEarpieceAndroid: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });
      } catch {
        // ignore
      }
    }
  };

  const handleGenerateSummary = async () => {
    const currentTranscript = mergeTranscript(transcript, liveTranscript);
    if (!currentTranscript.trim()) {
      Alert.alert('No transcript', 'Record some speech before generating a summary.');
      return;
    }

    try {
      setIsGeneratingSummary(true);
      const generatedSummary = await summarizeVoiceTranscript({
        transcript: currentTranscript,
        summary,
        token,
        userId,
      });
      setSummary(generatedSummary);
    } catch (error) {
      console.error('handleGenerateSummary error', error);
      Alert.alert('Summary failed', error instanceof Error ? error.message : 'Could not generate summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const currentTranscript = mergeTranscript(transcript, liveTranscript);
    if (!currentTranscript.trim()) {
      Alert.alert('No transcript', 'Record some speech before generating a quiz.');
      return;
    }

    try {
      setIsGeneratingQuiz(true);
      const generatedQuiz = await generateVoiceQuiz({
        transcript: currentTranscript,
        summary,
        token,
        userId,
      });
      setQuiz(generatedQuiz);
    } catch (error) {
      console.error('handleGenerateQuiz error', error);
      Alert.alert('Quiz failed', error instanceof Error ? error.message : 'Could not generate quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSave = async () => {
    const currentDraft = buildCurrentDraft();
    if (!currentDraft.audioUri) {
      Alert.alert('No recording', 'Record and stop a voice note before saving it.');
      return;
    }

    if (!currentDraft.transcript.trim()) {
      Alert.alert('No transcript', 'Please capture a transcript before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setStatus('saving');
      await onSave?.({
        ...currentDraft,
        status: 'saving',
      });
      setStatus('saved');
      onSaved?.({
        ...currentDraft,
        status: 'saved',
      });
    } catch (error) {
      console.error('handleSave error', error);
      setStatus('finalized');
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Could not save the voice note.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      void stopSpeechCapture();
      void cleanupSpeechService(speechServiceRef.current);
      void unloadRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTranscript = mergeTranscript(transcript, liveTranscript);
  const canSave = status === 'finalized' || status === 'saved';
  const isLive = isRecording && !isPaused;
  const recordingLabel = isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready to record';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Voice Notes</Text>
            <Text style={styles.title}>Google Recorder meets study notes</Text>
            <Text style={styles.subtitle}>
              Capture audio, watch live transcription, then save the note with AI summary and quiz.
            </Text>
          </View>

          <View style={styles.timePill}>
            <Text style={styles.timeValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.timeLabel}>{recordingLabel}</Text>
          </View>
        </View>

        <View style={styles.waveSection}>
          <WaveAnimation active={isLive} />
          <View style={styles.stateMeta}>
            <Text style={styles.stateText}>{recordingLabel}</Text>
            <Text style={styles.stateSubtext}>
              {Platform.OS === 'web'
                ? supportsSpeech
                  ? 'Live speech recognition is enabled'
                  : 'Speech recognition unavailable in this browser'
                : 'Live speech recognition is enabled on native'}
            </Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          {!isRecording ? (
            <Pressable style={styles.recordButton} onPress={startRecording}>
              <View style={styles.recordButtonRing} />
              <View style={styles.recordButtonDot} />
              <Ionicons name="mic" size={20} color={COLORS.white} />
              <Text style={styles.recordButtonText}>Record</Text>
            </Pressable>
          ) : (
            <>
              <Button
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={isPaused ? resumeRecording : pauseRecording}
                variant="outline"
                icon={
                  <Ionicons
                    name={isPaused ? 'play' : 'pause'}
                    size={18}
                    color={COLORS.primary}
                  />
                }
                style={styles.actionButton}
              />
              <Button
                title="Stop"
                onPress={stopRecording}
                variant="secondary"
                icon={<Ionicons name="stop" size={18} color={COLORS.white} />}
                style={styles.actionButton}
              />
            </>
          )}
        </View>

        <View style={styles.transcriptCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Transcript</Text>
            <View style={styles.volumeBadge}>
              <Text style={styles.volumeText}>Mic</Text>
            </View>
          </View>

          <Text style={styles.transcriptText}>
            {currentTranscript.trim()
              ? currentTranscript
              : isRecording
                ? 'Start speaking to see your transcript appear here.'
                : 'Your transcript will appear here after you record.'}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Study Note Draft</Text>
            <Text style={styles.sectionCaption}>
              {status === 'saved' ? 'Saved to your library' : status === 'saving' ? 'Saving...' : 'Ready'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              value={title}
              onChangeText={(text) => {
                titleTouchedRef.current = true;
                setTitle(text);
              }}
              placeholder="Give your note a title"
              placeholderTextColor={TEXT_COLORS.tertiary}
              style={styles.titleInput}
            />
          </View>

          <View style={styles.actionsGrid}>
            <Button
              title="AI Summary"
              onPress={handleGenerateSummary}
              variant="outline"
              loading={isGeneratingSummary}
              disabled={!currentTranscript.trim() || isRecording}
              icon={<Ionicons name="sparkles" size={18} color={COLORS.primary} />}
              style={styles.gridButton}
            />
            <Button
              title="AI Quiz"
              onPress={handleGenerateQuiz}
              variant="outline"
              loading={isGeneratingQuiz}
              disabled={!currentTranscript.trim() || isRecording}
              icon={<Ionicons name="help-circle" size={18} color={COLORS.primary} />}
              style={styles.gridButton}
            />
            <Button
              title="Save as Study Note"
              onPress={handleSave}
              variant="primary"
              loading={isSaving}
              disabled={!canSave || !currentTranscript.trim() || !audioUri}
              icon={<Ionicons name="cloud-upload" size={18} color={COLORS.white} />}
              style={[styles.gridButton, styles.saveButton]}
            />
          </View>

          {summary ? (
            <View style={styles.outputCard}>
              <Text style={styles.outputLabel}>Summary</Text>
              <Text style={styles.outputText}>{summary}</Text>
            </View>
          ) : null}

          {quiz?.length ? (
            <View style={styles.outputCard}>
              <Text style={styles.outputLabel}>Quiz</Text>
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
              {quiz.length > 3 ? (
                <Text style={styles.quizMore}>+{quiz.length - 3} more questions</Text>
              ) : null}
            </View>
          ) : null}

          {audioUri || localUri ? (
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="document-attach" size={14} color={COLORS.primary} />
                <Text style={styles.metaChipText}>{inferFileExtension(audioUri || localUri, mimeType).toUpperCase()}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="time" size={14} color={COLORS.primary} />
                <Text style={styles.metaChipText}>{formatDuration(elapsedSeconds)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.lg,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  heroText: {
    flex: 1,
  },
  kicker: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
  },
  timePill: {
    minWidth: 94,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.12)',
    alignItems: 'center',
  },
  timeValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '900',
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    marginTop: 2,
  },
  waveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  stateMeta: {
    flex: 1,
  },
  stateText: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  stateSubtext: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  recordButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
  },
  recordButtonRing: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  recordButtonDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.error,
  },
  recordButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: '800',
  },
  actionButton: {
    flex: 1,
  },
  transcriptCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(79,70,229,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.10)',
    marginBottom: SPACING.md,
  },
  detailsCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    fontWeight: '800',
  },
  sectionCaption: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  volumeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  volumeText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '700',
  },
  transcriptText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleInput: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
  },
  actionsGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  gridButton: {
    width: '100%',
  },
  saveButton: {
    marginTop: 2,
  },
  outputCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  outputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  outputText: {
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
    marginTop: 4,
    lineHeight: 18,
  },
  quizMore: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  metaChipText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontWeight: '700',
  },
});