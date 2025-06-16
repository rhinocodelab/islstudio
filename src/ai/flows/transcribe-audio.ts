'use server';

/**
 * @fileOverview A voice transcription service using Google Cloud Speech-to-Text API.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { SpeechClient } from '@google-cloud/speech';
import path from 'path';
import fs from 'fs';

export interface TranscribeAudioInput {
  audioDataUri: string;
  sourceLanguage: string;
}

export async function transcribeAudio(input: TranscribeAudioInput) {
  try {
    // Read the istl.json credentials
    const credentialsPath = path.resolve(process.cwd(), 'src/config/istl.json');
    console.log('Using credentials from:', credentialsPath);
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Initialize the Speech client with the credentials
    const client = new SpeechClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    // Convert base64 to buffer
    const audioBytes = input.audioDataUri.split(',')[1];
    const audioBuffer = Buffer.from(audioBytes, 'base64');

    const [response] = await client.recognize({
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: input.sourceLanguage === 'English' ? 'en-US' : 'hi-IN',
      },
    });

    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n');

    return { transcription };
  } catch (error) {
    console.error('Transcription error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
