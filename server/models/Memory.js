import { getCollection } from '../config/db.js';
import { companionConfig } from '../config/companionConfig.js';

export const MemoryCategory = {
  PERMANENT: 'PERMANENT',
  LONG_TERM: 'LONG_TERM',
  SHORT_TERM: 'SHORT_TERM'
};

export const MemoryType = {
  USER_PREFERENCE: 'USER_PREFERENCE',
  USER_IDENTITY: 'USER_IDENTITY',
  GOAL: 'GOAL',
  PROJECT: 'PROJECT',
  EMOTION: 'EMOTION',
  DAILY_EVENT: 'DAILY_EVENT',
  SHARED_EXPERIENCE: 'SHARED_EXPERIENCE',
  PET_REFLECTION: 'PET_REFLECTION'
};

function expirationFor(category, createdDate) {
  if (category === MemoryCategory.LONG_TERM) {
    const exp = new Date(createdDate);
    exp.setMonth(exp.getMonth() + companionConfig.memory.longTermRetentionMonths);
    return exp.toISOString();
  }
  if (category === MemoryCategory.SHORT_TERM) {
    const exp = new Date(createdDate);
    exp.setMonth(exp.getMonth() + companionConfig.memory.shortTermRetentionMonths);
    return exp.toISOString();
  }
  return null;
}

function dayBounds(date) {
  const day = date || new Date().toISOString().split('T')[0];
  return { start: `${day}T00:00:00.000Z`, end: `${day}T23:59:59.999Z`, day };
}

export const Memory = {
  collection: getCollection('memories'),

  async findById(id) {
    return this.collection.findById(id);
  },

  async findByPetId(petId) {
    const list = await this.collection.find({ petId });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findActiveByPetId(petId, userId = null) {
    const now = new Date();
    const query = { petId };
    if (userId) query.userId = userId;
    const list = await this.collection.find(query);
    return list.filter((m) => !m.expiresAt || new Date(m.expiresAt) > now);
  },

  async findTouchedOnDate(petId, date) {
    const { start, end } = dayBounds(date);
    const list = await this.findActiveByPetId(petId);
    return list.filter((m) => {
      const created = m.createdAt || '';
      const updated = m.updatedAt || created;
      const inRange = (t) => t >= start && t <= end;
      return inRange(created) || inRange(updated);
    });
  },

  async create(memData) {
    const createdAt = memData.createdAt || new Date();
    const createdDate = new Date(createdAt);
    const category = memData.category || MemoryCategory.SHORT_TERM;
    const expiresAt = memData.expiresAt !== undefined ? memData.expiresAt : expirationFor(category, createdDate);

    const retentionPeriod = category === MemoryCategory.PERMANENT
      ? 'Indefinite'
      : (category === MemoryCategory.LONG_TERM ? '3 Months' : '1 Month');

    const retentionStability = category === MemoryCategory.PERMANENT
      ? 'Enduring user traits and preferences (retained indefinitely)'
      : (category === MemoryCategory.LONG_TERM
        ? 'Medium-term plans or intentions, activity participation, skill acquisition (retained for 3 months)'
        : 'Transient details such as recent events, immediate tasks, current feelings (retained for 1 month)');

    return this.collection.create({
      userId: memData.userId,
      petId: memData.petId,
      content: memData.content,
      category,
      type: memData.type || MemoryType.DAILY_EVENT,
      embedding: memData.embedding || [],
      importance: memData.importance ?? (category === MemoryCategory.PERMANENT ? 9.0 : (category === MemoryCategory.LONG_TERM ? 7.0 : 5.0)),
      confidence: memData.confidence ?? 0.85,
      sourceMessageIds: memData.sourceMessageIds || [],
      retentionPeriod,
      retentionStability,
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      expiresAt
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

  async deleteExpired() {
    const now = new Date().toISOString();
    const items = await this.collection.find({});
    let deletedCount = 0;
    for (const item of items) {
      if (item.expiresAt && item.expiresAt < now) {
        await this.collection.deleteOne({ _id: item._id });
        deletedCount++;
      }
    }
    return { deletedCount };
  },

  async countByPetId(petId) {
    return this.collection.countDocuments({ petId });
  }
};
