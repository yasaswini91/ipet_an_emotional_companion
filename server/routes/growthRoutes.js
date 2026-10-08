import express from 'express';
import { growthService } from '../services/growthService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);
    const growth = await growthService.getGrowth(pet._id, req.user._id);
    res.json({ growth });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching growth status', error: err.message });
  }
});

router.post('/:id/activity', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.id);
    const { activityType } = req.body;
    const growth = await growthService.recordActivity(pet._id, activityType);
    res.json({ growth });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error adding growth XP', error: err.message });
  }
});

export default router;
