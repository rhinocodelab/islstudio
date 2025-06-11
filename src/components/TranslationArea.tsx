import React, { useState } from 'react';
import { Languages, Copy, ArrowRight, Loader, Globe } from 'lucide-react';
import { Language } from '../types/speech';
import { translateText, TranslationResult } from '../services/translationService';

interface TranslationAreaProps {
  sourceText: string;
  sourceLanguage: Language;
  availableLanguages: Language[];
}

const TranslationArea: React.FC<TranslationAreaProps> = ({
  sourceText,
  sourceLanguage,
  availableLanguages
}) => {
  // Always use English as target language
  const targetLanguage = availableLanguages.find(lang => lang.code === 'en-US') || availableLanguages[0];
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setError('');

    try {
      const result = await translateText(sourceText, sourceLanguage.code, targetLanguage.code);
      setTranslation(result);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyTranslation = async () => {
    if (translation?.translatedText) {
      try {
        await navigator.clipboard.writeText(translation.translatedText);
      } catch (err) {
        console.error('Failed to copy translation:', err);
      }
    }
  };

  // Reset translation when source text or source language changes
  React.useEffect(() => {
    setTranslation(null);
    setError('');
  }, [sourceText, sourceLanguage.code]);

  // Don't show translation area if source language is already English
  if (!sourceText.trim() || sourceLanguage.code === 'en-US') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Translation to English</h4>
            <p className="text-sm text-gray-600">Powered by Google Translate API</p>
          </div>
        </div>

        {/* Translation Controls */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">From:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {sourceLanguage.name}
              </span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">To:</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                English
              </span>
            </div>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Translating...</span>
              </>
            ) : (
              <>
                <Languages className="w-4 h-4" />
                <span className="text-sm">Translate to English</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Translation Result */}
        {translation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">English Translation:</span>
              <button
                onClick={copyTranslation}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {translation.translatedText}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(translation.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500">
                  Powered by Google Translate
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationArea;