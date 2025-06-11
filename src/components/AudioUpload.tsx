import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, Download, Copy, AlertCircle, Loader, X, UploadCloud as CloudUpload, Mic, Languages } from 'lucide-react';
import { Language } from '../types/speech';
import { transcribeAudioWithGCP, GCPTranscriptionResponse } from '../services/speechService';
import { clearAllRecordings } from '../services/audioService';
import ISLVideoPlayer from './ISLVideoPlayer';

interface AudioUploadProps {
  selectedLanguage: Language;
  availableLanguages: Language[];
}

const AudioUpload: React.FC<AudioUploadProps> = ({ selectedLanguage, availableLanguages }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<GCPTranscriptionResponse | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Check file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    setTranscriptionResult(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const processAudio = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError('');

    try {
      console.log('🎙️ Processing uploaded file:', uploadedFile.name);
      console.log('📊 File details:', {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        language: selectedLanguage.gcpCode
      });

      const result = await transcribeAudioWithGCP(uploadedFile, selectedLanguage.gcpCode);
      console.log('📝 Upload transcription result:', JSON.stringify(result, null, 2));
      
      // Validate the result structure
      if (result && typeof result === 'object') {
        if (result.success === false) {
          throw new Error(result.message || 'Transcription failed');
        }
        setTranscriptionResult(result);
      } else {
        throw new Error('Invalid response format from transcription service');
      }
    } catch (err) {
      console.error('❌ Upload transcription error:', err);
      setError(`Failed to transcribe audio: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setTranscriptionResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Debug logging for transcription result
  useEffect(() => {
    if (transcriptionResult) {
      console.log('🔍 Upload transcription result state:', {
        hasResult: !!transcriptionResult,
        hasTranscription: !!transcriptionResult.transcription,
        hasTranslation: !!transcriptionResult.translation,
        transcriptionText: transcriptionResult.transcription?.text,
        translationText: transcriptionResult.translation?.text,
        fullResult: transcriptionResult
      });
    }
  }, [transcriptionResult]);

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CloudUpload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audio File Upload</h3>
              <p className="text-sm text-gray-600">Upload audio file for {selectedLanguage.name} transcription</p>
            </div>
          </div>

          {!uploadedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-700 mb-2">
                Drop your audio file here
              </h4>
              <p className="text-gray-500 mb-4">
                or click to browse from your computer
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Supports: MP3, WAV, M4A, FLAC • Maximum size: 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={processAudio}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing Audio...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-5 h-5" />
                      <span>Transcribe Audio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Upload Error</p>
          </div>
          <p className="text-red-600 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && transcriptionResult && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Information</h4>
          <pre className="text-xs text-yellow-700 overflow-auto">
            {JSON.stringify(transcriptionResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Dual Panel Transcription Results */}
      {(transcriptionResult || isProcessing) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Text Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Original Text</h4>
                    <p className="text-sm text-gray-600">{selectedLanguage.name}</p>
                  </div>
                </div>
                {transcriptionResult?.transcription?.text && (
                  <button
                    onClick={copyOriginalText}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 min-h-[120px] border border-blue-200">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Transcribing audio...</span>
                  </div>
                ) : transcriptionResult?.transcription?.text ? (
                  <div>
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {transcriptionResult.transcription.text}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Confidence: {Math.round((transcriptionResult.transcription.confidence || 0) * 100)}%</span>
                      <span>Language: {transcriptionResult.transcription.language}</span>
                    </div>
                  </div>
                ) : transcriptionResult ? (
                  <div className="text-center">
                    <p className="text-red-600 mb-2">No transcription text found</p>
                    <p className="text-xs text-gray-500">Check console for debug information</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Original transcribed text will appear here...</p>
                )}
              </div>
            </div>
          </div>

          {/* English Translation Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Languages className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">English Translation</h4>
                    <p className="text-sm text-gray-600">Automatic translation</p>
                  </div>
                </div>
                {transcriptionResult?.translation?.text && (
                  <button
                    onClick={copyTranslatedText}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 min-h-[120px] border border-green-200">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 animate-spin text-green-600 mr-3" />
                    <span className="text-gray-600">Translating to English...</span>
                  </div>
                ) : transcriptionResult?.translation?.text ? (
                  <div>
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {transcriptionResult.translation.text}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Translation Confidence: {Math.round((transcriptionResult.translation.confidence || 0) * 100)}%</span>
                      <span>Google Cloud AI</span>
                    </div>
                  </div>
                ) : transcriptionResult ? (
                  <div className="text-center">
                    <p className="text-red-600 mb-2">No translation text found</p>
                    <p className="text-xs text-gray-500">Check console for debug information</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">English translation will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISL Video Generation */}
      {transcriptionResult?.translation?.text && (
        <ISLVideoPlayer 
          text={transcriptionResult.translation.text} 
          language="English"
        />
      )}
    </div>
  );
};

export default AudioUpload;