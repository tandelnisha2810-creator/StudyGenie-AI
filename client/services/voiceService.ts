import { Platform } from 'react-native';

export interface VoiceQuizQuestion {
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

export interface VoiceNote {
  _id?: string;
  id?: string;
  title?: string;
  transcript?: string;
  summary?: string;
  quiz?: VoiceQuizQuestion[] | unknown;
  durationSeconds?: number;
  duration?: number;
  audioUrl?: string;
  audioUri?: string;
  localUri?: string;
  mimeType?: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateVoiceNoteInput {
  audioUri: string;
  transcript: string;
  durationSeconds?: number;
  title?: string;
  summary?: string;
  quiz?: VoiceQuizQuestion[] | string;
  mimeType?: string;
  fileName?: string;
  token?: string;
  userId?: string;
}

export interface VoiceTranscriptActionInput {
  transcript: string;
  summary?: string;
  token?: string;
  userId?: string;
}

const DEFAULT_BASE_URL = 'http://localhost:5000';
const ANDROID_BASE_URL = 'http://10.0.2.2:5000';

function trimSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return trimSlash(configured);
  }

  if (Platform.OS === 'android') {
    return ANDROID_BASE_URL;
  }

  return DEFAULT_BASE_URL;
}

function joinUrl(baseUrl: string, path: string) {
  return `${trimSlash(baseUrl)}/${path.replace(/^\/+/, '')}`;
}

function resolveUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return joinUrl(getApiBaseUrl(), pathOrUrl);
}

function buildHeaders(token?: string, json = true) {
  const headers: Record<string, string> = {};
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

function normalizeQuiz(quiz: unknown): VoiceQuizQuestion[] | undefined {
  if (!quiz) {
    return undefined;
  }

  if (typeof quiz === 'string') {
    try {
      return normalizeQuiz(JSON.parse(quiz));
    } catch {
      return [
        {
          question: quiz.trim(),
        },
      ];
    }
  }

  if (Array.isArray(quiz)) {
    return quiz
      .map((item) => {
        if (typeof item === 'string') {
          return { question: item } satisfies VoiceQuizQuestion;
        }

        if (item && typeof item === 'object') {
          const maybeQuestion = item as Partial<VoiceQuizQuestion> & Record<string, unknown>;
          const question = String(maybeQuestion.question ?? maybeQuestion.prompt ?? '').trim();
          const options = Array.isArray(maybeQuestion.options)
            ? maybeQuestion.options.map((option) => String(option))
            : undefined;
          const answer = typeof maybeQuestion.answer === 'string' ? maybeQuestion.answer : undefined;
          const explanation = typeof maybeQuestion.explanation === 'string' ? maybeQuestion.explanation : undefined;

          if (!question && !answer) {
            return null;
          }

          return {
            question: question || answer || 'Quiz question',
            options,
            answer,
            explanation,
          } satisfies VoiceQuizQuestion;
        }

        return null;
      })
      .filter(Boolean) as VoiceQuizQuestion[];
  }

  return undefined;
}

function getNoteId(note: VoiceNote) {
  return note._id ?? note.id ?? '';
}

export function normalizeVoiceNote(raw: unknown): VoiceNote {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const note = raw as Record<string, unknown>;
  return {
    ...note,
    _id: typeof note._id === 'string' ? note._id : undefined,
    id: typeof note.id === 'string' ? note.id : undefined,
    title: typeof note.title === 'string' ? note.title : undefined,
    transcript: typeof note.transcript === 'string' ? note.transcript : undefined,
    summary: typeof note.summary === 'string' ? note.summary : undefined,
    quiz: normalizeQuiz(note.quiz),
    durationSeconds:
      typeof note.durationSeconds === 'number'
        ? note.durationSeconds
        : typeof note.duration === 'number'
          ? note.duration
          : undefined,
    duration: typeof note.duration === 'number' ? note.duration : undefined,
    audioUrl: typeof note.audioUrl === 'string' ? note.audioUrl : undefined,
    audioUri: typeof note.audioUri === 'string' ? note.audioUri : undefined,
    localUri: typeof note.localUri === 'string' ? note.localUri : undefined,
    mimeType: typeof note.mimeType === 'string' ? note.mimeType : undefined,
    fileName: typeof note.fileName === 'string' ? note.fileName : undefined,
    createdAt: typeof note.createdAt === 'string' ? note.createdAt : undefined,
    updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : undefined,
  };
}

function extractNotes(payload: unknown): VoiceNote[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeVoiceNote);
  }

  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    const notes = data.voiceNotes ?? data.notes ?? data.data;
    if (Array.isArray(notes)) {
      return notes.map(normalizeVoiceNote);
    }
  }

  return [];
}

function extractNote(payload: unknown): VoiceNote {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    return normalizeVoiceNote(data.voiceNote ?? data.note ?? data.data ?? data);
  }

  return {};
}

function getAudioFileParts(audioUri: string, mimeType?: string, fileName?: string) {
  const normalizedUri =
    audioUri.startsWith('file://') || audioUri.startsWith('content://') || audioUri.startsWith('blob:') || audioUri.startsWith('data:')
      ? audioUri
      : `file://${audioUri}`;

  const extension = mimeType?.includes('webm')
    ? 'webm'
    : mimeType?.includes('wav')
      ? 'wav'
      : mimeType?.includes('mp4')
        ? 'mp4'
        : 'm4a';

  const name = fileName || `voice-note-${Date.now()}.${extension}`;
  const type = mimeType || (extension === 'webm' ? 'audio/webm' : extension === 'wav' ? 'audio/wav' : 'audio/m4a');

  return {
    uri: normalizedUri,
    name,
    type,
  };
}

function withQuery(path: string, params: Record<string, string | undefined>) {
  const url = new URL(resolveUrl(path));
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function requestJson<T>(pathOrUrl: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const response = await fetch(resolveUrl(pathOrUrl), {
    ...init,
    headers: {
      ...buildHeaders(init.token, true),
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseJsonResponse<T | { message?: string }>(response);
  if (!response.ok) {
    const message = (payload as { message?: string })?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

async function appendAudioToFormData(formData: FormData, audioUri: string, mimeType?: string, fileName?: string) {
  const file = getAudioFileParts(audioUri, mimeType, fileName);

  if (Platform.OS === 'web' && (file.uri.startsWith('blob:') || file.uri.startsWith('data:') || /^https?:\/\//i.test(file.uri))) {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('audio', blob, file.name);
      return;
    } catch {
      // Fallback below
    }
  }

  formData.append(
    'audio',
    {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob,
  );
}

async function requestFormData<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    method: 'POST',
    headers: buildHeaders(token, false),
    body: formData,
  });

  const payload = await parseJsonResponse<T | { message?: string }>(response);
  if (!response.ok) {
    const message = (payload as { message?: string })?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function createVoiceNote(input: CreateVoiceNoteInput): Promise<VoiceNote> {
  const formData = new FormData();

  await appendAudioToFormData(formData, input.audioUri, input.mimeType, input.fileName);

  formData.append('transcript', input.transcript ?? '');
  formData.append('durationSeconds', String(input.durationSeconds ?? 0));
  formData.append('duration', String(input.durationSeconds ?? 0));

  if (input.title) {
    formData.append('title', input.title);
  }

  if (input.summary) {
    formData.append('summary', input.summary);
  }

  if (input.quiz) {
    formData.append('quiz', typeof input.quiz === 'string' ? input.quiz : JSON.stringify(input.quiz));
  }

  if (input.userId) {
    formData.append('userId', input.userId);
  }

  const payload = await requestFormData<{ voiceNote?: unknown; note?: unknown; data?: unknown } | VoiceNote>(
    '/api/voice-notes',
    formData,
    input.token,
  );

  return extractNote(payload);
}

export async function getVoiceNotes(token?: string, userId?: string): Promise<VoiceNote[]> {
  // Prefer explicit route to match backend router patterns.
  const url = userId ? `/api/voice-notes/${encodeURIComponent(userId)}` : '/api/voice-notes';
  const payload = await requestJson<{ voiceNotes?: unknown[]; notes?: unknown[]; data?: unknown[] } | VoiceNote[]>(url, {
    method: 'GET',
    token,
  });

  return extractNotes(payload);
}


export async function deleteVoiceNote(noteId: string, token?: string): Promise<void> {
  if (!noteId) {
    throw new Error('Missing voice note id');
  }

  await requestJson<{ success?: boolean }>(`/api/voice-notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
    token,
  });
}

export async function summarizeVoiceTranscript(input: VoiceTranscriptActionInput): Promise<string> {
  const payload = await requestJson<{ summary?: string; data?: { summary?: string }; message?: string }>(
    '/api/voice-notes/summarize',
    {
      method: 'POST',
      token: input.token,
      body: JSON.stringify({
        transcript: input.transcript,
        summary: input.summary,
        userId: input.userId,
      }),
    },
  );

  const summary = payload.summary ?? payload.data?.summary;
  if (!summary) {
    throw new Error('Summary was not returned by the server');
  }

  return summary;
}

export async function generateVoiceQuiz(input: VoiceTranscriptActionInput): Promise<VoiceQuizQuestion[]> {
  const payload = await requestJson<{ quiz?: unknown; data?: { quiz?: unknown }; message?: string }>(
    '/api/voice-notes/quiz',
    {
      method: 'POST',
      token: input.token,
      body: JSON.stringify({
        transcript: input.transcript,
        summary: input.summary,
        userId: input.userId,
      }),
    },
  );

  const quiz = normalizeQuiz(payload.quiz ?? payload.data?.quiz);
  if (!quiz) {
    throw new Error('Quiz was not returned by the server');
  }

  return quiz;
}

export const voiceService = {
  getApiBaseUrl,
  createVoiceNote,
  getVoiceNotes,
  deleteVoiceNote,
  summarizeVoiceTranscript,
  generateVoiceQuiz,
};