import React, { useState } from 'react';
import {
  Heart,
  Award,
  Sparkles,
  Smile,
  Calendar,
  Layers,
  Palette,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';
import PetVisual from './PetVisual';

export default function PetEmotionAndGrowth({
  pet,
  emotion,
  growth,
  onInteract,
  isInteracting
}) {
  const [subTab, setSubTab] = useState('growth'); // 'growth', 'appearance', 'stats'

  const xp = growth?.xp ?? 320;
  const level = growth?.level ?? 3;
  const currentMood = emotion?.currentMood || 'Happy';

  const stages = [
    { name: 'Baby', lvl: 1, unlocked: level >= 1 },
    { name: 'Young', lvl: 5, unlocked: level >= 5 },
    { name: 'Adult', lvl: 10, unlocked: level >= 10 },
    { name: 'Evolved', lvl: 15, unlocked: level >= 15 }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Pet Profile Card matching Screen 8 */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-100 flex items-center justify-center flex-shrink-0">
          <PetVisual
            species={pet?.species}
            breed={pet?.breed}
            customization={pet?.customization}
            size={180}
          />
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {pet?.name || 'Luna'}
              </h2>
              <span className="text-xs font-bold text-indigo-600 font-mono">
                Lv. {level} • {xp} / {level * 150} XP
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((xp / (level * 150)) * 100))}%` }}
            />
          </div>

          {/* Status Badges Grid matching Screen 8 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mood</span>
              <span className="text-xs font-bold text-emerald-800 capitalize mt-0.5 block">{currentMood} 😊</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Species</span>
              <span className="text-xs font-bold text-sky-800 capitalize mt-0.5 block">{pet?.species || 'Cat'} 🐾</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Personality</span>
              <span className="text-xs font-bold text-purple-800 capitalize mt-0.5 block">{pet?.personality || 'Friendly'} 🌸</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Birthday</span>
              <span className="text-xs font-bold text-amber-800 mt-0.5 block">Oct 1, 2026 🎂</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Growth, Appearance, Stats matching Screen 8 */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          {[
            { id: 'growth', label: 'Growth', icon: Award },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'stats', label: 'Stats', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  subTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Growth Stages Timeline matching Screen 8 */}
        {subTab === 'growth' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight mb-1">
                Evolution Stages
              </h3>
              <p className="text-xs text-slate-400">
                Interact, study, and play to nurture your pet to maturity.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stages.map((stage, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-5 rounded-3xl border text-center space-y-2 transition-all ${
                    stage.unlocked
                      ? 'bg-gradient-to-b from-indigo-50/60 to-purple-50/40 border-indigo-200 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                    {stage.unlocked ? (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">{stage.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Lv. {stage.lvl}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unlocked Traits */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Unlocked Cognitive Traits:
              </span>
              <div className="flex flex-wrap gap-2">
                {(growth?.unlockedTraits || ['Observant Little Eyes', 'Study Partner Empathy']).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats view */}
        {subTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            {[
              { label: 'Happiness', value: emotion?.happiness ?? 92, color: 'bg-rose-500' },
              { label: 'Energy', value: emotion?.energy ?? 85, color: 'bg-amber-500' },
              { label: 'Affection', value: emotion?.affection ?? 90, color: 'bg-pink-500' },
              { label: 'Curiosity', value: emotion?.curiosity ?? 88, color: 'bg-emerald-500' },
              { label: 'Focus Skill', value: 75, color: 'bg-indigo-500' },
              { label: 'Social Skill', value: 80, color: 'bg-purple-500' }
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>{stat.label}</span>
                  <span className="font-mono">{stat.value}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'appearance' && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2 animate-fadeIn">
            <p className="font-bold text-slate-800">Pet Appearance Settings</p>
            <p>Customize coats and wearable accessories in the Settings or Onboarding panels anytime.</p>
          </div>
        )}
      </div>
    </div>
  );
}
