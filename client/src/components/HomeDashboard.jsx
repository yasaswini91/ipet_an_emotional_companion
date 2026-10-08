import React, { useState } from 'react';
import {
  MessageCircle,
  Coffee,
  Sparkles,
  GraduationCap,
  Camera,
  BookOpen,
  CheckCircle2,
  Circle,
  Sun,
  Smile,
  Heart,
  Calendar,
  X,
  Zap,
  Flame
} from 'lucide-react';
import PetVisual from './PetVisual';
import confetti from 'canvas-confetti';

export default function HomeDashboard({
  pet,
  user,
  weather,
  emotion,
  onNavigateTab,
  onInteract
}) {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Study DBMS (1 hr)', completed: true },
    { id: 2, text: 'Complete assignment', completed: true },
    { id: 3, text: 'Drink water', completed: false },
    { id: 4, text: 'Take a short break', completed: false }
  ]);

  const [activeMenu, setActiveMenu] = useState(null); // 'feed' | 'play' | null
  const [petAnimation, setPetAnimation] = useState(null); // 'eating' | 'playing' | 'loved' | null
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [speech, setSpeech] = useState({
    title: `Good morning, ${user?.name || 'Akshitha'}! 🌸`,
    subtitle: "Let's make today amazing together!"
  });
  const [toast, setToast] = useState(null);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const spawnParticles = (emoji, count = 6) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      x: 35 + Math.random() * 30, // percent
      y: 40 + Math.random() * 20
    }));
    setFloatingParticles(newParticles);
    setTimeout(() => setFloatingParticles([]), 2000);
  };

  const triggerFeed = async (item = { name: 'Fresh Salmon', icon: '🐟', bonus: '+15 Fullness' }) => {
    setActiveMenu(null);
    setPetAnimation('eating');
    spawnParticles(item.icon, 8);

    setSpeech({
      title: `*(munching ${item.name} happily)* 😋`,
      subtitle: `Nom nom nom! That was super delicious! 💖 Thank you, ${user?.name || 'Master'}!`
    });

    setToast({
      icon: item.icon,
      text: `${pet?.name || 'Luna'} loved the ${item.name}! ${item.bonus} • +10 XP!`
    });
    setTimeout(() => setToast(null), 3500);

    try {
      if (onInteract) await onInteract('feed');
    } catch {}

    setTimeout(() => {
      setPetAnimation(null);
    }, 2500);
  };

  const triggerPlay = async (item = { name: 'Feather Wand', icon: '🪶', bonus: '+15 Happiness' }) => {
    setActiveMenu(null);
    setPetAnimation('playing');
    spawnParticles(item.icon, 8);

    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}

    setSpeech({
      title: `*(pouncing excitedly with paws)* 🐾✨`,
      subtitle: `Wheee! Playing with the ${item.name} is so much fun! You're the best companion ever!`
    });

    setToast({
      icon: item.icon,
      text: `${pet?.name || 'Luna'} had a blast playing! ${item.bonus} • +10 XP!`
    });
    setTimeout(() => setToast(null), 3500);

    try {
      if (onInteract) await onInteract('play');
    } catch {}

    setTimeout(() => {
      setPetAnimation(null);
    }, 2500);
  };

  const triggerPetStroke = async () => {
    setPetAnimation('loved');
    spawnParticles('💖', 6);
    setSpeech({
      title: `*(purring softly into your hand)* 🌸`,
      subtitle: `Purrr~ Your gentle pats are the warmest feeling in the world! 💖`
    });
    setToast({
      icon: '💖',
      text: `Gentle stroke! ${pet?.name || 'Luna'} feels loved and peaceful. +5 Affection!`
    });
    setTimeout(() => setToast(null), 3000);

    try {
      if (onInteract) await onInteract('pet');
    } catch {}

    setTimeout(() => {
      setPetAnimation(null);
    }, 2000);
  };

  const foodOptions = [
    { name: 'Fresh Salmon', icon: '🐟', desc: 'Delicious protein boost', bonus: '+15 Fullness' },
    { name: 'Warm Milk', icon: '🥛', desc: 'Cozy calming hydration', bonus: '+12 Hydration' },
    { name: 'Cat Cookie', icon: '🍪', desc: 'Crunchy sweet reward', bonus: '+15 Happiness' },
    { name: 'Tuna Sashimi', icon: '🍣', desc: 'Gourmet companion treat', bonus: '+20 Energy' }
  ];

  const toyOptions = [
    { name: 'Feather Wand', icon: '🪶', desc: 'Swaying bird feathers', bonus: '+15 Agility' },
    { name: 'Tennis Ball', icon: '🎾', desc: 'Bouncy energetic toy', bonus: '+20 Energy' },
    { name: 'Fluffy Yarn', icon: '🧶', desc: 'Soft rollable wool ball', bonus: '+15 Playfulness' },
    { name: 'Laser Pointer', icon: '✨', desc: 'Fast glowing red beam', bonus: '+20 Reflexes' }
  ];

  const actionButtons = [
    {
      label: 'Chat',
      icon: MessageCircle,
      onClick: () => onNavigateTab('chat'),
      color: 'hover:bg-rose-50 hover:text-rose-600'
    },
    {
      label: 'Feed',
      icon: Coffee,
      onClick: () => setActiveMenu(activeMenu === 'feed' ? null : 'feed'),
      color: activeMenu === 'feed' ? 'bg-amber-100 text-amber-700' : 'hover:bg-amber-50 hover:text-amber-600'
    },
    {
      label: 'Play',
      icon: Sparkles,
      onClick: () => setActiveMenu(activeMenu === 'play' ? null : 'play'),
      color: activeMenu === 'play' ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 hover:text-purple-600'
    },
    {
      label: 'Study',
      icon: GraduationCap,
      onClick: () => onNavigateTab('study'),
      color: 'hover:bg-indigo-50 hover:text-indigo-600'
    },
    {
      label: 'Games',
      icon: Camera,
      onClick: () => onNavigateTab('games'),
      color: 'hover:bg-blue-50 hover:text-blue-600'
    },
    {
      label: 'Journal',
      icon: BookOpen,
      onClick: () => onNavigateTab('journal'),
      color: 'hover:bg-emerald-50 hover:text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      {/* Floating Interaction Toast */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-100 shadow-xl shadow-indigo-100/50 animate-bounce">
          <span className="text-2xl">{toast.icon}</span>
          <span className="text-xs font-bold text-slate-800">{toast.text}</span>
        </div>
      )}

      {/* Center Left Main Scene (Screen 4) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Cozy Room Scene Card */}
        <div className="rounded-3xl bg-gradient-to-b from-amber-100/60 via-orange-50/40 to-amber-50/70 border border-amber-200/60 p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-between min-h-[490px]">
          {/* Subtle room illustration accents */}
          <div className="absolute top-4 left-6 text-xs font-bold text-amber-800/60 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cozy Companion Room</span>
          </div>

          <div className="absolute top-4 right-6 flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-amber-200/80 text-amber-800 shadow-xs">
              🐾 Click {pet?.name || 'Pet'} to stroke
            </span>
          </div>

          {/* Floating animated particles */}
          {floatingParticles.map(p => (
            <div
              key={p.id}
              className="absolute text-2xl pointer-events-none transition-all duration-1000 animate-float"
              style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: 20 }}
            >
              {p.emoji}
            </div>
          ))}

          {/* Speech Bubble Greeting matching screenshot */}
          <div className="relative mt-8 max-w-md bg-white/95 backdrop-blur-sm px-6 py-3.5 rounded-3xl rounded-bl-sm border border-amber-200/80 shadow-md text-center transition-all duration-300">
            <p className="text-sm font-bold text-slate-800">
              {speech.title}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              {speech.subtitle}
            </p>
          </div>

          {/* Illustrated Pet Avatar with interactive animations */}
          <div
            onClick={triggerPetStroke}
            className={`my-4 cursor-pointer transition-transform duration-300 relative group ${
              petAnimation === 'eating'
                ? 'scale-105 animate-bounce'
                : petAnimation === 'playing'
                ? 'scale-110 -rotate-3 transition-transform'
                : petAnimation === 'loved'
                ? 'scale-105 animate-pulse'
                : 'hover:scale-105'
            }`}
            title="Click to gently stroke pet!"
          >
            <PetVisual
              species={pet?.species}
              breed={pet?.breed}
              customization={pet?.customization}
              size={230}
            />

            {/* Eating / Playing Visual Indicators */}
            {petAnimation === 'eating' && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] shadow-md animate-pulse">
                  Nom nom nom! 🐟
                </span>
              </div>
            )}
            {petAnimation === 'playing' && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-extrabold text-[10px] shadow-md animate-bounce">
                  Catching toy! 🎾✨
                </span>
              </div>
            )}
            {petAnimation === 'loved' && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-pink-500 text-white font-extrabold text-[10px] shadow-md animate-pulse">
                  Purrrr~ 💖
                </span>
              </div>
            )}
          </div>

          {/* Interactive Feeding Drawer */}
          {activeMenu === 'feed' && (
            <div className="w-full max-w-lg mb-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-100">
                <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                  <span>🐟 Choose a treat to feed {pet?.name || 'Luna'}</span>
                </span>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {foodOptions.map((food, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => triggerFeed(food)}
                    className="p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/90 border border-amber-200/60 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 text-center"
                  >
                    <span className="text-2xl">{food.icon}</span>
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">{food.name}</span>
                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded-full">{food.bonus}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Playing Drawer */}
          {activeMenu === 'play' && (
            <div className="w-full max-w-lg mb-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-purple-200 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-purple-100">
                <span className="text-xs font-extrabold text-purple-800 flex items-center gap-1.5">
                  <span>🎾 Choose a toy to play with {pet?.name || 'Luna'}</span>
                </span>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {toyOptions.map((toy, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => triggerPlay(toy)}
                    className="p-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/90 border border-purple-200/60 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 text-center"
                  >
                    <span className="text-2xl">{toy.icon}</span>
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">{toy.name}</span>
                    <span className="text-[9px] font-extrabold text-purple-700 bg-purple-200/60 px-1.5 py-0.5 rounded-full">{toy.bonus}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Quick Action Bar matching Screen 4 */}
          <div className="w-full max-w-xl bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-around gap-2">
            {actionButtons.map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-slate-600 transition-all ${btn.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Companion Life Quick Teaser */}
        <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-rose-100/70 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              T1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Today's Virtual Life Outline
              </h4>
              <p className="text-xs text-slate-500">
                {pet?.name} is ready for today's adventures in the simulated pet world.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('world')}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
          >
            Explore World →
          </button>
        </div>
      </div>

      {/* Right Sidebar Column (Screen 4: Tasks, Weather, Mood) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Today's Tasks Checklist */}
        <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-rose-100/70 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Today's Tasks</span>
            </h3>
            <button
              onClick={() => onNavigateTab('roadmap')}
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  task.completed
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-medium'
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {task.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${task.completed ? 'line-through opacity-80' : ''}`}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Card matching screenshot: "Coimbatore 28°C Sunny" */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50/40 border border-sky-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
              Coimbatore Weather
            </span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {weather?.temperature || '28°C'}
            </div>
            <span className="text-xs text-slate-600 font-semibold">
              {weather?.weather || 'Sunny'} • {weather?.season || 'Spring'}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-500">
            <Sun className="w-8 h-8 animate-spin" style={{ animationDuration: '30s' }} />
          </div>
        </div>

        {/* Pet Mood Card matching screenshot: "Pet Mood: Happy" */}
        <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-rose-100/70 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pet Mood
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-800 capitalize">
                {emotion?.currentMood || 'Happy'}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Happiness: {emotion?.happiness ?? 92}% • Affection: {emotion?.affection ?? 88}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
