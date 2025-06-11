import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Download, Copy, AlertCircle, Loader, Play, Square, Save, CheckCircle, Folder, Languages, ChevronDown, Globe, Video } from 'lucide-react';
import { Recording, TranscriptionResult, GCPTranscriptionResponse, Language, NLPTranslationResult } from '../types/speech.js';
import { transcribeAudioWithGCP } from '../services/speechService.js';
import { saveAudioToTempFolder, clearAllRecordings, clearAllTempFiles } from '../services/audioService.js';
import { processTranslation } from '../services/nlpService.js';
import ISLVideoPlayer from './ISLVideoPlayer.js';
import { supportedLanguages } from '../data/languages.js';

interface SpeechRecorderProps {
  selectedLanguage: Language;
  availableLanguages: Language[];
}

export const SpeechRecorder: React.FC<SpeechRecorderProps> = ({ selectedLanguage, availableLanguages }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [transcriptionResult, setTranscriptionResult] = useState<GCPTranscriptionResponse | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [savedFileName, setSavedFileName] = useState<string>('');
  const [savedFilePath, setSavedFilePath] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      setTranscriptionResult(null);
      setAudioBlob(null);
      setSavedFileName('');
      setSavedFilePath('');
      setSaveSuccess(false);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Auto-save the recording to temp_recordings folder
        setIsSaving(true);
        try {
          const saveResult = await saveAudioToTempFolder(audioBlob);
          setSavedFileName(saveResult.fileName);
          setSavedFilePath(saveResult.filePath);
          setSaveSuccess(true);
        } catch (saveError) {
          console.error('Failed to save audio file:', saveError);
          setError('Failed to save recording to temp_recordings folder');
        } finally {
          setIsSaving(false);
        }
        
        // Process with GCP Speech-to-Text
        await handleTranscription(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadAudio = () => {
    if (audioBlob && savedFileName) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = savedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const copyOriginalText = async () => {
    const originalText = transcriptionResult?.transcription?.text;
    if (originalText) {
      try {
        await navigator.clipboard.writeText(originalText);
      } catch (err) {
        console.error('Failed to copy original text:', err);
      }
    }
  };

  const copyTranslatedText = async () => {
    const translatedText = transcriptionResult?.translation?.text;
    if (translatedText) {
      try {
        await navigator.clipboard.writeText(translatedText);
      } catch (err) {
        console.error('Failed to copy translated text:', err);
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!transcriptionResult?.nlpTranslation?.text) {
      setError('No translation available for video generation');
      return;
    }

    setIsGeneratingVideo(true);
    setError('');
    setVideoUrl('');

    try {
      console.log('🎬 Starting video generation for text:', transcriptionResult.nlpTranslation.text);
      const response = await fetch('http://localhost:3001/api/generate-isl-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text: transcriptionResult.nlpTranslation.text })
      });

      console.log('📡 API Response status:', response.status);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      if (!data.videoUrl) {
        throw new Error('No video URL in response');
      }

      // Ensure the video URL is absolute
      const videoUrl = data.videoUrl.startsWith('/') 
        ? `${window.location.origin}${data.videoUrl}`
        : data.videoUrl;

      console.log('🎥 Generated video URL:', videoUrl);
      setVideoUrl(videoUrl);
    } catch (error) {
      console.error('❌ Error generating video:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleClearAllRecordings = async () => {
    try {
      await clearAllRecordings();
      
      // Clear local state
      setRecordings([]);
      setTranscriptionResult(null);
      setVideoUrl('');
      setError(null);
    } catch (error) {
      console.error('Error clearing recordings:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear recordings');
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError('');
    try {
      console.log('🎙️ Starting transcription with language:', selectedLanguage.gcpCode);
      const result = await transcribeAudioWithGCP(audioBlob, selectedLanguage.gcpCode);
      console.log('📝 Full transcription result received:', JSON.stringify(result, null, 2));
      
      // Validate the result structure
      if (result && typeof result === 'object') {
        if (result.success === false) {
          throw new Error(result.message || 'Transcription failed');
        }

        // Process NLP translation first
        const textToProcess = result.translation?.text || result.transcription?.text;
        let processedTranslation: NLPTranslationResult | undefined = undefined;
        
        if (textToProcess) {
          console.log('🔄 Processing text with NLP:', textToProcess);
          processedTranslation = processTranslation(textToProcess);
          console.log('✨ NLP processed result:', processedTranslation);
        }

        // Set the complete result with all data at once
        const finalResult: GCPTranscriptionResponse = {
          ...result,
          nlpTranslation: processedTranslation
        };
        
        console.log('Setting final transcription result:', finalResult);
        setTranscriptionResult(finalResult);
      } else {
        throw new Error('Invalid response format from transcription service');
      }
    } catch (err: any) {
      console.error('❌ Transcription error:', err);
      setError(`Failed to transcribe audio: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Debug logging for transcription result changes
  useEffect(() => {
    if (transcriptionResult) {
      console.log('Transcription result updated:', {
        hasResult: true,
        hasTranscription: !!transcriptionResult.transcription,
        hasTranslation: !!transcriptionResult.translation,
        hasNLPTranslation: !!transcriptionResult.nlpTranslation,
        transcriptionText: transcriptionResult.transcription?.text,
        translationText: transcriptionResult.translation?.text,
        nlpTranslationText: transcriptionResult.nlpTranslation?.text
      });
    }
  }, [transcriptionResult]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Recording Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-6xl mx-auto">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-5">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing || isSaving}
                className={`
                  relative w-32 h-32 rounded-full transition-all duration-300 transform
                  flex items-center justify-center text-white shadow-lg
                  ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 scale-110'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {isProcessing ? (
                  <Loader className="w-10 h-10 animate-spin" />
                ) : isSaving ? (
                  <Save className="w-10 h-10 animate-pulse" />
                ) : isRecording ? (
                  <Square className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
                )}
              </button>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {isProcessing 
                  ? 'Processing with Google Cloud AI...' 
                  : isSaving
                  ? 'Saving Recording...'
                  : isRecording 
                  ? 'Recording in Progress' 
                  : 'Ready to Record'
                }
              </h3>
              <p className="text-gray-600 text-lg">
                {isProcessing 
                  ? 'Converting speech to text and translating to English' 
                  : isSaving
                  ? 'Automatically saving your recording to temp_recordings folder'
                  : isRecording 
                  ? 'Click the button again to stop recording' 
                  : `Click the microphone to start recording in ${selectedLanguage.name}`
                }
              </p>
            </div>

            {/* Auto-save notification */}
            {saveSuccess && savedFileName && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-medium">Recording saved successfully!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Recording Error</p>
          </div>
          <p className="text-red-600 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Transcription Results */}
      {transcriptionResult && (
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Combined Text Card */}
              <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200 h-full">
                <h3 className="text-lg font-semibold mb-4">Text Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Original Text</h4>
                    <p className="text-gray-700">
                      {transcriptionResult?.transcription?.text || 'No transcription available'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">NLP Translation</h4>
                    <p className="text-gray-700">
                      {typeof transcriptionResult?.nlpTranslation === 'object' && transcriptionResult?.nlpTranslation?.text
                        ? transcriptionResult.nlpTranslation.text
                        : 'No NLP translation available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ISL Video Generation Card */}
              <div className="flex-1 h-full">
                <div className="h-full">
                  <ISLVideoPlayer 
                    text={transcriptionResult?.nlpTranslation?.text || transcriptionResult?.translation?.text || ''}
                    language={selectedLanguage.name}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Controls */}
      {transcriptionResult && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8 max-w-6xl mx-auto">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Saved as: {savedFileName}</span>
                </div>
                <span>Language: {selectedLanguage.name}</span>
              </div>
              {audioBlob && savedFileName && (
                <button
                  onClick={downloadAudio}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  <span>Download Audio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {/* {process.env.NODE_ENV === 'development' && transcriptionResult && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-8 max-w-6xl mx-auto">
          <button
            onClick={() => setIsDebugExpanded(!isDebugExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-yellow-800">Debug Information</h4>
            <ChevronDown className={`w-5 h-5 text-yellow-600 transition-transform ${isDebugExpanded ? 'transform rotate-180' : ''}`} />
          </button>
          {isDebugExpanded && (
            <pre className="text-xs text-yellow-700 overflow-auto mt-2">
              {JSON.stringify(transcriptionResult, null, 2)}
            </pre>
          )}
        </div>
      )} */}
    </div>
  );
};

export default SpeechRecorder;