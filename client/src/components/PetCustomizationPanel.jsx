import React, { useState } from 'react';
import { Sparkles, Palette, Eye, Crown, Home, Check } from 'lucide-react';
import PetVisual from './PetVisual';

export default function PetCustomizationPanel({ pet, onSaveCustomization, isSaving }) {
  const currentCust = pet?.customization || {};

  const [color, setColor] = useState(currentCust.color || '#f59e0b');
  const [eyeColor, setEyeColor] = useState(currentCust.eyeColor || '#1e293b');
  const [accessory, setAccessory] = useState(currentCust.accessory || 'none');
  const [roomTheme, setRoomTheme] = useState(currentCust.roomTheme || 'warm_cottage');

  const furColors = [
    { label: 'Golden Orange', value: '#f59e0b' },
    { label: 'Soft Amber', value: '#d97706' },
    { label: 'Snow White', value: '#f3f4f6' },
    { label: 'Charcoal Black', value: '#334155' },
    { label: 'Sky Blue', value: '#38bdf8' },
    { label: 'Emerald Drake', value: '#10b981' },
    { label: 'Rose Pink', value: '#fb7185' },
    { label: 'Cozy Brown', value: '#b45309' }
  ];

  const eyeColors = [
    { label: 'Deep Slate', value: '#1e293b' },
    { label: 'Sky Blue', value: '#0284c7' },
    { label: 'Forest Green', value: '#15803d' },
    { label: 'Amber Gold', value: '#d97706' },
    { label: 'Amethyst Violet', value: '#7c3aed' }
  ];

  const accessories = [
    { id: 'none', label: 'None' },
    { id: 'wizard_hat', label: 'Wizard Hat 🧙' },
    { id: 'cute_glasses', label: 'Cute Glasses 👓' },
    { id: 'red_bow', label: 'Red Bow 🎀' },
    { id: 'cozy_scarf', label: 'Cozy Scarf 🧣' },
    { id: 'beret', label: 'Classic Beret 🎨' }
  ];

  const roomThemes = [
    { id: 'warm_cottage', label: 'Warm Sunlit Cottage 🏡' },
    { id: 'sakura_garden', label: 'Sakura Garden 🌸' },
    { id: 'sci_fi_den', label: 'Futuristic Sci-Fi Den 🚀' },
    { id: 'starry_rooftop', label: 'Starry Rooftop 🌌' }
  ];

  const handleSave = () => {
    onSaveCustomization({
      color,
      eyeColor,
      accessory,
      roomTheme
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6 border-rose-100 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-amber-50/40 via-white to-rose-50/40">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-3xl bg-white shadow-md border border-rose-100">
            <PetVisual
              species={pet?.species}
              breed={pet?.breed}
              customization={{ color, eyeColor, accessory, roomTheme }}
              size={160}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 mt-2">Live Customization Preview</span>
        </div>

        <div className="flex-1 w-full space-y-5">
          {/* Fur Color */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Fur / Coat Color</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {furColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c.value ? 'scale-125 border-rose-500 shadow-sm' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Eye Color */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Eye Color</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {eyeColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setEyeColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    eyeColor === c.value ? 'scale-125 border-rose-500 shadow-sm' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Crown className="w-3.5 h-3.5 text-rose-500" />
              <span>Wearable Accessories</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {accessories.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccessory(acc.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    accessory === acc.id
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white hover:bg-rose-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Room Environment */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Home className="w-3.5 h-3.5 text-emerald-500" />
              <span>Room Theme Environment</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roomThemes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoomTheme(r.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    roomTheme === r.id
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-200 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Customization...' : 'Save Pet Appearance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
