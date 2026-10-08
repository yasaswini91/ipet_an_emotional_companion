import express from 'express';
import { Pet } from '../models/Pet.js';
import { Friend } from '../models/Friend.js';
import { PetEmotion } from '../models/PetEmotion.js';
import { PetGrowth } from '../models/PetGrowth.js';
import { worldService } from '../services/worldService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Create pet (Completes Onboarding workflow from Figure 1)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, species, breed, personality, hobbies, description, customization } = req.body;

    const pet = await Pet.create({
      userId: req.user._id,
      name: name || 'Mousse',
      species: species || 'cat',
      breed: breed || 'Mousse Maine',
      personality: personality || 'Easygoing',
      hobbies: hobbies || ['playing games', 'afternoon napping'],
      description: description || 'A gentle and caring little companion who loves to laugh.',
      customization: customization || {}
    });

    // Initialize friends F
    await Friend.seedDefaultFriends(req.user._id, pet._id);

    // Initialize Emotion state
    const emotion = await PetEmotion.getOrCreate(pet._id, req.user._id);

    // Initialize Growth state
    const growth = await PetGrowth.getOrCreate(pet._id, req.user._id);

    // Generate initial world for today
    const world = await worldService.getTodayWorld({ user: req.user, pet });

    res.status(201).json({
      pet,
      emotion,
      growth,
      world
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating pet', error: err.message });
  }
});

// Get user's pets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.findByUserId(req.user._id);
    res.json({ pets });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pets', error: err.message });
  }
});

// Get single pet with current status
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);

    const emotion = await PetEmotion.getOrCreate(pet._id, req.user._id);
    const growth = await PetGrowth.getOrCreate(pet._id, req.user._id);
    const friends = await Friend.findByPetId(pet._id);

    res.json({ pet, emotion, growth, friends });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching pet', error: err.message });
  }
});

// Update customization (colors, accessories, clothing, room)
router.put('/:id/customization', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);

    const currentCust = pet.customization || {};
    const updated = await Pet.updateById(pet._id, {
      customization: { ...currentCust, ...req.body }
    });

    res.json({ pet: updated });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error updating customization', error: err.message });
  }
});

// Update pet basic profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);
    const { name, breed, personality, hobbies, description } = req.body;
    const updated = await Pet.updateById(pet._id, {
      ...(name !== undefined && { name }),
      ...(breed !== undefined && { breed }),
      ...(personality !== undefined && { personality }),
      ...(hobbies !== undefined && { hobbies }),
      ...(description !== undefined && { description })
    });
    res.json({ pet: updated });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error updating pet', error: err.message });
  }
});

export default router;
