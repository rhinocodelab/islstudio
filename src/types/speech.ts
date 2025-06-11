export interface Language {
  code: string;
  name: string;
  flag: string;
  gcpCode: string;
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  transcript: string;
  confidence: number;
}

export interface Recording {
  id: string;
  fileName: string;
  filePath: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
}

export interface TranslationResult {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface NLPTranslationResult {
  text: string;
  confidence: number;
}

export interface GCPTranscriptionResponse {
  success: boolean;
  transcription: TranscriptionResult;
  translation: TranslationResult;
  nlpTranslation?: NLPTranslationResult;
  timestamp?: string;
  processingInfo?: {
    originalLanguage: string;
    detectedLanguage: string;
    audioSize: number;
    mimeType: string;
  };
  message?: string;
  error?: string;
}

export type TabType = 'speech' | 'text' | 'upload';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}