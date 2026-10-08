import { getCollection } from '../config/db.js';

export function deriveMood({ happiness, energy, affection, curiosity, stress, loneliness }) {
  if (stress > 65) return 'anxious';
  if (loneliness > 65) return 'lonely';
  if (energy < 25) return 'tired';
  if (happiness > 80 && energy > 65) return 'excited';
  if (curiosity > 75) return 'curious';
  if (happiness >= 60 && stress < 30) return 'relaxed';
  if (happiness >= 50) return 'happy';
  return 'thoughtful';
}

export const PetEmotion = {
  collection: getCollection('pet_emotions'),

  async findByPetId(petId) {
    return this.collection.findOne({ petId });
  },

  async getOrCreate(petId, userId) {
    let emotion = await this.findByPetId(petId);
    if (!emotion) {
      emotion = await this.collection.create({
        petId,
        userId,
        happiness: 80,
        energy: 85,
        affection: 75,
        curiosity: 80,
        stress: 15,
        loneliness: 10,
        currentMood: 'happy',
        lastInteraction: new Date().toISOString()
      });
    }
    return emotion;
  },

  async applyDeltas(petId, deltas, options = {}) {
    let current = await this.findByPetId(petId);
    if (!current) return null;

    const clamp = (val) => Math.max(0, Math.min(100, Math.round(val)));
    const step = (cur, d) => {
      const mag = Math.abs(d || 0);
      const limited = Math.sign(d || 0) * Math.min(mag, 15);
      return clamp((cur ?? 0) + limited);
    };

    const happiness = step(current.happiness ?? 75, deltas.happiness);
    const energy = step(current.energy ?? 75, deltas.energy);
    const affection = step(current.affection ?? 75, deltas.affection);
    const curiosity = step(current.curiosity ?? 75, deltas.curiosity);
    const stress = step(current.stress ?? 20, deltas.stress);
    const loneliness = step(current.loneliness ?? 20, deltas.loneliness);

    const currentMood = deriveMood({ happiness, energy, affection, curiosity, stress, loneliness });
    const touchInteraction = options.touchInteraction !== false;

    return this.collection.findByIdAndUpdate(current._id, {
      happiness,
      energy,
      affection,
      curiosity,
      stress,
      loneliness,
      currentMood,
      lastInteraction: touchInteraction ? new Date().toISOString() : current.lastInteraction
    }, { new: true });
  }
};
