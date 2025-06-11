import { Translate } from '@google-cloud/translate';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud Translation client
const translate = new Translate({
  keyFilename: path.join(process.cwd(), 'google-credentials.json')
});

// Handle translation request
export const handleTranslation = async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ 
        error: 'Missing required fields: text, sourceLanguage, or targetLanguage' 
      });
    }

    // Check if source and target languages are the same
    if (sourceLanguage === targetLanguage) {
      return res.json({
        success: true,
        translation: {
          text,
          sourceLanguage,
          targetLanguage,
          confidence: 1.0
        }
      });
    }

    console.log('🌐 Translation request:', {
      text: text.substring(0, 50) + '...',
      sourceLanguage,
      targetLanguage
    });

    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage
    });

    console.log('✅ Translation successful:', {
      original: text.substring(0, 50) + '...',
      translated: translation.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      translation: {
        text: translation,
        sourceLanguage,
        targetLanguage,
        confidence: 0.9 // Google Translate typically has high confidence
      }
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed', 
      details: error.message,
      code: error.code
    });
  }
}; 