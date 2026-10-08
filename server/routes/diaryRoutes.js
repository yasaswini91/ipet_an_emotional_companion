import express from 'express';
import { Pet } from '../models/Pet.js';
import { diaryService } from '../services/diaryService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Get diary history for owned pet
router.get('/:petId', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.petId);
    const entries = await diaryService.getDiaryHistory(pet._id);
    res.json({ entries });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error retrieving diary entries', error: err.message });
  }
});

// Get or generate today's diary
router.get('/:petId/today', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.petId);
    const entry = await diaryService.getOrGenerateDailyDiary({ user: req.user, pet });
    res.json({ entry });
  } catch (err) {
    res.status(err.status || 500).json({ message: "Error fetching today's diary", error: err.message });
  }
});

// Explicit generate endpoint
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { petId, date, force } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);
    const entry = await diaryService.getOrGenerateDailyDiary({ user: req.user, pet, date, force: force ?? true });
    res.json({ entry });
  } catch (err) {
    console.error('[DiaryRoutes] Error generating pet diary:', err);
    res.status(err.status || 500).json({ message: 'Error generating pet diary', error: err.message });
  }
});

export default router;
