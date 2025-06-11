// Translation service for converting text between languages
export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

// Mock translation function - replace with actual Google Translate API integration
export const translateText = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock translations to English for demonstration
  const translations: Record<string, string> = {
    'hi-IN': 'This is the English translation of the Hindi text.',
    'mr-IN': 'This is the English translation of the Marathi text.',
    'gu-IN': 'This is the English translation of the Gujarati text.'
  };

  // If source is already English, return original text
  if (sourceLanguage === 'en-US') {
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1.0
    };
  }

  // Get mock translation or create a fallback
  const translatedText = translations[sourceLanguage] || 
    `[English translation of ${sourceLanguage} text]: ${text}`;

  return {
    translatedText,
    sourceLanguage,
    targetLanguage: 'en-US',
    confidence: 0.92
  };
};

// Real implementation with CORS support
export const translateTextWithAPI = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult> => {
  const requestBody = {
    text,
    sourceLanguage,
    targetLanguage
  };

  const response = await fetch('/api/translate', {
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
    throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Utility function to handle API errors with CORS considerations
export const handleAPIError = (error: any): string => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error: Please check your internet connection and CORS configuration.';
  }
  
  if (error.message.includes('CORS')) {
    return 'CORS error: The server needs to allow cross-origin requests.';
  }
  
  return error.message || 'An unexpected error occurred.';
};