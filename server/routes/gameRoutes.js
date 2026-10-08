import express from 'express';
import { GameSession } from '../models/GameSession.js';
import { PetGrowth } from '../models/PetGrowth.js';
import { PetEmotion } from '../models/PetEmotion.js';
import { memoryService } from '../services/memoryService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Record game result
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const { petId, gameType, score, result, duration } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    const session = await GameSession.create({
      userId: req.user._id,
      petId: pet._id,
      gameType,
      score: score || 0,
      result: result || 'completed',
      duration: duration || 0
    });

    // Award game/play growth XP
    const growth = await PetGrowth.addXP(pet._id, 5, 'curiosity');

    // Update pet emotion: playing games boosts happiness and energy
    const emotion = await PetEmotion.applyDeltas(pet._id, {
      happiness: 6,
      energy: -2,
      affection: 3,
      boredom: -5
    });

    // Optionally create a meaningful memory if result was notable (e.g. win with high score)
    let memory = null;
    if (result === 'win' || (score && score > 50)) {
      try {
        const mems = await memoryService.extractAndStoreMemories({
          sessionDialogue: `User and ${pet.name} played ${gameType}. User achieved a score of ${score} and ${result === 'win' ? 'won' : 'did great'}.`,
          pet,
          user: req.user
        });
        memory = mems?.[0] || null;
      } catch (e) {
        // non-blocking
      }
    }

    res.json({ session, growth, emotion, memory });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error recording game session', error: err.message });
  }
});

// Get game history for pet
router.get('/:petId/history', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.petId);
    const history = await GameSession.findByPetId(pet._id);
    res.json({ history });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error retrieving game history', error: err.message });
  }
});

export default router;
