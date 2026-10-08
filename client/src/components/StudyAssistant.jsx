import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  FileText,
  HelpCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function StudyAssistant({ pet, user, onAwardXP }) {
  const [topic, setTopic] = useState('DBMS');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [studyResult, setStudyResult] = useState(null);

  useEffect(() => {
    let timer = null;
    if (isRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsRemaining]);

  const handleSessionComplete = async () => {
    setNotification(`🎉 Focus session complete! ${pet?.name} gained knowledge XP alongside you!`);
    try {
      if (pet?._id) {
        await api.recordStudySession({
          petId: pet._id,
          topic,
          durationMinutes: focusMinutes,
          mode: 'pomodoro'
        });
      }
    } catch (e) {
      console.warn('Could not record study session:', e.message);
    }
    if (onAwardXP) onAwardXP('study');
  };

  const setTimer = (mins) => {
    setIsRunning(false);
    setFocusMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQuickAction = async (actionType) => {
    if (!pet?._id) {
      setNotification('Please select or create a pet first.');
      return;
    }
    setLoadingAction(true);
    setStudyResult(null);
    try {
      const res = await api.executeStudyAction({
        petId: pet._id,
        action: actionType,
        topic
      });
      setStudyResult({
        title: actionType === 'generate_notes' ? `Notes on ${topic}` : (actionType === 'quiz_me' ? `Quiz: ${topic}` : `Concept: ${topic}`),
        content: res.result,
        petName: res.petName
      });
    } catch (err) {
      setNotification(`Action unavailable: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const recommendedCards = [
    { title: 'DBMS Full Course', creator: 'Relational Model & SQL', type: 'Core Guide', url: 'https://en.wikipedia.org/wiki/Database' },
    { title: 'ER Diagrams Explained', creator: 'Entity-Relationship Design', type: 'Notes', url: 'https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model' },
    { title: 'Top 50 DBMS Questions', creator: 'Practice Sheet', type: 'Practice', url: 'https://en.wikipedia.org/wiki/SQL' },
    { title: 'Normalization Tutorial', creator: '1NF, 2NF, 3NF, BCNF', type: 'Guide', url: 'https://en.wikipedia.org/wiki/Database_normalization' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Study Timer & Topic Selector */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Study Together!</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Set a goal and {pet?.name} will stay focused right beside you. 💜
            </p>
          </div>

          {notification && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-800 flex items-center justify-between">
              <span>{notification}</span>
              <button type="button" onClick={() => setNotification(null)} className="text-indigo-600 hover:text-indigo-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Topic Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Choose Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
            >
              <option value="DBMS">DBMS (Database Management Systems)</option>
              <option value="Operating Systems">Operating Systems & Kernels</option>
              <option value="Data Structures">Data Structures & Algorithms</option>
              <option value="System Design">System Design & Web Architecture</option>
              <option value="Machine Learning">Machine Learning Fundamentals</option>
            </select>
          </div>

          {/* Focus Time Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Focus Time
            </label>
            <div className="flex gap-2">
              {[25, 50, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimer(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    focusMinutes === mins
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Clock Display */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/40 border border-indigo-100 text-center space-y-3">
            <div className="text-5xl font-extrabold font-mono text-slate-800 tracking-tight">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-xs font-semibold text-indigo-700">
              {isRunning ? `${pet?.name} is quietly studying with you...` : 'Ready to begin your study session'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause' : 'Start Study Session'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimer(focusMinutes)}
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions (Backed by Qwen) */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Qwen Study Companion
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleQuickAction('generate_notes')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Generate Notes</span>
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleQuickAction('quiz_me')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Quiz Me</span>
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleQuickAction('explain_concept')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Explain Concept</span>
              </button>
            </div>
            {loadingAction && (
              <p className="text-xs text-indigo-600 font-semibold mt-2 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pet?.name} is thinking and consulting notes...</span>
              </p>
            )}
          </div>

          {/* Qwen Study Result Card */}
          {studyResult && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{studyResult.title}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setStudyResult(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto pr-2">
                {studyResult.content}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Recommended Study Resources */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
            Curated Topic Overview
          </h3>
          <div className="space-y-2.5">
            {recommendedCards.map((res, rIdx) => (
              <a
                key={rIdx}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 flex items-center justify-between transition-colors block text-inherit"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    📚
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{res.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{res.creator}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 hover:underline">
                  Read
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
