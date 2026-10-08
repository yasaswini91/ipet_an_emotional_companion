import React from 'react';
import {
  Compass,
  MessageCircle,
  BookOpen,
  Heart,
  Brain,
  BarChart3,
  Sparkles,
  Settings,
  LogOut
} from 'lucide-react';
import WeatherDisplay from './WeatherDisplay';

export default function Navbar({
  currentTab,
  setCurrentTab,
  pet,
  user,
  weather,
  onLogout
}) {
  const tabs = [
    { id: 'world', label: "Today's World", icon: Compass },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'diary', label: 'Pet Diary', icon: BookOpen },
    { id: 'emotion', label: 'Emotion & Growth', icon: Heart },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'evaluation', label: 'Evaluation & Stats', icon: BarChart3 },
    { id: 'customization', label: 'Customization', icon: Sparkles }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Pet Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 flex items-center justify-center text-white font-bold text-xl shadow-md pet-brand">
            iP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-800 tracking-tight">
                {pet?.name || 'iPET'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold border border-rose-100">
                {pet?.breed || 'Companion'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Master: <span className="text-slate-700 font-semibold">{user?.name || user?.username || 'Master'}</span>
            </div>
          </div>
        </div>

        {/* Environmental System (Season & Weather) */}
        {weather && (
          <div className="hidden md:block">
            <WeatherDisplay weather={weather} />
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'text-slate-600 hover:text-rose-500 hover:bg-rose-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('settings')}
            className={`p-2 rounded-full transition-colors ${
              currentTab === 'settings' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
