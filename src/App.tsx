import React, { useState, useEffect } from 'react';
import { Mic2, Trash2 } from 'lucide-react';
import TabNavigation from './components/TabNavigation';
import LanguageSelector from './components/LanguageSelector';
import SpeechRecorder from './components/SpeechRecorder';
import TextInput from './components/TextInput';
import AudioUpload from './components/AudioUpload';
import { supportedLanguages } from './data/languages';
import { Language, TabType } from './types/speech';
import { clearAllTempFiles } from './services/audioService';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(supportedLanguages[0]);
  const [activeTab, setActiveTab] = useState<TabType>('speech');
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState('');

  const handleClearAllTempFiles = async () => {
    setIsClearing(true);
    setClearMessage('');
    
    try {
      const result = await clearAllTempFiles();
      if (result.success) {
        setClearMessage('✅ All temporary files cleared successfully!');
      } else {
        setClearMessage(`❌ Failed to clear files: ${result.message}`);
      }
    } catch (error) {
      setClearMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsClearing(false);
      // Clear message after 3 seconds
      setTimeout(() => setClearMessage(''), 3000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'speech':
        return (
          <SpeechRecorder 
            selectedLanguage={selectedLanguage} 
            availableLanguages={supportedLanguages}
          />
        );
      case 'text':
        return (
          <TextInput 
            selectedLanguage={selectedLanguage}
            availableLanguages={supportedLanguages}
          />
        );
      case 'upload':
        return (
          <AudioUpload 
            selectedLanguage={selectedLanguage}
            availableLanguages={supportedLanguages}
          />
        );
      default:
        return (
          <SpeechRecorder 
            selectedLanguage={selectedLanguage}
            availableLanguages={supportedLanguages}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                ISL Studio
              </h1>
              <p className="text-sm text-gray-500">
                AI-Powered Indian Sign Language Translation
              </p>
            </div>
          </div>
          
          {/* Clear All Button */}
          <div className="flex items-center space-x-4">
            {clearMessage && (
              <div className="text-sm font-medium text-gray-700">
                {clearMessage}
              </div>
            )}
            <button
              onClick={handleClearAllTempFiles}
              disabled={isClearing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Clearing...' : 'Clear All Temp Files'}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 h-[calc(100vh-73px-60px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Tab Navigation */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Mode</h3>
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            
            {/* Language Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Language Settings</h3>
              <LanguageSelector
                languages={supportedLanguages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            </div>
            
            {/* Info Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Platform Features</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Real-time speech recognition</li>
                <li>• Multi-language text input</li>
                <li>• Audio file processing</li>
                <li>• Google Cloud integration</li>
                <li>• Automatic translation to English</li>
                <li>• ISL video generation</li>
                <li>• Export capabilities</li>
              </ul>
            </div>

            {/* Cleanup Info */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-sm font-semibold text-red-900 mb-2">File Management</h4>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• Temporary recordings stored in temp_recordings/</li>
                <li>• Generated videos stored in temp_videos/</li>
                <li>• Use "Clear All Temp Files" to clean up</li>
                <li>• Files are automatically cleaned on tab switch</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'speech' && 'Speech Recording'}
                  {activeTab === 'text' && 'Text Input'}
                  {activeTab === 'upload' && 'Audio Upload'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeTab === 'speech' && 'Record your voice and convert to text with ISL video'}
                  {activeTab === 'text' && 'Type or paste text for processing and ISL generation'}
                  {activeTab === 'upload' && 'Upload audio files for transcription and ISL video'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Language:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedLanguage.name}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Mic2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">ISL Studio</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">
              Empowering communication through AI
            </span>
          </div>
          <div className="text-sm text-gray-500">
            © 2025 Sundyne Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;