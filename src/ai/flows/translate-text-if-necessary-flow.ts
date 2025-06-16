'use server';
/**
 * @fileOverview A text processing service that translates text to English if necessary.
 *
 * - translateTextIfNecessary - A function that handles text processing and translation.
 * - TranslateTextIfNecessaryInput - The input type for the translateTextIfNecessary function.
 * - TranslateTextIfNecessaryOutput - The return type for the translateTextIfNecessary function.
 */

import { Translate } from '@google-cloud/translate/build/src/v2';
import path from 'path';
import fs from 'fs';

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati'] as const;
type Language = typeof LANGUAGES[number];

// Map our language codes to Google Cloud Translation API language codes
const LANGUAGE_CODES = {
  'English': 'en',
  'Hindi': 'hi',
  'Marathi': 'mr',
  'Gujarati': 'gu',
} as const;

export interface TranslateTextIfNecessaryInput {
  text: string;
  sourceLanguage: Language;
}

export interface TranslateTextIfNecessaryOutput {
  englishText: string;
}

// Initialize the Translation client
const credentialsPath = path.join(process.cwd(), 'src/config/istl.json');
if (!fs.existsSync(credentialsPath)) {
  throw new Error(`GCP credentials file not found at: ${credentialsPath}`);
}

const translate = new Translate({
  keyFilename: credentialsPath,
});

export async function translateTextIfNecessary(
  input: TranslateTextIfNecessaryInput
): Promise<TranslateTextIfNecessaryOutput> {
  try {
    // If the text is already in English, return it as is
    if (input.sourceLanguage === 'English') {
      return { englishText: input.text };
    }

    // Translate the text to English
    const [translations] = await translate.translate(input.text, {
      from: LANGUAGE_CODES[input.sourceLanguage],
      to: 'en'
    });

    // Handle both single string and array responses
    const translation = Array.isArray(translations) ? translations[0] : translations;

    if (!translation) {
      throw new Error('Translation failed: No translation result received');
    }

    return { englishText: translation };
  } catch (error) {
    console.error('Translation error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
