import { Language, ImageStyle, UserInfo } from '../types/user';
import { Settings } from 'lucide-react';

interface StyleSettingsProps {
  userInfo: UserInfo;
  onUpdate: (updates: Partial<UserInfo>) => void;
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어'
};

const STYLE_NAMES: Record<ImageStyle, string> = {
  'realistic': 'Realistic',
  'watercolor': 'Watercolor',
  'oil-painting': 'Oil Painting',
  'digital-art': 'Digital Art',
  'minimalist': 'Minimalist',
  'abstract': 'Abstract',
  'pencil-sketch': 'Pencil Sketch',
  'pop-art': 'Pop Art',
  'japanese-art': 'Japanese Art',
  'cyberpunk': 'Cyberpunk'
};

const StyleSettings = ({ userInfo, onUpdate }: StyleSettingsProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-10 h-10">
      <div className="relative group inline-block">
        <button
          className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800/80 border border-gray-800/50 backdrop-blur-md transition-colors duration-200"
          aria-label="Settings"
        >
          <Settings size={20} className="text-gray-400" />
        </button>
        
        <div className="absolute right-0 mt-2 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transform transition-all duration-200 origin-top-right pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800/50 rounded-xl shadow-xl p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Language
              </label>
              <select
                value={userInfo.language}
                onChange={(e) => onUpdate({ language: e.target.value as Language })}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Image Style
              </label>
              <select
                value={userInfo.imageStyle}
                onChange={(e) => onUpdate({ imageStyle: e.target.value as ImageStyle })}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(STYLE_NAMES).map(([style, name]) => (
                  <option key={style} value={style}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleSettings;
