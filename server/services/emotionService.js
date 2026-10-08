import { PetEmotion } from '../models/PetEmotion.js';

export const emotionService = {
  async getEmotion(petId, userId) {
    return PetEmotion.getOrCreate(petId, userId);
  },

  async interact(petId, actionType) {
    const deltasMap = {
      play: { happiness: 10, affection: 6, energy: -5, loneliness: -10, stress: -5 },
      feed: { happiness: 8, energy: 15, affection: 4, stress: -4 },
      pet: { happiness: 6, affection: 8, loneliness: -8, stress: -6 },
      rest: { energy: 25, stress: -10, loneliness: 2 },
      explore: { curiosity: 12, energy: -8, happiness: 7 }
    };

    const deltas = deltasMap[actionType] || { happiness: 5, affection: 3 };
    return PetEmotion.applyDeltas(petId, deltas);
  }
};
