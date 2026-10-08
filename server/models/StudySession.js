import { getCollection } from '../config/db.js';

export const StudySession = {
  collection: getCollection('study_sessions'),

  async create(data) {
    return this.collection.create({
      userId: data.userId,
      petId: data.petId,
      topic: data.topic || 'General Study',
      durationMinutes: data.durationMinutes || 25,
      mode: data.mode || 'pomodoro', // 'pomodoro', 'explain', 'quiz', 'notes'
      notes: data.notes || '',
      completed: data.completed !== undefined ? data.completed : true,
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
    return list.filter(s => s.timestamp >= start && s.timestamp <= end);
  }
};
