import { getCollection } from '../config/db.js';

export const Message = {
  collection: getCollection('messages'),

  async findByPetId(petId, limit = 50) {
    const all = await this.collection.find({ petId });
    all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return all.slice(-limit);
  },

  async create(msgData) {
    return this.collection.create({
      userId: msgData.userId,
      petId: msgData.petId,
      sender: msgData.sender, // 'user' or 'pet'
      content: msgData.content,
      emotionState: msgData.emotionState || null,
      scheduleContext: msgData.scheduleContext || null,
      createdAt: msgData.createdAt || new Date().toISOString()
    });
  },

  async findByPetAndDate(petId, date) {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const all = await this.collection.find({ petId });
    return all.filter((m) => m.createdAt >= start && m.createdAt <= end)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async countByPetId(petId) {
    return this.collection.countDocuments({ petId });
  },

  async countTotal() {
    return this.collection.countDocuments();
  }
};
