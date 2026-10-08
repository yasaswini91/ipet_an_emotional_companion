import { getCollection } from '../config/db.js';

export function calculateLevel(xp) {
  // Simple progressive curve: lvl 1 at 0 XP, lvl 2 at 100, lvl 3 at 250, etc.
  return Math.max(1, Math.floor(Math.sqrt(xp / 20)) + 1);
}

export function calculateStage(level) {
  if (level >= 30) return 'Mature Companion';
  if (level >= 20) return 'Adult';
  if (level >= 10) return 'Teen';
  if (level >= 5) return 'Young';
  return 'Baby';
}

export const PetGrowth = {
  collection: getCollection('pet_growth'),

  async findByPetId(petId) {
    return this.collection.findOne({ petId });
  },

  async getOrCreate(petId, userId) {
    let growth = await this.findByPetId(petId);
    if (!growth) {
      growth = await this.collection.create({
        petId,
        userId,
        xp: 40,
        level: 1,
        growthStage: 'Baby',
        skills: {
          curiosity: 5,
          cooking: 5,
          social: 5,
          knowledge: 5
        },
        unlockedTraits: ['Observant Little Eyes'],
        lastLeveledUp: new Date().toISOString()
      });
    }
    return growth;
  },

  async addXP(petId, amount, skillCategory = null) {
    let current = await this.findByPetId(petId);
    if (!current) return null;

    const newXp = (current.xp || 0) + amount;
    const newLevel = calculateLevel(newXp);
    const newStage = calculateStage(newLevel);
    const leveledUp = newLevel > (current.level || 1);

    const skills = { ...(current.skills || { curiosity: 5, cooking: 5, social: 5, knowledge: 5 }) };
    if (skillCategory && skills[skillCategory] !== undefined) {
      skills[skillCategory] += Math.max(1, Math.floor(amount / 2));
    }

    const traits = [...(current.unlockedTraits || ['Observant Little Eyes'])];
    if (newLevel >= 5 && !traits.includes('Friendly Explorer')) traits.push('Friendly Explorer');
    if (newLevel >= 10 && !traits.includes('Deep Empathy Listener')) traits.push('Deep Empathy Listener');
    if (newLevel >= 20 && !traits.includes('Wise Life Companion')) traits.push('Wise Life Companion');

    return this.collection.findByIdAndUpdate(current._id, {
      xp: newXp,
      level: newLevel,
      growthStage: newStage,
      skills,
      unlockedTraits: traits,
      lastLeveledUp: leveledUp ? new Date().toISOString() : current.lastLeveledUp
    }, { new: true });
  }
};
