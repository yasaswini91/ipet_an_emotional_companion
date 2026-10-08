import { PetEmotion, deriveMood } from '../models/PetEmotion.js';
import { personalityDeltaScale } from '../config/personalityProfiles.js';
import { logEvent } from '../utils/logger.js';

function clamp100(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function scaleDeltas(deltas, personalityName) {
  const s = personalityDeltaScale(personalityName);
  return {
    happiness: Math.round((deltas.happiness || 0) * (0.85 + s.playScale * 0.15)),
    energy: deltas.energy || 0,
    affection: Math.round((deltas.affection || 0) * s.affectionScale),
    curiosity: Math.round((deltas.curiosity || 0) * s.playScale),
    stress: Math.round((deltas.stress || 0) * s.stressSensitivity),
    loneliness: deltas.loneliness || 0
  };
}

const USER_EMOTION_EFFECTS = {
  sad: { affection: 2, loneliness: -2, stress: -1, happiness: -1 },
  anxious: { affection: 2, loneliness: -2, stress: 1, happiness: 0 },
  lonely: { affection: 3, loneliness: -3, happiness: 1 },
  angry: { stress: 2, affection: 1, happiness: -1 },
  frustrated: { stress: 1, affection: 1, curiosity: 1 },
  happy: { happiness: 3, affection: 2, loneliness: -2 },
  excited: { happiness: 3, curiosity: 2, energy: 1, affection: 1 },
  surprised: { curiosity: 2, energy: 1 },
  neutral: { affection: 1, loneliness: -1 }
};

const INTERACTION_EFFECTS = {
  play: { happiness: 8, energy: -8, curiosity: 3, loneliness: -4, stress: -2 },
  feed: { happiness: 4, energy: 6, affection: 2, stress: -2 },
  pet: { happiness: 3, affection: 4, loneliness: -4, stress: -3 },
  rest: { energy: 15, stress: -8, loneliness: 1 },
  explore: { curiosity: 6, energy: -6, happiness: 3 },
  chat: { happiness: 2, affection: 2, loneliness: -3, energy: -1 },
  game: { happiness: 6, energy: -5, curiosity: 2, loneliness: -3 },
  study: { curiosity: 4, energy: -3, affection: 2 }
};

export const petEmotionService = {
  async getCurrentState(petId, userId) {
    return PetEmotion.getOrCreate(petId, userId);
  },

  calculateMood(state) {
    return deriveMood(state);
  },

  async applyDeltas(petId, deltas, personality = 'Easygoing') {
    const scaled = scaleDeltas(deltas, personality);
    const updated = await PetEmotion.applyDeltas(petId, scaled);
    logEvent('emotion.pet_updated', { petId: String(petId), mood: updated?.currentMood });
    return updated;
  },

  async applyInteractionEffect(petId, interaction, personality = 'Easygoing') {
    const type = interaction?.type || interaction;
    const deltas = INTERACTION_EFFECTS[type] || INTERACTION_EFFECTS.chat;
    return this.applyDeltas(petId, deltas, personality);
  },

  async applyUserEmotionEffect(petId, userEmotion, personality = 'Easygoing') {
    const key = userEmotion?.emotion || 'neutral';
    const deltas = USER_EMOTION_EFFECTS[key] || USER_EMOTION_EFFECTS.neutral;
    return this.applyDeltas(petId, deltas, personality);
  },

  async applyWorldEventEffect(petId, event, personality = 'Easygoing') {
    const weather = String(event?.weather || event?.type || '').toLowerCase();
    let deltas = { curiosity: 1 };
    if (weather.includes('rain') || weather.includes('snow')) {
      deltas = { stress: -2, energy: -1, affection: 1 };
    } else if (weather.includes('hot') || weather.includes('sun')) {
      deltas = { energy: -2, happiness: 1, curiosity: 1 };
    }
    return this.applyDeltas(petId, deltas, personality);
  },

  async applyTimeDecay(petId) {
    const current = await PetEmotion.findByPetId(petId);
    if (!current) return null;
    const last = current.lastInteraction ? new Date(current.lastInteraction) : new Date();
    const hours = Math.max(0, (Date.now() - last.getTime()) / (1000 * 60 * 60));
    if (hours < 2) return current;
    const steps = Math.min(12, Math.floor(hours / 2));
    return PetEmotion.applyDeltas(petId, {
      loneliness: steps * 2,
      happiness: -steps,
      energy: Math.min(8, steps),
      stress: Math.max(-4, -Math.floor(steps / 2))
    }, { touchInteraction: false });
  }
};
