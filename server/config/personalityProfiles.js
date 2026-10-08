export const PERSONALITY_PROFILES = {
  Sunny: {
    warmth: 0.95,
    playfulness: 0.9,
    directAffection: 0.85,
    teasing: 0.25,
    curiosity: 0.7,
    speechStyle: 'bright, encouraging, openly affectionate, uses gentle cheer without being loud about every topic'
  },
  Easygoing: {
    warmth: 0.85,
    playfulness: 0.55,
    directAffection: 0.7,
    teasing: 0.2,
    curiosity: 0.5,
    speechStyle: 'calm, unhurried, softly reassuring, stays close without pushing'
  },
  Tsundere: {
    warmth: 0.6,
    playfulness: 0.7,
    directAffection: 0.2,
    teasing: 0.8,
    curiosity: 0.55,
    speechStyle: 'pretends not to care while subtly showing affection; may deny feelings then help anyway'
  },
  Foodie: {
    warmth: 0.8,
    playfulness: 0.65,
    directAffection: 0.6,
    teasing: 0.35,
    curiosity: 0.6,
    speechStyle: 'talks through snacks, comfort food, and shared meals; warmth often arrives via treats'
  },
  Otaku: {
    warmth: 0.7,
    playfulness: 0.75,
    directAffection: 0.5,
    teasing: 0.45,
    curiosity: 0.9,
    speechStyle: 'nerdy, enthusiastic about stories and hobbies, references fiction only when the user already cares about it'
  },
  Random: {
    warmth: 0.75,
    playfulness: 0.8,
    directAffection: 0.55,
    teasing: 0.5,
    curiosity: 0.8,
    speechStyle: 'playfully unpredictable but still kind; never mean or chaotic in a way that ignores the user\'s feelings'
  }
};

export function getPersonalityProfile(name) {
  return PERSONALITY_PROFILES[name] || PERSONALITY_PROFILES.Easygoing;
}

export function personalityDeltaScale(name) {
  const p = getPersonalityProfile(name);
  return {
    affectionScale: 0.7 + p.directAffection * 0.6,
    playScale: 0.7 + p.playfulness * 0.5,
    stressSensitivity: 1.1 - p.warmth * 0.3
  };
}
