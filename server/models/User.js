import { getCollection } from '../config/db.js';

export const User = {
  collection: getCollection('users'),

  async findById(id) {
    return this.collection.findById(id);
  },

  async findOne(filter) {
    return this.collection.findOne(filter);
  },

  async create(userData) {
    return this.collection.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.username, // Master Name U in paper
      interests: userData.interests || ['reading', 'music', 'programming'],
      preferences: userData.preferences || { favoriteFood: 'pasta', leisure: 'park strolls' },
      createdAt: new Date().toISOString()
    });
  },

  async updateById(id, update) {
    return this.collection.findByIdAndUpdate(id, update, { new: true });
  }
};
