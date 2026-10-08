import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, RefreshCw } from 'lucide-react';
import PetVisual from './PetVisual';
import confetti from 'canvas-confetti';

export default function Onboarding({ onComplete, isCreating }) {
  const [activeStep, setActiveStep] = useState(1);

  // States matching Screen 3 of the reference image
  const [species, setSpecies] = useState('cat');
  const [breed, setBreed] = useState('Mousse Maine');
  const [appearanceColor, setAppearanceColor] = useState('#f59e0b');
  const [accessory, setAccessory] = useState('none');
  const [personality, setPersonality] = useState('Friendly');
  const [name, setName] = useState('Luna');

  const petTypes = [
    { id: 'cat', label: 'Cat', defaultBreed: 'Mousse Maine' },
    { id: 'dog', label: 'Dog', defaultBreed: 'Golden Retriever' },
    { id: 'rabbit', label: 'Rabbit', defaultBreed: 'Fluffy Bunny' },
    { id: 'fox', label: 'Fox', defaultBreed: 'Red Fox' },
    { id: 'dragon', label: 'Dragon', defaultBreed: 'Emerald Drake' },
    { id: 'panda', label: 'Panda', defaultBreed: 'Chill Panda' }
  ];

  const appearanceOptions = [
    { color: '#f59e0b', label: 'Golden Orange' },
    { color: '#f3f4f6', label: 'Snow White' },
    { color: '#d97706', label: 'Warm Caramel' },
    { color: '#334155', label: 'Charcoal' },
    { color: '#38bdf8', label: 'Sky Pastel' },
    { color: '#fb7185', label: 'Rose Pink' }
  ];

  const personalityList = [
    { id: 'Friendly', label: 'Friendly' },
    { id: 'Funny', label: 'Funny' },
    { id: 'Calm', label: 'Calm' },
    { id: 'Playful', label: 'Playful' },
    { id: 'Motivational', label: 'Motivational' },
    { id: 'Intelligent', label: 'Intelligent' }
  ];

  const handleFinish = () => {
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {}

    onComplete({
      name,
      species,
      breed,
      personality,
      hobbies: ['studying together', 'playing games', 'park strolls'],
      description: `A loving ${personality.toLowerCase()} ${breed} who loves study companionship and joyful daily adventures.`,
      customization: {
        color: appearanceColor,
        accessory
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50/60">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-8">
        {/* Top Header & Horizontal Stepper matching Screen 3 */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">
              PawMate
            </span>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 text-xs font-bold">
            {[
              { num: 1, label: 'Pet Type' },
              { num: 2, label: 'Appearance' },
              { num: 3, label: 'Personality' },
              { num: 4, label: 'Name' }
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full border transition-all ${
                    activeStep >= s.num
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold shadow-sm'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}
                >
                  {s.num} {s.label}
                </span>
                {s.num < 4 && <span className="text-slate-300">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Desktop Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Pet Visual Avatar Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50/40 to-indigo-50/50 border border-slate-100">
            <PetVisual
              species={species === 'panda' || species === 'fox' ? 'cat' : species}
              breed={breed}
              customization={{ color: appearanceColor, accessory }}
              size={220}
            />
            <div className="text-center mt-4 space-y-1">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {name || 'Your Pet'}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {breed} • {personality}
              </p>
            </div>
          </div>

          {/* Right Column: Customization Controls (Screen 3) */}
          <div className="md:col-span-7 space-y-5">
            {/* 1. Choose Your Pet */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Choose Your Pet
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {petTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSpecies(t.id);
                      setBreed(t.defaultBreed);
                      setActiveStep(Math.max(activeStep, 1));
                    }}
                    className={`py-2 px-1 rounded-2xl border text-center transition-all ${
                      species === t.id
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-bold scale-105'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-xs font-medium'
                    }`}
                  >
                    <span className="text-xs block">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Choose Appearance */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Choose Appearance Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {appearanceOptions.map((opt) => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => {
                      setAppearanceColor(opt.color);
                      setActiveStep(Math.max(activeStep, 2));
                    }}
                    className={`w-9 h-9 rounded-2xl border-2 transition-transform flex items-center justify-center ${
                      appearanceColor === opt.color ? 'scale-110 border-indigo-600 shadow-md' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: opt.color }}
                    title={opt.label}
                  >
                    {appearanceColor === opt.color && <Check className="w-4 h-4 text-slate-800" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Choose Personality */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Choose Personality
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {personalityList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPersonality(p.id);
                      setActiveStep(Math.max(activeStep, 3));
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      personality === p.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Name Your Pet */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Name Your Pet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setActiveStep(4);
                }}
                placeholder="e.g. Luna, Mousse, Buddy"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Finish Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={!name.trim() || isCreating}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Your Virtual Companion...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Enter Companion World</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
