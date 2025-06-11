import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Language } from '../types/speech';

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Globe className="w-4 h-4" />
        <span>Source Language</span>
      </div>
      <div className="relative">
        <select
          value={selectedLanguage.code}
          onChange={(e) => {
            const language = languages.find(lang => lang.code === e.target.value);
            if (language) {
              onLanguageChange(language);
            }
          }}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;