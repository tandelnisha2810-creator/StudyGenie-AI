declare module 'react-native-voice' {
  export type SpeechStartEvent = { error?: string };
  export type SpeechEndEvent = { error?: string };
  export type SpeechErrorEvent = { error?: { message?: string; code?: string | number }; message?: string };
  export type SpeechResultsEvent = { value?: string[] };
  export type SpeechPartialResultsEvent = { value?: string[] };

  export interface VoiceModule {
    start(locale?: string): Promise<void>;
    stop(): Promise<void>;
    cancel(): Promise<void>;
    destroy(): Promise<void>;
    removeAllListeners(): Promise<void>;
    isAvailable(): Promise<boolean>;
    onSpeechStart?: ((event: SpeechStartEvent) => void) | null;
    onSpeechEnd?: ((event: SpeechEndEvent) => void) | null;
    onSpeechError?: ((event: SpeechErrorEvent) => void) | null;
    onSpeechResults?: ((event: SpeechResultsEvent) => void) | null;
    onSpeechPartialResults?: ((event: SpeechPartialResultsEvent) => void) | null;
    onSpeechVolumeChanged?: ((event: { value?: number }) => void) | null;
  }

  const Voice: VoiceModule;
  export default Voice;
}