import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { saveAudioFile, listRecordings, deleteRecording, clearAllRecordings, clearAllRecordingsHandler } from './audioHandler.js';
import { transcribeAudio, translateToEnglish, testGCPConnection } from './speechService.js';
import { ISLVideoService } from '../src/services/islVideoService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize ISL Video Service
const islVideoService = new ISLVideoService();

// Audio file management routes
app.post('/api/save-audio', saveAudioFile);
app.get('/api/list-recordings', listRecordings);
app.delete('/api/delete-recording', deleteRecording);
app.delete('/api/clear-recordings', clearAllRecordingsHandler);

// Speech-to-Text transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  console.log('\n🎙️ === NEW TRANSCRIPTION REQUEST ===');
  
  try {
    if (!req.file) {
      console.log('❌ No audio file provided in request');
      return res.status(400).json({ 
        success: false,
        error: 'No audio file provided',
        message: 'Please upload an audio file'
      });
    }

    const { languageCode = 'en-US' } = req.body;
    const audioBuffer = req.file.buffer;

    console.log(`📋 Request details:`);
    console.log(`   Original name: ${req.file.originalname || 'audio-recording'}`);
    console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Language: ${languageCode}`);
    console.log(`   MIME Type: ${req.file.mimetype}`);

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio file is empty or corrupted');
    }

    // Step 1: Transcribe audio using Google Cloud Speech-to-Text
    console.log('\n🔄 STEP 1: Transcribing audio...');
    const transcriptionResult = await transcribeAudio(audioBuffer, languageCode);
    
    if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
      throw new Error('No speech detected in the audio file');
    }
    
    // Step 2: Translate to English if not already in English
    console.log('\n🔄 STEP 2: Translating to English...');
    const translationResult = await translateToEnglish(
      transcriptionResult.text, 
      transcriptionResult.detectedLanguage || languageCode
    );

    // Prepare response
    const response = {
      success: true,
      transcription: {
        text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        language: transcriptionResult.detectedLanguage || languageCode
      },
      translation: {
        text: translationResult.translatedText,
        sourceLanguage: translationResult.sourceLanguage,
        targetLanguage: translationResult.targetLanguage,
        confidence: translationResult.confidence
      },
      timestamp: new Date().toISOString(),
      processingInfo: {
        originalLanguage: languageCode,
        detectedLanguage: transcriptionResult.detectedLanguage,
        audioSize: audioBuffer.length,
        mimeType: req.file.mimetype
      }
    };

    console.log('\n✅ === TRANSCRIPTION COMPLETED SUCCESSFULLY ===');
    console.log(`📝 Original (${transcriptionResult.detectedLanguage}): "${transcriptionResult.text}"`);
    console.log(`🔄 English: "${translationResult.translatedText}"`);
    console.log('🎙️ === END REQUEST ===\n');
    
    res.json(response);

  } catch (error) {
    console.error('\n❌ === TRANSCRIPTION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('🎙️ === END REQUEST ===\n');
    
    res.status(500).json({ 
      success: false,
      error: 'Transcription failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// GCP connection test endpoint
app.get('/api/test-gcp', async (req, res) => {
  try {
    console.log('🧪 Testing GCP connection...');
    const isConnected = await testGCPConnection();
    res.json({ 
      success: isConnected, 
      message: isConnected ? 'GCP APIs are working correctly' : 'GCP API connection failed',
      credentialsFile: 'istl.json',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ GCP test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'GCP connection test failed',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ISL Studio API Server is running',
    gcpCredentials: 'istl.json loaded',
    timestamp: new Date().toISOString()
  });
});

// ISL Video Generation endpoint
app.post('/api/generate-isl-video', async (req, res) => {
  console.log('📹 Received ISL video generation request');
  
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      console.error('❌ Invalid text input:', text);
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log('🎬 Generating video sequence for text:', text);
    const result = await islVideoService.generateVideoSequence(text);
    console.log('✅ Video generation completed:', result);

    // Convert the absolute path to a relative URL path
    const videoUrl = result.videoPath
      .replace(process.cwd(), '')
      .replace(/\\/g, '/')
      .replace(/^\/public/, ''); // Remove /public prefix

    console.log('🔗 Generated video URL:', videoUrl);

    res.json({
      success: true,
      videoUrl,
      duration: result.duration
    });
  } catch (error) {
    console.error('❌ Error generating ISL video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ISL video',
      details: error.message
    });
  }
});

// Clear temporary videos endpoint
app.post('/api/clear-temp-videos', async (req, res) => {
  try {
    await islVideoService.cleanupTempVideos();
    res.json({ success: true, message: 'All temporary videos cleared successfully' });
  } catch (error) {
    console.error('Error clearing temporary videos:', error);
    res.status(500).json({ success: false, error: 'Failed to clear temporary videos' });
  }
});

// Clear all temporary files endpoint (both recordings and videos)
app.delete('/api/clear-all-temp', async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of all temporary files...');
    
    // Clear recordings
    const recordingsResult = await clearAllRecordings();
    console.log('📁 Recordings cleanup result:', recordingsResult);
    
    // Clear videos
    await islVideoService.cleanupTempVideos();
    console.log('🎥 Videos cleanup completed');
    
    res.json({ 
      success: true, 
      message: 'All temporary files (recordings and videos) cleared successfully',
      details: {
        recordings: recordingsResult.message || 'Cleared',
        videos: 'Cleared'
      }
    });
  } catch (error) {
    console.error('❌ Error clearing all temporary files:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear all temporary files',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server and test GCP connection
app.listen(PORT, async () => {
  console.log(`\n🚀 === ISL STUDIO API SERVER STARTING ===`);
  console.log(`🎙️ Server running on port ${PORT}`);
  console.log(`📁 Audio files saved to: ${path.join(__dirname, '../public/temp_recordings')}`);
  console.log(`🔑 Using GCP credentials: ${path.join(__dirname, '../istl.json')}`);
  console.log(`🤖 Google Cloud Speech-to-Text & Translation APIs integrated`);
  console.log(`🌐 Server ready at: http://localhost:${PORT}`);
  
  // Test GCP connection on startup
  console.log(`\n🧪 Testing GCP APIs on startup...`);
  try {
    const gcpWorking = await testGCPConnection();
    if (gcpWorking) {
      console.log(`✅ GCP APIs are ready and working!`);
    } else {
      console.log(`❌ GCP APIs are not working - check credentials and internet connection`);
    }
  } catch (error) {
    console.log(`❌ GCP startup test failed:`, error.message);
  }
  
  console.log(`🚀 === SERVER STARTUP COMPLETE ===\n`);
});

export default app;