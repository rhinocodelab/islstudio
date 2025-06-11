// Google Cloud Speech-to-Text service integration
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

export interface GCPTranscriptionResponse {
  success: boolean;
  transcription: TranscriptionResult;
  translation: TranslationResult;
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

// Transcribe audio using Google Cloud Speech-to-Text API
export const transcribeAudioWithGCP = async (
  audioBlob: Blob | File, 
  languageCode: string
): Promise<GCPTranscriptionResponse> => {
  console.log('🎙️ Frontend: Starting transcription request...');
  console.log('📊 Audio details:', {
    size: audioBlob.size,
    type: audioBlob.type,
    language: languageCode
  });

  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('languageCode', languageCode);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'same-origin',
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.message || `Transcription failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Frontend: Transcription successful');
    console.log('📝 Result:', result);

    // Validate response structure
    if (!result.success) {
      throw new Error(result.message || 'Transcription was not successful');
    }

    if (!result.transcription || !result.translation) {
      throw new Error('Invalid response format: missing transcription or translation data');
    }

    return result;

  } catch (error) {
    console.error('❌ Frontend transcription error:', error);
    throw error;
  }
};

// Utility function to check if GCP service is available
export const checkGCPServiceAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    });
    return response.ok;
  } catch (error) {
    console.warn('GCP service availability check failed:', error);
    return false;
  }
};

// Test GCP connection
export const testGCPConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/test-gcp', {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GCP connection test failed:', error);
    return { success: false, message: error.message };
  }
};