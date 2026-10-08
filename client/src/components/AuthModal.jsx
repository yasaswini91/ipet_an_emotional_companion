import React, { useState } from 'react';
import { Mail, Key, User, Sparkles, ArrowRight } from 'lucide-react';
import PetVisual from './PetVisual';

export default function AuthModal({ onLogin, onRegister, isLoading }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('Akshitha');
  const [email, setEmail] = useState('akshitha@pawmate.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLoginMode && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      if (isLoginMode) {
        await onLogin({ email, password });
      } else {
        await onRegister({ username: name, email, password, name });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50/60">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Left Visual Illustration Column (Screens 1 & 2 of Reference) */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-amber-100/70 via-rose-100/50 to-indigo-100/60 p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-slate-800 tracking-tight">
                PawMate
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-700">
              Your AI Virtual Pet & Study Companion
            </p>
          </div>

          {/* Central Illustrated Pet Scene */}
          <div className="relative z-10 flex flex-col items-center justify-center my-6">
            <div className="relative p-6 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 shadow-xl mb-4">
              <PetVisual
                species="cat"
                breed="Mousse Maine"
                size={180}
              />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">
                {isLoginMode ? 'A little companion for your big journey' : 'Chat • Play • Study • Grow Together'}
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {isLoginMode
                  ? 'Your virtual pet remembers your goals, prepares daily schedules, and stays by your side.'
                  : 'Embark on a joyful journey with your personal AI pet with cognitive memory and world simulation.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-slate-500 font-medium text-center">
            ACL 2025: iPET LLM-Powered World Simulation System
          </div>

          {/* Decorative ambient blurred blobs */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber-300/30 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-pink-300/30 blur-2xl pointer-events-none" />
        </div>

        {/* Right Form Column (Desktop Web Layout) */}
        <div className="w-full md:w-1/2 p-10 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {isLoginMode ? 'Welcome Back! 👋' : 'Create Your Account ✨'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isLoginMode
                  ? 'Log in to continue your journey with your virtual pet.'
                  : 'Start your journey with a virtual pet companion.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Akshitha"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  {isLoginMode && (
                    <a href="#forgot" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Please wait...' : isLoginMode ? 'Log In' : 'Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Auth Mock Buttons from screenshot */}
            <div className="relative text-center my-4 before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-full before:h-px before:bg-slate-200">
              <span className="relative z-10 bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmail('akshitha@google.com')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>🌐 Google</span>
              </button>
              <button
                type="button"
                onClick={() => setEmail('akshitha@github.com')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>🐙 GitHub</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
              >
                {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
