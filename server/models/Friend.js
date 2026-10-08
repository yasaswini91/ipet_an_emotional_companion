import { getCollection } from '../config/db.js';

export const Friend = {
  collection: getCollection('friends'),

  async findByPetId(petId) {
    return this.collection.find({ petId });
  },

  async create(friendData) {
    return this.collection.create({
      userId: friendData.userId,
      petId: friendData.petId,
      name: friendData.name,
      relation: friendData.relation || 'Good Friend',
      personality: friendData.personality || 'Enthusiastic and loyal',
      hobbies: friendData.hobbies || ['Running', 'Catching frisbees', 'Snack time'],
      description: friendData.description || 'A cheerful neighborhood buddy who loves greeting everyone.',
      avatarType: friendData.avatarType || 'dog',
      createdAt: new Date().toISOString()
    });
  },

  async seedDefaultFriends(userId, petId) {
    const existing = await this.findByPetId(petId);
    if (existing.length > 0) return existing;

    const defaultFriends = [
      {
        userId,
        petId,
        name: 'Max',
        relation: 'Good Friend',
        personality: 'Sporty & Adventurous',
        hobbies: ['Running', 'Swimming', 'Catching frisbees'],
        description: 'An athletic golden retriever who lives across the park and loves sprint races.',
        avatarType: 'dog'
      },
      {
        userId,
        petId,
        name: 'Zhuangzhuang',
        relation: 'Neighborhood Pal',
        personality: 'Curious & Relaxed',
        hobbies: ['Watching nature documentaries', 'Sunbathing on walls'],
        description: 'A thoughtful tabby cat who loves discovering quiet sunny spots.',
        avatarType: 'cat'
      },
      {
        userId,
        petId,
        name: 'Pippin',
        relation: 'Playmate',
        personality: 'Playful & Speedy',
        hobbies: ['Chasing butterflies', 'Crunchy carrot tasting'],
        description: 'A nimble bunny who loves exploring garden pathways.',
        avatarType: 'rabbit'
      }
    ];

    const created = [];
    for (const f of defaultFriends) {
      created.push(await this.create(f));
    }
    return created;
  }
};
