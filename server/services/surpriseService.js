import { Surprise } from '../models/Surprise.js';
import { Memory } from '../models/Memory.js';
import { PetEmotion } from '../models/PetEmotion.js';
import { World } from '../models/World.js';
import { qwenService } from './qwenService.js';
import { buildSurprisePrompt } from '../prompts/surprisePrompt.js';

export const surpriseService = {
  async evaluateAndTriggerSurprise({ user, pet, force = false }) {
    const unviewed = await Surprise.findUnviewedByPetId(pet._id);
    if (unviewed.length > 0 && !force) {
      return unviewed[0];
    }

    const memories = await Memory.findActiveByPetId(pet._id, user._id);
    if (memories.length === 0) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const world = await World.findByPetAndDate(pet._id, today);
    const emotion = await PetEmotion.findByPetId(pet._id);

    const { systemPrompt, userPrompt } = buildSurprisePrompt({
      pet,
      memories: memories.slice(0, 5),
      weather: world?.weather,
      emotion
    });

    let surpriseData = null;
    try {
      const res = await qwenService.generateStructuredJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        task: 'surprise'
      });
      surpriseData = res.parsed;
    } catch (err) {
      console.warn('[SurpriseService] Qwen evaluation failed or unavailable:', err.message);
      // Requirement: If Qwen fails, NO surprise. Do not create a fake gift.
      if (!force) return null;
      // If force was explicitly requested by user in testing/debug, only then proceed
      surpriseData = {
        hasSurprise: true,
        memoryId: memories[0]?._id,
        type: 'gift',
        title: `A token from ${pet.name}`,
        description: `${pet.name} left something special remembering: "${memories[0]?.content}".`,
        reason: 'Inspired by a shared memory.'
      };
    }

    if (surpriseData && surpriseData.hasSurprise) {
      // Validate referenced memory exists
      const referencedMemory = memories.find(m => String(m._id) === String(surpriseData.memoryId)) || memories[0];

      return Surprise.create({
        userId: user._id,
        petId: pet._id,
        memoryId: referencedMemory?._id || null,
        type: surpriseData.type || 'gift',
        title: surpriseData.title || `Surprise from ${pet.name}`,
        description: surpriseData.description || 'A gentle surprise prepared by your companion.',
        reason: surpriseData.reason || `Inspired by: ${referencedMemory?.content || 'a warm memory'}`
      });
    }

    return null;
  },

  async getSurprises(petId) {
    return Surprise.findByPetId(petId);
  },

  async markSurpriseViewed(id) {
    return Surprise.markViewed(id);
  }
};
