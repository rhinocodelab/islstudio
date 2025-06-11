import pkg from '@google-cloud/speech';
const { SpeechClient } = pkg;

import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud clients with service account key
const keyFilename = path.join(__dirname, '../istl.json');

console.log('🔑 Looking for GCP credentials at:', keyFilename);

// Check if credentials file exists and handle gracefully
let speechClient = null;
let translateClient = null;
let gcpAvailable = false;

if (fs.existsSync(keyFilename)) {
  console.log('✅ GCP credentials file found, initializing clients...');
  
  try {
    // Set environment variable for Google Cloud authentication
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename;

    speechClient = new SpeechClient({
      keyFilename: keyFilename,
    });

    translateClient = new Translate({
      keyFilename: keyFilename,
    });
    
    gcpAvailable = true;
    console.log('✅ GCP clients initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize GCP clients:', error.message);
    gcpAvailable = false;
  }
} else {
  console.warn('⚠️ GCP credentials file not found at:', keyFilename);
  console.warn('⚠️ Google Cloud services will not be available');
  console.warn('💡 To enable GCP services, place your service account key file at:', keyFilename);
  gcpAvailable = false;
}

// Test GCP connection
const testGCPConnection = async () => {
  if (!gcpAvailable) {
    console.log('⚠️ GCP services not available - credentials file missing');
    return false;
  }

  try {
    console.log('🧪 Testing Google Cloud APIs...');
    
    // Test Translation API with a simple translation
    const [translation] = await translateClient.translate('Hello', 'hi');
    console.log('✅ Translation API working. Test result:', translation);
    
    console.log('✅ GCP APIs are ready');
    return true;
  } catch (error) {
    console.error('❌ GCP API test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Detect audio format from buffer
const detectAudioFormat = (buffer) => {
  const header = buffer.toString('hex', 0, 12).toLowerCase();
  
  if (header.includes('52494646')) { // RIFF header (WAV)
    return { encoding: 'LINEAR16', sampleRate: 16000 };
  } else if (header.includes('664c6143')) { // fLaC header
    return { encoding: 'FLAC', sampleRate: 16000 };
  } else if (header.includes('4f676753')) { // OggS header
    return { encoding: 'OGG_OPUS', sampleRate: 16000 };
  } else if (header.includes('1a45dfa3')) { // WebM header
    return { encoding: 'WEBM_OPUS', sampleRate: 48000 };
  } else {
    // Default to WEBM_OPUS for unknown formats
    return { encoding: 'WEBM_OPUS', sampleRate: 48000 };
  }
};

// Transcribe audio using Google Cloud Speech-to-Text
const transcribeAudio = async (audioBuffer, languageCode = 'en-US') => {
  if (!gcpAvailable || !speechClient) {
    throw new Error('Google Cloud Speech-to-Text service is not available. Please configure GCP credentials.');
  }

  try {
    console.log(`🎙️ Starting transcription...`);
    console.log(`📊 Audio buffer size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`🌍 Language: ${languageCode}`);
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty');
    }

    // Detect audio format
    const { encoding, sampleRate } = detectAudioFormat(audioBuffer);
    console.log(`🎵 Detected format: ${encoding}, Sample rate: ${sampleRate}Hz`);
    
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRate,
        languageCode: languageCode,
        alternativeLanguageCodes: ['en-US', 'hi-IN', 'mr-IN', 'gu-IN'],
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long',
        useEnhanced: true,
        maxAlternatives: 1,
      },
    };

    console.log('📤 Sending request to Google Cloud Speech-to-Text...');
    const [response] = await speechClient.recognize(request);
    
    console.log('📥 Raw GCP response:', JSON.stringify(response, null, 2));
    
    if (!response.results || response.results.length === 0) {
      throw new Error('No speech detected in audio. Please speak clearly and try again.');
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join(' ');

    const confidence = response.results.length > 0 
      ? response.results[0].alternatives[0].confidence || 0.8
      : 0.8;

    const detectedLanguage = response.results[0]?.languageCode || languageCode;

    console.log(`✅ Transcription successful!`);
    console.log(`📝 Text: "${transcription}"`);
    console.log(`📊 Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`🌍 Detected language: ${detectedLanguage}`);

    return {
      text: transcription.trim(),
      confidence: confidence,
      language: languageCode,
      detectedLanguage: detectedLanguage
    };
  } catch (error) {
    console.error('❌ Speech-to-Text error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

// Translate text to English using Google Translate
const translateToEnglish = async (text, sourceLanguage) => {
  if (!gcpAvailable || !translateClient) {
    console.warn('⚠️ Google Translate service not available, returning original text');
    return {
      translatedText: text,
      sourceLanguage: sourceLanguage,
      targetLanguage: 'en',
      confidence: 0.5,
      error: 'Google Cloud Translation service not available'
    };
  }

  try {
    console.log(`🔄 Starting translation...`);
    console.log(`📝 Source text: "${text}"`);
    console.log(`🌍 Source language: ${sourceLanguage}`);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text to translate');
    }
    
    // Map language codes for Google Translate
    const langMap = {
      'hi-IN': 'hi',
      'mr-IN': 'mr', 
      'gu-IN': 'gu',
      'en-US': 'en',
      'en': 'en'
    };

    const sourceLang = langMap[sourceLanguage] || sourceLanguage.split('-')[0];
    console.log(`🔄 Using source language code: ${sourceLang} -> en`);
    
    // Skip translation API call for English to English
    if (sourceLang === 'en') {
      console.log('⏭️ Text is already in English, skipping translation API call');
      return {
        translatedText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: 'en',
        confidence: 1.0
      };
    }
    
    // Only call translation API for non-English to English translation
    const [translation] = await translateClient.translate(text, {
      from: sourceLang,
      to: 'en',
    });

    console.log(`✅ Translation successful!`);
    console.log(`📝 Translated text: "${translation}"`);

    return {
      translatedText: translation.trim(),
      sourceLanguage: sourceLanguage,
      targetLanguage: 'en',
      confidence: 0.95
    };
  } catch (error) {
    console.error('❌ Translation error:', error);
    
    // Fallback: return original text if translation fails
    console.log('🔄 Translation failed, returning original text as fallback');
    return {
      translatedText: text,
      sourceLanguage: sourceLanguage,
      targetLanguage: 'en',
      confidence: 0.5,
      error: error.message
    };
  }
};

export {
  transcribeAudio,
  translateToEnglish,
  testGCPConnection,
  gcpAvailable
};