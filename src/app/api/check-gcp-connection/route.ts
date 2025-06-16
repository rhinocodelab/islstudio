import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import path from 'path';

export async function GET() {
  try {
    const client = new SpeechClient({
      keyFilename: path.join(process.cwd(), 'src/config/istl.json'),
    });
    
    // Try to make a simple API call to check connectivity
    await client.getProjectId();
    
    return NextResponse.json({ 
      status: 'connected',
      message: 'Successfully connected to Google Cloud Speech API'
    });
  } catch (error) {
    console.error('GCP Connection Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 