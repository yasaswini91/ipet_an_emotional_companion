import React, { useEffect } from 'react';
import { Gift, Sparkles, Check, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SurpriseCard({ surprise, onAcknowledge }) {
  if (!surprise) return null;

  useEffect(() => {
    // Launch celebratory confetti when surprise appears
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}
  }, [surprise?._id]);

  return (
    <div className="glass-card p-5 border-amber-200 bg-gradient-to-r from-amber-50 via-rose-50/50 to-amber-50 shadow-lg animate-bounce-short relative overflow-hidden mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
          <Gift className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
              Personalized Surprise Event
            </span>
            <span className="text-[11px] text-amber-700 font-semibold italic">
              {surprise.reason}
            </span>
          </div>

          <h3 className="font-bold text-base text-slate-800">
            {surprise.title}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {surprise.description}
          </p>
        </div>

        <button
          onClick={() => onAcknowledge(surprise._id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all flex-shrink-0"
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Thank {surprise.petName || 'Pet'}</span>
        </button>
      </div>
    </div>
  );
}
