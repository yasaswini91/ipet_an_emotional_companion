import React from 'react';

export default function PetVisual({
  species = 'cat',
  breed = 'Mousse Maine',
  customization = {},
  mood = 'happy',
  size = 180,
  isSpeaking = false
}) {
  const furColor = customization?.color || (
    species === 'cat' ? '#f59e0b' :
    species === 'dog' ? '#d97706' :
    species === 'rabbit' ? '#f3f4f6' :
    species === 'bird' ? '#38bdf8' :
    species === 'dragon' ? '#10b981' : '#b45309'
  );

  const eyeColor = customization?.eyeColor || '#1e293b';
  const accessory = customization?.accessory || 'none';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${isSpeaking ? 'animate-breathe' : 'animate-float'}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="drop-shadow-xl transition-all duration-300"
      >
        <defs>
          <radialGradient id="petGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffb199" stopOpacity="0.2" />
          </radialGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="100" cy="180" rx="60" ry="12" fill="rgba(0,0,0,0.08)" />

        {/* Pet Body Base */}
        <circle cx="100" cy="125" r="50" fill={furColor} filter="url(#shadow)" />

        {/* Species-Specific Features */}
        {species === 'cat' && (
          <>
            {/* Cat Ears */}
            <polygon points="65,95 50,45 85,75" fill={furColor} />
            <polygon points="65,90 56,55 80,75" fill="#fca5a5" />
            <polygon points="135,95 150,45 115,75" fill={furColor} />
            <polygon points="135,90 144,55 120,75" fill="#fca5a5" />
            {/* Whiskers */}
            <line x1="45" y1="105" x2="20" y2="102" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="112" x2="18" y2="115" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="155" y1="105" x2="180" y2="102" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="155" y1="112" x2="182" y2="115" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            {/* Cat Tail */}
            <path d="M 140 145 Q 185 140 175 110" fill="none" stroke={furColor} strokeWidth="12" strokeLinecap="round" />
          </>
        )}

        {species === 'dog' && (
          <>
            {/* Floppy Dog Ears */}
            <ellipse cx="55" cy="90" rx="16" ry="32" fill={furColor} transform="rotate(-20 55 90)" />
            <ellipse cx="145" cy="90" rx="16" ry="32" fill={furColor} transform="rotate(20 145 90)" />
            {/* Wagging Dog Tail */}
            <path d="M 140 145 Q 175 130 185 105" fill="none" stroke={furColor} strokeWidth="14" strokeLinecap="round" />
          </>
        )}

        {species === 'rabbit' && (
          <>
            {/* Long Rabbit Ears */}
            <ellipse cx="75" cy="40" rx="14" ry="42" fill={furColor} />
            <ellipse cx="75" cy="40" rx="7" ry="30" fill="#fca5a5" />
            <ellipse cx="125" cy="40" rx="14" ry="42" fill={furColor} />
            <ellipse cx="125" cy="40" rx="7" ry="30" fill="#fca5a5" />
            {/* Fluffy Tail */}
            <circle cx="150" cy="145" r="14" fill="#ffffff" />
          </>
        )}

        {species === 'dragon' && (
          <>
            {/* Little Horns */}
            <polygon points="75,70 65,30 85,55" fill="#f59e0b" />
            <polygon points="125,70 135,30 115,55" fill="#f59e0b" />
            {/* Little Wings */}
            <path d="M 50 120 Q 20 80 40 135" fill="#34d399" opacity="0.8" />
            <path d="M 150 120 Q 180 80 160 135" fill="#34d399" opacity="0.8" />
          </>
        )}

        {species === 'bird' && (
          <>
            {/* Crest */}
            <path d="M 95 65 Q 100 35 110 55" stroke={furColor} strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Wings */}
            <ellipse cx="50" cy="125" rx="14" ry="24" fill="#0284c7" />
            <ellipse cx="150" cy="125" rx="14" ry="24" fill="#0284c7" />
          </>
        )}

        {species === 'capybara' && (
          <>
            {/* Tiny Capy ears */}
            <circle cx="65" cy="70" r="10" fill={furColor} />
            <circle cx="135" cy="70" r="10" fill={furColor} />
            {/* Orange on head */}
            <circle cx="100" cy="55" r="14" fill="#ea580c" />
            <path d="M 100 41 Q 105 32 108 34" stroke="#15803d" strokeWidth="3" fill="none" />
          </>
        )}

        {/* Pet Head */}
        <circle cx="100" cy="98" r="44" fill={furColor} />

        {/* Cheeks / Blush */}
        <circle cx="72" cy="112" r="10" fill="#fda4af" opacity="0.65" />
        <circle cx="128" cy="112" r="10" fill="#fda4af" opacity="0.65" />

        {/* Eyes */}
        {mood === 'tired' || mood === 'sleeping' ? (
          <>
            <path d="M 75 95 Q 82 102 90 95" fill="none" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 110 95 Q 118 102 125 95" fill="none" stroke={eyeColor} strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <circle cx="82" cy="94" r="8.5" fill={eyeColor} />
            <circle cx="84" cy="91" r="3.2" fill="#ffffff" />
            <circle cx="80" cy="96" r="1.5" fill="#ffffff" />
            {/* Right Eye */}
            <circle cx="118" cy="94" r="8.5" fill={eyeColor} />
            <circle cx="120" cy="91" r="3.2" fill="#ffffff" />
            <circle cx="116" cy="96" r="1.5" fill="#ffffff" />
          </>
        )}

        {/* Cute Nose */}
        <polygon points="97,105 103,105 100,109" fill="#e11d48" />

        {/* Mouth */}
        {mood === 'excited' || mood === 'happy' ? (
          <path d="M 92 110 Q 100 120 108 110" fill="none" stroke="#e11d48" strokeWidth="2.8" strokeLinecap="round" />
        ) : (
          <path d="M 94 109 Q 97 113 100 110 Q 103 113 106 109" fill="none" stroke="#713f12" strokeWidth="2.2" strokeLinecap="round" />
        )}

        {/* Accessories */}
        {accessory === 'wizard_hat' && (
          <g>
            <ellipse cx="100" cy="65" rx="35" ry="8" fill="#4338ca" />
            <polygon points="75,65 100,15 125,65" fill="#4f46e5" />
            <polygon points="95,45 100,35 105,45 115,45 107,52 110,62 100,56 90,62 93,52 85,45" fill="#facc15" transform="scale(0.4) translate(145, 10)" />
          </g>
        )}

        {accessory === 'cute_glasses' && (
          <g stroke="#d97706" strokeWidth="3" fill="none">
            <circle cx="82" cy="94" r="14" />
            <circle cx="118" cy="94" r="14" />
            <line x1="96" y1="94" x2="104" y2="94" />
          </g>
        )}

        {accessory === 'red_bow' && (
          <g transform="translate(100, 138)">
            <polygon points="0,0 -16,-10 -16,10" fill="#e11d48" />
            <polygon points="0,0 16,-10 16,10" fill="#e11d48" />
            <circle cx="0" cy="0" r="5" fill="#be123c" />
          </g>
        )}

        {accessory === 'cozy_scarf' && (
          <path d="M 68 135 Q 100 148 132 135 Q 140 148 130 152 Q 100 162 70 150 Z" fill="#ef4444" />
        )}

        {accessory === 'beret' && (
          <ellipse cx="88" cy="62" rx="30" ry="12" fill="#991b1b" transform="rotate(-15 88 62)" />
        )}

        {/* Small paws */}
        <circle cx="75" cy="155" r="12" fill={furColor} filter="url(#shadow)" />
        <circle cx="125" cy="155" r="12" fill={furColor} filter="url(#shadow)" />
      </svg>
    </div>
  );
}
