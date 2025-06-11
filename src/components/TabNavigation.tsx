import React from 'react';
import { Mic, Type, Upload } from 'lucide-react';
import { TabType } from '../types/speech';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'speech' as TabType, label: 'Speech Recording', icon: Mic },
    { id: 'text' as TabType, label: 'Text Input', icon: Type },
    { id: 'upload' as TabType, label: 'Audio Upload', icon: Upload },
  ];

  return (
    <div className="space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left text-sm
              ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;