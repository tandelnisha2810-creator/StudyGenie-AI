import { Platform } from 'react-native';

type TranscriptSource = 'web' | 'native';

export interface SpeechTranscriptEvent {
  transcript: string;
  source: TranscriptSource;
  isFinal: boolean;
}

export interface SpeechServiceCallbacks {
  onTranscript?: (event: SpeechTranscriptEvent) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onPermissionDenied?: () => void;
  onVolumeChanged?: (volume: number) => void;
}

export interface SpeechServiceController {
  isSupported: boolean;
  start(options?: { resetTranscript?: boolean; locale?: string }): Promise<boolean>;
  stop(): Promise<void>;
  abort(): Promise<void>;
  destroy(): Promise<void>;
}

type WebSpeechRecognitionResult = {
  transcript: string;
  confidence?: number;
};

type WebSpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    0: WebSpeechRecognitionResult;
    [index: number]: WebSpeechRecognitionResult;
  };
};

type WebSpeechRecognitionEvent = {
  resultIndex: number;
  results: WebSpeechRecognitionResultList;
};

type WebSpeechRecognitionErrorEvent = {
  error?: string;
  message?: string;
};

type WebSpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognitionInstance;

type NativeVoiceModule = typeof import('react-native-voice').default;

declare global {
  interface Window {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  }
}

function normalizeError(error: unknown) {
  if (!error) {
    return 'Speech recognition failed';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      (typeof record.code === 'string' && record.code) ||
      '';
    if (message) {
      return message;
    }
  }

  return 'Speech recognition failed';
}

function normalizeTranscript(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function isPermissionError(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.includes('permission') ||
    lower.includes('not-allowed') ||
    lower.includes('not allowed') ||
    lower.includes('not authorized') ||
    lower.includes('service-not-allowed')
  );
}

export function createSpeechService(callbacks: SpeechServiceCallbacks = {}): SpeechServiceController {
  const isWeb = Platform.OS === 'web';
  let recognition: WebSpeechRecognitionInstance | null = null;
  let nativeVoice: NativeVoiceModule | null = null;
  let active = false;

  const cleanupWebRecognition = () => {
    if (!recognition) {
      return;
    }

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition = null;
  };

  const attachNativeListeners = (Voice: NativeVoiceModule) => {
    Voice.onSpeechStart = () => {
      active = true;
      callbacks.onStart?.();
    };

    Voice.onSpeechPartialResults = (event) => {
      const transcript = normalizeTranscript(event.value?.join(' ') ?? '');
      if (transcript) {
        callbacks.onTranscript?.({
          transcript,
          source: 'native',
          isFinal: false,
        });
      }
    };

    Voice.onSpeechResults = (event) => {
      const transcript = normalizeTranscript(event.value?.join(' ') ?? '');
      if (transcript) {
        callbacks.onTranscript?.({
          transcript,
          source: 'native',
          isFinal: true,
        });
      }
    };

    Voice.onSpeechError = (event) => {
      const message = normalizeError(
        event?.error?.message ||
          event?.message ||
          (typeof event?.error?.code === 'string' ? event.error.code : '') ||
          'Speech recognition error',
      );

      if (isPermissionError(message)) {
        callbacks.onPermissionDenied?.();
      }

      callbacks.onError?.(message);
    };

    Voice.onSpeechEnd = () => {
      active = false;
      callbacks.onEnd?.();
    };

    Voice.onSpeechVolumeChanged = (event) => {
      if (typeof event.value === 'number') {
        callbacks.onVolumeChanged?.(event.value);
      }
    };
  };

  const ensureNativeVoice = async () => {
    if (nativeVoice) {
      return nativeVoice;
    }

    try {
      const module = await import('react-native-voice');
      nativeVoice = module.default;
      attachNativeListeners(nativeVoice);
      return nativeVoice;
    } catch (error) {
      callbacks.onError?.(normalizeError(error));
      return null;
    }
  };

  const startWeb = async (locale = 'en-US', resetTranscript = true) => {
    if (typeof window === 'undefined') {
      callbacks.onError?.('Speech recognition is unavailable in this environment');
      return false;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      callbacks.onError?.('Speech recognition is not supported in this browser');
      return false;
    }

    cleanupWebRecognition();

    const currentRecognition = new SpeechRecognitionCtor();
    recognition = currentRecognition;
    currentRecognition.continuous = true;
    currentRecognition.interimResults = true;
    currentRecognition.lang = locale;
    currentRecognition.maxAlternatives = 1;

    currentRecognition.onstart = () => {
      active = true;
      callbacks.onStart?.();
    };

    currentRecognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const value = normalizeTranscript(result[0]?.transcript ?? '');
        if (!value) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript += `${value} `;
        } else {
          interimTranscript += `${value} `;
        }
      }

      const finalized = normalizeTranscript(finalTranscript);
      const interim = normalizeTranscript(interimTranscript);

      if (finalized) {
        callbacks.onTranscript?.({
          transcript: finalized,
          source: 'web',
          isFinal: true,
        });
      }

      if (interim) {
        callbacks.onTranscript?.({
          transcript: interim,
          source: 'web',
          isFinal: false,
        });
      }
    };

    currentRecognition.onerror = (event) => {
      const message = event.error || event.message || 'Speech recognition error';
      if (isPermissionError(message)) {
        callbacks.onPermissionDenied?.();
      }
      callbacks.onError?.(message);
    };

    currentRecognition.onend = () => {
      active = false;
      callbacks.onEnd?.();
    };

    try {
      if (resetTranscript) {
        callbacks.onTranscript?.({ transcript: '', source: 'web', isFinal: true });
      }
      currentRecognition.start();
      return true;
    } catch (error) {
      callbacks.onError?.(normalizeError(error));
      return false;
    }
  };

  const startNative = async (locale = 'en-US', resetTranscript = true) => {
    const Voice = await ensureNativeVoice();
    if (!Voice) {
      return false;
    }

    try {
      if (resetTranscript) {
        callbacks.onTranscript?.({ transcript: '', source: 'native', isFinal: true });
      }
      await Voice.start(locale);
      return true;
    } catch (error) {
      callbacks.onError?.(normalizeError(error));
      return false;
    }
  };

  return {
    isSupported:
      isWeb
        ? typeof window !== 'undefined' &&
          Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
        : true,
    async start(options = {}) {
      const locale = options.locale || 'en-US';
      const resetTranscript = options.resetTranscript ?? true;

      if (active) {
        await this.stop();
      }

      return isWeb ? startWeb(locale, resetTranscript) : startNative(locale, resetTranscript);
    },
    async stop() {
      try {
        if (isWeb) {
          recognition?.stop();
          cleanupWebRecognition();
        } else {
          const Voice = await ensureNativeVoice();
          await Voice?.stop();
        }
      } catch {
        // ignore
      } finally {
        active = false;
        callbacks.onEnd?.();
      }
    },
    async abort() {
      try {
        if (isWeb) {
          recognition?.abort();
          cleanupWebRecognition();
        } else {
          const Voice = await ensureNativeVoice();
          await Voice?.cancel();
        }
      } catch {
        // ignore
      } finally {
        active = false;
        callbacks.onEnd?.();
      }
    },
    async destroy() {
      try {
        if (isWeb) {
          cleanupWebRecognition();
        } else if (nativeVoice) {
          const Voice = nativeVoice;
          try {
            await Voice.destroy();
          } catch {
            // ignore
          }
          try {
            await Voice.removeAllListeners();
          } catch {
            // ignore
          }

          Voice.onSpeechStart = null;
          Voice.onSpeechPartialResults = null;
          Voice.onSpeechResults = null;
          Voice.onSpeechError = null;
          Voice.onSpeechEnd = null;
          Voice.onSpeechVolumeChanged = null;
          nativeVoice = null;
        }
      } finally {
        active = false;
      }
    },
  };
}