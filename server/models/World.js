import { getCollection } from '../config/db.js';

export const World = {
  collection: getCollection('worlds'),

  async findByPetAndDate(petId, date) {
    return this.collection.findOne({ petId, date });
  },

  async findLatestByPetId(petId) {
    const list = await this.collection.find({ petId });
    if (list.length === 0) return null;
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list[0];
  },

  async create(worldData) {
    return this.collection.create({
      userId: worldData.userId,
      petId: worldData.petId,
      date: worldData.date, // "YYYY-MM-DD"
      mode: worldData.mode, // "NORMAL" | "MEMORY"
      outline: worldData.outline, // T1
      schedules: worldData.schedules || [], // T2 [{ time: "06:00", activity: "Wake up" }, ...]
      details: worldData.details || [], // T3 [{ time: "06:00", activity: "Wake up", detail: "~50 words..." }, ...]
      weather: worldData.weather || {
        season: 'Spring',
        weather: 'Sunny',
        temperature: '21°C',
        description: 'Gentle morning breeze with golden sunlight'
      },
      isOfflineGenerated: !!worldData.isOfflineGenerated,
      generatedAt: new Date().toISOString()
    });
  },

  async findByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }
};
