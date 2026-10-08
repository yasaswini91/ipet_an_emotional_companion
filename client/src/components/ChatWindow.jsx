import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Brain,
  Sparkles,
  Bookmark,
  Gamepad2,
  GraduationCap,
  Coffee,
  Bell,
  ArrowRight
} from 'lucide-react';
import PetVisual from './PetVisual';

export default function ChatWindow({
  pet,
  user,
  messages = [],
  onSendMessage,
  isLoading,
  initialInput = '',
  memories = [],
  onNavigateTab
}) {
  const [inputText, setInputText] = useState(initialInput);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
    }
  }, [initialInput]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const [voiceError, setVoiceError] = useState(null);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setVoiceError('Web Speech recognition is not supported in this browser. Please use keyboard input.');
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setVoiceError(null);
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setIsRecording(false);
        setVoiceError('Could not start voice recognition: ' + err.message);
      }
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const quickActionChips = [
    { label: "Let's revise", text: "Can you help me revise key concepts for my upcoming test?" },
    { label: "Suggest topics", text: "What topics should we focus on studying together today?" },
    { label: "Just chat", text: "How is your day going, my little companion?" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Main Chat Area (Screen 5) */}
      <div className="lg:col-span-8 flex flex-col h-[700px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PetVisual
              species={pet?.species}
              breed={pet?.breed}
              customization={pet?.customization}
              size={44}
              isSpeaking={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">
                  {pet?.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive NLP Companion • Emotional Dialogue Engine
              </p>
            </div>
          </div>

        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {messages.length === 0 && (
            <div className="text-center py-12 max-w-sm mx-auto space-y-3">
              <PetVisual
                species={pet?.species}
                breed={pet?.breed}
                customization={pet?.customization}
                size={110}
              />
              <p className="text-sm font-bold text-slate-700">
                Hey {user?.name || 'Akshitha'}! How are you feeling today? 🌸
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                I can help you review your study notes, listen whenever you feel stressed, or share fun adventures from our simulated pet world!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isPet = msg.sender === 'pet';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isPet ? 'justify-start' : 'justify-end'}`}
              >
                {isPet && (
                  <div className="flex-shrink-0 mt-1">
                    <PetVisual
                      species={pet?.species}
                      breed={pet?.breed}
                      customization={pet?.customization}
                      size={36}
                    />
                  </div>
                )}

                <div
                  className={`max-w-[76%] rounded-3xl p-4 shadow-sm text-sm leading-relaxed ${
                    isPet
                      ? 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}
                >
                  {/* Parse parenthetical pet actions */}
                  {(msg?.content || '').split(/(\([^)]+\))/).map((part, pIdx) => {
                    if (part.startsWith('(') && part.endsWith(')')) {
                      return (
                        <span key={pIdx} className={isPet ? 'italic text-indigo-500 font-medium' : 'italic opacity-90'}>
                          {part}{' '}
                        </span>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100/40 text-[10px] opacity-70">
                    <span>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <PetVisual
                species={pet?.species}
                breed={pet?.breed}
                customization={pet?.customization}
                size={36}
              />
              <div className="bg-white border border-slate-200/80 rounded-3xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 text-slate-400">{pet?.name} is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips matching Screen 5: "Let's revise", "Suggest topics", "Just chat" */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
          {quickActionChips.map((chip, cIdx) => (
            <button
              key={cIdx}
              type="button"
              onClick={() => setInputText(chip.text)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Voice error banner */}
        {voiceError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-xs font-semibold text-rose-700">
            {voiceError}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-2xl border transition-all ${
              isRecording
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200'
            }`}
            title="Voice input"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type a message... (e.g. "I'm stressed about DBMS", "What are you doing today?")`}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 disabled:opacity-40 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right Sidebar: Conversation Memory & Quick Actions (Screen 5) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Conversation Memory Card matching Screen 5 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Conversation Memory</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Active Context
            </span>
          </div>

          <div className="space-y-2">
            {(memories && memories.length > 0 ? memories.slice(0, 4) : [
              { content: 'DBMS exam on Friday' },
              { content: 'Feeling stressed about deadlines' },
              { content: 'Likes studying with lo-fi music' },
              { content: 'Finds ER diagrams difficult' }
            ]).map((mem, mIdx) => (
              <div key={mIdx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                <Bookmark className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{mem.content}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab?.('memories')}
            className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View all memories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Actions Panel matching Screen 5 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Quick Actions
          </span>
          <div className="space-y-2">
            {[
              { label: 'Set Reminder', icon: Bell, action: () => setInputText('Please remind me to review DBMS normalization at 6 PM!') },
              { label: 'Start Study Mode', icon: GraduationCap, action: () => onNavigateTab?.('study') },
              { label: 'Play a Game', icon: Gamepad2, action: () => onNavigateTab?.('games') },
              { label: 'Take a Break', icon: Coffee, action: () => setInputText('Let us take a relaxing 10-minute break together!') }
            ].map((qa, qIdx) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qIdx}
                  type="button"
                  onClick={qa.action}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-100 transition-all text-xs font-semibold text-left"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
