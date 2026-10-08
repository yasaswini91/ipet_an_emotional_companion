import { getCollection } from '../config/db.js';

export const Surprise = {
  collection: getCollection('surprises'),

  async findByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findUnviewedByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.filter(s => !s.viewed);
  },

  async create(surpriseData) {
    return this.collection.create({
      userId: surpriseData.userId,
      petId: surpriseData.petId,
      memoryId: surpriseData.memoryId || null,
      type: surpriseData.type || 'gift', // gift, activity, environment, message, decoration
      title: surpriseData.title,
      description: surpriseData.description,
      reason: surpriseData.reason,
      viewed: false,
      createdAt: new Date().toISOString()
    });
  },

  async markViewed(id) {
    return this.collection.findByIdAndUpdate(id, { viewed: true });
  }
};
