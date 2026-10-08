import { getCollection } from '../config/db.js';

export const GameSession = {
  collection: getCollection('game_sessions'),

  async create(data) {
    return this.collection.create({
      userId: data.userId,
      petId: data.petId,
      gameType: data.gameType,
      score: data.score || 0,
      result: data.result || 'completed', // 'win', 'loss', 'draw', 'completed'
      duration: data.duration || 0, // seconds
      timestamp: data.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  },

  async findByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async findByPetAndDate(petId, date) {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const list = await this.collection.find({ petId });
    return list.filter(g => g.timestamp >= start && g.timestamp <= end);
  }
};
