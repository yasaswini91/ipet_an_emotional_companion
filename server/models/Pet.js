import { getCollection } from '../config/db.js';

export const Pet = {
  collection: getCollection('pets'),

  async findById(id) {
    return this.collection.findById(id);
  },

  async findOne(filter) {
    return this.collection.findOne(filter);
  },

  async findByUserId(userId) {
    return this.collection.find({ userId });
  },

  async create(petData) {
    return this.collection.create({
      userId: petData.userId,
      name: petData.name || 'Mousse',
      species: petData.species || 'cat', // bird, cat, dragon, rabbit, capybara, dog
      breed: petData.breed || 'Mousse Maine',
      personality: petData.personality || 'Easygoing', // Sunny, Easygoing, Tsundere, Foodie, Otaku, Random
      hobbies: petData.hobbies || ['playing games', 'afternoon napping'],
      description: petData.description || 'A gentle and caring little companion with soft fur who loves company.',
      avatarUrl: petData.avatarUrl || '',
      customization: {
        color: petData.customization?.color || '#ffb703',
        eyeColor: petData.customization?.eyeColor || '#023047',
        accessory: petData.customization?.accessory || 'none', // none, red_bow, wizard_hat, cute_glasses, cozy_scarf, beret
        outfit: petData.customization?.outfit || 'default', // default, sweater, hoodie, adventurer_vest
        roomTheme: petData.customization?.roomTheme || 'warm_cottage' // warm_cottage, sakura_garden, sci_fi_den, starry_rooftop
      },
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
