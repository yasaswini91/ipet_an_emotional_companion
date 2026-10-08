import { getCollection } from '../config/db.js';

export const DiaryEntry = {
  collection: getCollection('diary_entries'),

  async findByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async findByPetAndDate(petId, date, type = 'PET') {
    const list = await this.collection.find({ petId, date });
    return list.find((e) => (e.type || 'PET') === type) || null;
  },

  async create(entryData) {
    return this.collection.create({
      userId: entryData.userId,
      petId: entryData.petId,
      type: entryData.type || 'PET',
      date: entryData.date,
      title: entryData.title,
      content: entryData.content,
      mood: entryData.mood || 'happy',
      weather: entryData.weather || 'Sunny',
      highlights: entryData.highlights || [],
      sourceMemoryIds: entryData.sourceMemoryIds || [],
      sourceMessageIds: entryData.sourceMessageIds || [],
      sourceWorldId: entryData.sourceWorldId || null,
      generationStatus: entryData.generationStatus || 'GENERATED',
      generatedAt: entryData.generatedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  },

  async updateById(id, update) {
    return this.collection.findByIdAndUpdate(id, update, { new: true });
  },

  async deleteById(id) {
    return this.collection.deleteOne({ _id: id });
  }
};
