import { PetGrowth } from '../models/PetGrowth.js';

export const growthService = {
  async getGrowth(petId, userId) {
    return PetGrowth.getOrCreate(petId, userId);
  },

  async recordActivity(petId, activityType) {
    const xpRewards = {
      chat: { xp: 3, skill: 'social' },
      social: { xp: 5, skill: 'social' },
      play: { xp: 6, skill: 'curiosity' },
      game: { xp: 6, skill: 'curiosity' },
      study: { xp: 8, skill: 'knowledge' },
      teach: { xp: 8, skill: 'knowledge' },
      feed: { xp: 4, skill: 'cooking' },
      daily_world_visit: { xp: 10, skill: 'curiosity' },
      diary_read: { xp: 5, skill: 'knowledge' }
    };

    const reward = xpRewards[activityType] || { xp: 2, skill: 'social' };
    return PetGrowth.addXP(petId, reward.xp, reward.skill);
  }
};
