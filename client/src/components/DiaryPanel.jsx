import React, { useState } from 'react';
import { BookOpen, Sparkles, Calendar, Layers, MessageSquare, AlertCircle } from 'lucide-react';
import PetVisual from './PetVisual';

export default function DiaryPanel({
  pet,
  diaries = [],
  onGenerateDiary,
  isGenerating = false,
  generationError = null
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const hasTodayEntry = diaries.some(d => d.date === todayStr);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Diary Header */}
      <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <PetVisual
              species={pet?.species}
              breed={pet?.breed}
              customization={pet?.customization}
              size={54}
            />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {pet?.name}'s Companion Diary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomously recorded by {pet?.name} using today's conversations, memories, and world events 💜
            </p>
          </div>
        </div>

        <button
          onClick={onGenerateDiary}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? "Writing Diary with Qwen..." : (hasTodayEntry ? "Regenerate Today's Diary" : "Generate Today's Diary")}</span>
        </button>
      </div>

      {isGenerating && (
        <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200 text-center space-y-2 animate-pulse">
          <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold text-xs">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Your pet is writing today's diary with Qwen...</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Synthesizing today's chat turns, schedule activities, weather, and emotional state.
          </p>
        </div>
      )}

      {generationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{generationError}</span>
        </div>
      )}

      {/* Timeline Entries */}
      {diaries.length === 0 && !isGenerating ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-100 shadow-sm text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No diary entries recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {pet?.name} writes evening reflections based on your real interactions throughout the day. Chat with {pet?.name} or generate today's world to create moments for the diary!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {diaries.map((entry, idx) => (
            <div
              key={entry._id || idx}
              className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start gap-4 hover:border-indigo-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <PetVisual
                  species={pet?.species}
                  breed={pet?.breed}
                  customization={pet?.customization}
                  size={42}
                />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-800">{entry.title}</h4>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{entry.date}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif italic">
                  "{entry.content}"
                </p>

                {/* Provenance Metadata Tags */}
                <div className="pt-2 flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-mono border-t border-slate-50">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{entry.sourceMessageIds?.length || 0} messages</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{entry.sourceMemoryIds?.length || 0} memories</span>
                  </span>
                  {entry.mood && (
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                      Mood: {entry.mood}
                    </span>
                  )}
                  {entry.weather && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">
                      Weather: {entry.weather}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
