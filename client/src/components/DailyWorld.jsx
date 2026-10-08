import React, { useState } from 'react';
import {
  Compass,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sun,
  Zap,
  Calendar,
  BookOpen,
  MapPin,
  MessageSquare
} from 'lucide-react';
import PetVisual from './PetVisual';

export default function DailyWorld({
  world,
  pet,
  onDiscussInChat,
  onTriggerTPlusOne,
  isTPlusOneRunning
}) {
  const [selectedSubTab, setSelectedSubTab] = useState('today'); // 'today' or 'previous'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { mode = 'NORMAL', outline, schedules = [], details = [], date, weather } = world || {};

  if (!world || !outline) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-slate-100 shadow-sm text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800">Your pet is planning today's world...</h3>
        <p className="text-xs text-slate-500">
          Qwen is constructing today's hierarchical simulation (T1 Outline, T2 Schedules, T3 Sensory Details) for {pet?.name}.
        </p>
      </div>
    );
  }

  const handleOpenDetail = (item) => {
    const matchedDetail = details?.find(d => d.time === item.time) || {
      time: item.time,
      activity: item.activity,
      detail: `${pet?.name} spends this time engaged in ${item.activity}. Taking in the gentle atmosphere, thoughts drift warmly towards Master.`
    };
    setSelectedEvent(matchedDetail);
    setDetailModalOpen(true);
  };

  const timelineMilestones = [
    { time: '6 AM', label: 'Morning', icon: '🌅' },
    { time: '10 AM', label: 'Study', icon: '📚' },
    { time: '2 PM', label: 'Play', icon: '🎾' },
    { time: '6 PM', label: 'Explore', icon: '🌳' },
    { time: '10 PM', label: 'Rest', icon: '🌙' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Mode, Date and Weather matching Screen 6 */}
      <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
          <button
            onClick={() => setSelectedSubTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedSubTab === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Today's World
          </button>
          <button
            onClick={() => setSelectedSubTab('previous')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedSubTab === 'previous'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Previous Days
          </button>
        </div>

        {/* Date, Weather, and T+1 Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{date || 'Oct 8, 2026'}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Weather: {weather?.weather || 'Sunny'} {weather?.temperature || '28°C'} {weather?.season || 'Spring'}</span>
          </div>

          <button
            onClick={onTriggerTPlusOne}
            disabled={isTPlusOneRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            title="T+1 Offline Simulation"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTPlusOneRunning ? 'animate-spin' : ''}`} />
            <span>{isTPlusOneRunning ? 'Simulating T+1...' : 'Run T+1 Offline'}</span>
          </button>
        </div>
      </div>

      {/* Scenic World Map Canvas Card matching Screen 6 */}
      <div className="rounded-3xl bg-gradient-to-b from-sky-200/50 via-emerald-100/50 to-emerald-200/60 border border-emerald-200/80 p-8 shadow-sm relative overflow-hidden min-h-[380px] flex flex-col justify-between">
        {/* Background decorative scenery */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Scenery Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-900 bg-white/80 px-3 py-1 rounded-full border border-emerald-300 shadow-sm flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Simulated Village & Park Basin</span>
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              mode === 'MEMORY' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {mode === 'MEMORY' ? '✨ MEMORY MODE' : '🌱 NORMAL MODE'}
            </span>
          </div>
        </div>

        {/* Scenic Center with Pin Markers for Pet and Virtual Friends */}
        <div className="relative z-10 my-8 flex flex-wrap items-center justify-around gap-6">
          {/* Virtual Friend Pin: Milo */}
          <div className="flex flex-col items-center animate-float">
            <div className="bg-white/95 px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Milo Reading</span>
            </div>
            <PetVisual species="dog" breed="Golden Retriever" size={70} />
          </div>

          {/* User's Pet: Luna */}
          <div className="flex flex-col items-center animate-breathe">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-indigo-500 flex items-center gap-2 text-xs font-extrabold text-indigo-700 mb-2 scale-110">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{pet?.name || 'Luna'} Playing</span>
            </div>
            <PetVisual
              species={pet?.species}
              breed={pet?.breed}
              customization={pet?.customization}
              size={110}
            />
          </div>

          {/* Virtual Friend Pin: Coco */}
          <div className="flex flex-col items-center animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="bg-white/95 px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Coco Exploring</span>
            </div>
            <PetVisual species="rabbit" breed="Fluffy Bunny" size={70} />
          </div>
        </div>

        {/* Bottom Horizontal Timeline Slider matching Screen 6 */}
        <div className="relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-200 shadow-md">
          <div className="flex items-center justify-between px-4">
            {timelineMilestones.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <span className="text-sm">{m.icon}</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">{m.time}</span>
                <span className="text-[10px] text-slate-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage 1 Outline & Stage 2/3 Event Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stage 1 Outline */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Stage 1: Daily Narrative Outline (T1)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/70">
            "{outline || `${pet?.name} spends a lively and peaceful day wandering near the flowerbeds, enjoying breakfast, and playing with neighborhood friends.`}"
          </p>
        </div>

        {/* Right Column: Stage 2 Schedules (2-5 words) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Stage 2: Event Timeline Schedules (T2)</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Brief 2-5 words per event
            </span>
          </div>

          <div className="space-y-2">
            {(schedules || []).map((item, sIdx) => {
              const matchedDetail = details?.find(d => d.time === item.time);
              return (
                <div
                  key={sIdx}
                  onClick={() => handleOpenDetail(item)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-indigo-600">
                      {item.time}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {item.activity}
                      </h4>
                      {matchedDetail && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {matchedDetail.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage 3 Detail Modal (~50 words) */}
      {detailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="max-w-lg w-full p-6 bg-white rounded-3xl border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
                  {selectedEvent.time}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {selectedEvent.activity}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "{selectedEvent.detail}"
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Stage 3 (~50 words narrative)
              </span>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  onDiscussInChat(selectedEvent.activity);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat with {pet?.name} about this</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
