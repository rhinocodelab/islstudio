import React, { useState } from 'react';
import { Copy, Type, AlertCircle, Trash2 } from 'lucide-react';
import { Language } from '../types/speech';
import TranslationArea from './TranslationArea';
import ISLVideoPlayer from './ISLVideoPlayer';

interface TextInputProps {
  selectedLanguage: Language;
  availableLanguages: Language[];
}

const TextInput: React.FC<TextInputProps> = ({ selectedLanguage, availableLanguages }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const copyText = async () => {
    if (inputText) {
      try {
        await navigator.clipboard.writeText(inputText);
        setError('');
      } catch (err) {
        setError('Failed to copy text');
        console.error('Failed to copy text:', err);
      }
    }
  };

  const clearText = () => {
    setInputText('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Text Input Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Type className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Text Input</h3>
                <p className="text-sm text-gray-600">Type or paste your text in {selectedLanguage.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Start typing in ${selectedLanguage.name}...`}
              className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
              style={{
                direction: selectedLanguage.code.includes('hi') || selectedLanguage.code.includes('mr') || selectedLanguage.code.includes('gu') ? 'ltr' : 'ltr'
              }}
            />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {inputText.length} characters
                </span>
                <span className="text-sm text-gray-500">
                  Language: {selectedLanguage.name}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearText}
                  disabled={!inputText}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={copyText}
                  disabled={!inputText}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Error</p>
          </div>
          <p className="text-red-600 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Text Preview */}
      {inputText && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Text Preview</h4>
              <div className="text-sm text-gray-500">
                Source: {selectedLanguage.name}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] border border-gray-200">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {inputText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ISL Video Generation */}
      {inputText && (
        <ISLVideoPlayer 
          text={inputText} 
          language={selectedLanguage.name}
        />
      )}

      {/* Translation Area */}
      {inputText && (
        <TranslationArea
          sourceText={inputText}
          sourceLanguage={selectedLanguage}
          availableLanguages={availableLanguages}
        />
      )}
    </div>
  );
};

export default TextInput;