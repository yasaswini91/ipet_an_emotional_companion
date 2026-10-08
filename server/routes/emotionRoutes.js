import express from 'express';
import { emotionService } from '../services/emotionService.js';
import { growthService } from '../services/growthService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);
    const emotion = await emotionService.getEmotion(pet._id, req.user._id);
    res.json({ emotion });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching emotion', error: err.message });
  }
});

// Interactive state changes: play, feed, pet, rest, explore
router.post('/:id/interact', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);
    const { action } = req.body; // 'play', 'feed', 'pet', 'rest', 'explore'
    const updatedEmotion = await emotionService.interact(pet._id, action);

    // Also award XP for growth
    const growthActionMap = {
      play: 'play',
      feed: 'feed',
      explore: 'play',
      pet: 'chat'
    };
    const updatedGrowth = await growthService.recordActivity(pet._id, growthActionMap[action] || 'play');

    res.json({
      emotion: updatedEmotion,
      growth: updatedGrowth,
      action
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error performing emotion interaction', error: err.message });
  }
});

export default router;
