import React from 'react';
import { Heart, Sparkles, Star } from 'lucide-react';

export default function CuteBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Large Soft Pastel Glow Orbs */}
      <div 
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300/35 via-rose-200/30 to-amber-200/30 blur-3xl animate-float"
        style={{ animationDuration: '14s' }}
      />
      <div 
        className="absolute top-1/4 -right-20 w-[420px] h-[420px] rounded-full bg-gradient-to-bl from-purple-200/35 via-pink-200/30 to-sky-200/25 blur-3xl animate-float"
        style={{ animationDuration: '18s', animationDelay: '-5s' }}
      />
      <div 
        className="absolute -bottom-20 left-1/3 w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-amber-200/30 via-orange-100/35 to-rose-200/30 blur-3xl animate-float"
        style={{ animationDuration: '16s', animationDelay: '-8s' }}
      />

      {/* 2. Cute Whimsical Floating Tiny Stickers */}
      {/* Top Left Twinkle */}
      <div className="absolute top-12 left-72 text-rose-300/50 animate-bounce" style={{ animationDuration: '6s' }}>
        <Sparkles className="w-6 h-6" />
      </div>

      {/* Center Top Cute Star */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-amber-300/60 animate-pulse" style={{ animationDuration: '4s' }}>
        <Star className="w-5 h-5 fill-amber-300/40" />
      </div>

      {/* Top Right Tiny Hearts */}
      <div className="absolute top-20 right-32 text-pink-300/45 animate-float" style={{ animationDuration: '7s' }}>
        <Heart className="w-5 h-5 fill-pink-300/30" />
      </div>

      {/* Mid Right Twinkle Star */}
      <div className="absolute top-1/2 right-16 text-purple-300/50 animate-pulse" style={{ animationDuration: '5s' }}>
        <Sparkles className="w-5 h-5" />
      </div>

      {/* Bottom Left Floating Heart */}
      <div className="absolute bottom-28 left-80 text-rose-300/45 animate-float" style={{ animationDuration: '8s', animationDelay: '-3s' }}>
        <Heart className="w-6 h-6 fill-rose-300/30" />
      </div>

      {/* Bottom Right Cute Star */}
      <div className="absolute bottom-16 right-48 text-amber-300/50 animate-bounce" style={{ animationDuration: '7s' }}>
        <Star className="w-5 h-5 fill-amber-300/40" />
      </div>

      {/* 3. Subtle Cute Japanese/Kawaii Sparkle ASCII & Paw Watermarks in Corners */}
      <div className="absolute top-28 right-80 text-2xl font-display text-pink-300/25 rotate-12">
        🐾
      </div>
      <div className="absolute bottom-40 right-24 text-3xl font-display text-purple-300/25 -rotate-12">
        🐾
      </div>
      <div className="absolute top-1/3 left-80 text-2xl font-display text-amber-300/30 rotate-6">
        ✨
      </div>
      <div className="absolute bottom-24 left-1/2 text-xl font-display text-pink-300/30">
        (｡♥‿♥｡)
      </div>
    </div>
  );
}
