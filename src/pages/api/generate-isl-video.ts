import type { NextApiRequest, NextApiResponse } from 'next';
import { ISLVideoService } from '../../services/islVideoService';
import path from 'path';

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
};

type ResponseData = {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Set headers
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
    return;
  }

  try {
    // Validate request body
    const { text } = req.body;
    console.log('Received request to generate ISL video for text:', text);

    if (!text || typeof text !== 'string') {
      console.error('Invalid text input:', text);
      res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
      return;
    }

    // Initialize service and generate video
    const islService = new ISLVideoService();
    console.log('Generating video sequence...');
    const result = await islService.generateVideoSequence(text);
    console.log('Video generation result:', result);

    // Convert the absolute path to a relative URL path
    const videoUrl = result.videoPath
      .replace(process.cwd(), '')
      .replace(/\\/g, '/')
      .replace(/^\/public/, ''); // Remove /public prefix for Next.js static serving

    console.log('Generated video URL:', videoUrl);

    // Send success response
    res.status(200).json({
      success: true,
      videoUrl,
      duration: result.duration
    });
  } catch (error) {
    console.error('Error in generate-isl-video API:', error);
    
    // Send error response
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate ISL video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 