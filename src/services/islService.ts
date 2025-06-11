// ISL (Indian Sign Language) video generation service
export interface ISLVideoResult {
  videoUrl: string;
  duration: number;
  language: string;
  confidence: number;
}

// Mock ISL video generation function
export const generateISLVideo = async (
  text: string,
  language: string
): Promise<ISLVideoResult> => {
  // Simulate ISL video generation API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Mock video generation result
  return {
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: Math.ceil(text.length / 10), // Approximate duration based on text length
    language,
    confidence: 0.88
  };
};

// Real implementation with CORS support
export const generateISLVideoWithAPI = async (
  text: string,
  language: string
): Promise<ISLVideoResult> => {
  const requestBody = {
    text,
    language,
    format: 'mp4',
    quality: 'hd'
  };

  const response = await fetch('/api/generate-isl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
    mode: 'cors', // Enable CORS
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`ISL generation failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Check if ISL service is available
export const checkISLServiceAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/isl-status', {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    });
    return response.ok;
  } catch (error) {
    console.warn('ISL service availability check failed:', error);
    return false;
  }
};