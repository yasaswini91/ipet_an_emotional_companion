import React from 'react';
import { Bell, LogOut, Sun, CloudRain, Cloud, Snowflake, User, Sparkles } from 'lucide-react';

export default function TopNav({
  user,
  pet,
  weather,
  currentTab,
  onLogout
}) {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'home': return 'Home Dashboard';
      case 'chat': return 'Interactive Dialogue (NLP)';
      case 'pet': return 'Pet Profile & Growth';
      case 'world': return 'Virtual World Simulation (T1/T2/T3)';
      case 'games': return 'Mini Games & Play';
      case 'study': return 'Study Assistant & Focus Timer';
      case 'journal': return "Pet Diary & Master's Notes";
      case 'roadmap': return 'Daily Tasks & Journey Roadmap';
      case 'memories': return 'Cognitive Memory Management';
      case 'evaluation': return 'LLM-as-a-Judge Evaluation';
      case 'settings': return 'System Settings';
      default: return 'PawMate';
    }
  };

  const getWeatherIcon = () => {
    const cond = weather?.weather?.toLowerCase() || 'sunny';
    if (cond.includes('rain')) return <CloudRain className="w-4 h-4 text-sky-500 animate-bounce" />;
    if (cond.includes('snow')) return <Snowflake className="w-4 h-4 text-indigo-400" />;
    if (cond.includes('cloud')) return <Cloud className="w-4 h-4 text-slate-400" />;
    return <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />;
  };

  return (
    <header className="h-16 bg-white/75 backdrop-blur-xl border-b border-rose-100/70 px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_4px_16px_rgba(255,182,193,0.08)]">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {getTabTitle()}
        </h2>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Companion: <strong className="text-slate-600 font-semibold">{pet?.name || 'Pet'}</strong> ({pet?.breed || 'Cat'})
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Weather Pill matching screenshot: "Coimbatore 28°C Sunny" */}
        {weather && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
            {getWeatherIcon()}
            <span>{weather.weather || 'Sunny'}</span>
            <span className="text-slate-400">|</span>
            <span className="font-bold text-amber-600">{weather.temperature || '28°C'}</span>
          </div>
        )}

        {/* User Profile Pill matching screenshot */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="text-xs font-bold text-slate-800 hidden md:inline">
            {user?.name || user?.username || 'Akshitha'}
          </span>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
