import { getCollection } from '../config/db.js';

export const RoadmapTask = {
  collection: getCollection('roadmap_tasks'),

  async findByUserId(userId) {
    const list = await this.collection.find({ userId });
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async create(data) {
    return this.collection.create({
      userId: data.userId,
      petId: data.petId || null,
      title: data.title,
      category: data.category || 'General',
      priority: data.priority || 'medium',
      time: data.time || 'All Day',
      completed: !!data.completed,
      completedAt: data.completed ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    });
  },

  async updateById(id, update) {
    return this.collection.findByIdAndUpdate(id, {
      ...update,
      updatedAt: new Date().toISOString()
    }, { new: true });
  },

  async deleteById(id) {
    return this.collection.deleteOne({ _id: id });
  },

  async calculateStreak(userId) {
    const tasks = await this.collection.find({ userId });
    const completedDates = new Set(
      tasks
        .filter(t => t.completed && t.completedAt)
        .map(t => t.completedAt.split('T')[0])
    );

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const current = new Date();
    // Check consecutive days backwards
    for (let i = 0; i < 365; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        // Not completed today yet, check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }
};
