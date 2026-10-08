import React from 'react';
import {
  Home,
  MessageCircle,
  Heart,
  Compass,
  Gamepad2,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Brain,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';
import PetVisual from './PetVisual';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  pet,
  emotion
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'pet', label: 'Pet', icon: Heart },
    { id: 'world', label: 'World', icon: Compass },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'study', label: 'Study', icon: GraduationCap },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'roadmap', label: 'Roadmap', icon: CalendarCheck },
    { id: 'memories', label: 'Memories', icon: Brain },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-rose-100/70 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 select-none shadow-[4px_0_20px_rgba(255,182,193,0.12)]">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-display">
              PawMate
            </h1>
            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider block -mt-0.5">
              iPET Companion
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200 scale-[1.02]'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pet Status Badge - Matching Reference Image */}
      {pet && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/80 flex items-center gap-3">
          <div className="flex-shrink-0">
            <PetVisual
              species={pet.species}
              breed={pet.breed}
              customization={pet.customization}
              size={42}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate">
                {pet.name}
              </span>
              <span className="text-[10px] font-bold text-indigo-600">
                Lv. {pet.level || 3}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <span>{emotion?.currentMood ? emotion.currentMood.charAt(0).toUpperCase() + emotion.currentMood.slice(1) : 'Happy'}</span>
              <span>•</span>
              <span className="text-pink-500">❤️ {emotion?.affection ?? 90}%</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
