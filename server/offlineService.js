// Offline fallback service for when GCP APIs are not available
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock transcription service for offline mode
export const offlineTranscribe = async (audioBuffer, languageCode) => {
  console.log('🔌 Using offline transcription fallback');
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock transcription based on language
  const mockTranscriptions = {
    'en-US': 'This is a mock transcription in English for offline mode.',
    'hi-IN': 'यह ऑफलाइन मोड के लिए हिंदी में एक मॉक ट्रांसक्रिप्शन है।',
    'mr-IN': 'हे ऑफलाइन मोडसाठी मराठीत एक मॉक ट्रान्सक्रिप्शन आहे।',
    'gu-IN': 'આ ઓફલાઇન મોડ માટે ગુજરાતીમાં એક મોક ટ્રાન્સક્રિપ્શન છે।'
  };
  
  const transcriptionText = mockTranscriptions[languageCode] || mockTranscriptions['en-US'];
  
  return {
    text: transcriptionText,
    confidence: 0.85,
    detectedLanguage: languageCode
  };
};

// Mock translation service for offline mode
export const offlineTranslate = async (text, sourceLanguage) => {
  console.log('🔌 Using offline translation fallback');
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // If already English, return as is
  if (sourceLanguage === 'en-US' || sourceLanguage === 'en') {
    return {
      translatedText: text,
      sourceLanguage: sourceLanguage,
      targetLanguage: 'en',
      confidence: 1.0
    };
  }
  
  // Mock English translations
  const mockTranslations = {
    'hi-IN': 'This is a mock English translation of Hindi text for offline mode.',
    'mr-IN': 'This is a mock English translation of Marathi text for offline mode.',
    'gu-IN': 'This is a mock English translation of Gujarati text for offline mode.'
  };
  
  const translatedText = mockTranslations[sourceLanguage] || 
    `Mock English translation of ${sourceLanguage} text: ${text}`;
  
  return {
    translatedText,
    sourceLanguage: sourceLanguage,
    targetLanguage: 'en',
    confidence: 0.80
  };
};

// Check if we're in offline mode
export const isOfflineMode = () => {
  // You can set this environment variable to force offline mode
  return process.env.OFFLINE_MODE === 'true' || !process.env.GOOGLE_APPLICATION_CREDENTIALS;
};

// Test internet connectivity
export const testInternetConnection = async () => {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.log('🌐 No internet connection detected');
    return false;
  }
};