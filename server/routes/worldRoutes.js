import express from 'express';
import { Pet } from '../models/Pet.js';
import { World } from '../models/World.js';
import { worldService } from '../services/worldService.js';
import { runTPlusOneWorldGeneration } from '../jobs/scheduler.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Get today's world (retrieves pre-generated or creates if first visit)
router.get('/:petId/today', authMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await getOwnedPet(req.user._id, petId);

    const world = await worldService.getTodayWorld({ user: req.user, pet });
    res.json({ world });
  } catch (err) {
    res.status(err.status || 500).json({ message: "Error fetching today's world", error: err.message });
  }
});

// Get world for specific date
router.get('/:petId/date/:date', authMiddleware, async (req, res) => {
  try {
    const { petId, date } = req.params;
    await getOwnedPet(req.user._id, petId);
    const world = await World.findByPetAndDate(petId, date);
    if (!world) return res.status(404).json({ message: 'No simulated world recorded for this date' });
    res.json({ world });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching world for date', error: err.message });
  }
});

// Force generate or regenerate a world for a date
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { petId, date, force } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    const world = await worldService.generateDailyWorld({
      user: req.user,
      pet,
      date: date || new Date().toISOString().split('T')[0],
      force: !!force
    });
    res.json({ world });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error generating world', error: err.message });
  }
});

// T+1 Offline Generation Trigger (Demonstration & manual testing)
router.post('/offline-trigger', authMiddleware, async (req, res) => {
  try {
    await runTPlusOneWorldGeneration();
    res.json({ message: 'T+1 Offline Simulation completed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error running T+1 generation', error: err.message });
  }
});

// Get current simulated environment / weather
router.get('/:petId/environment', authMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    await getOwnedPet(req.user._id, petId);
    const env = worldService.getCurrentEnvironment(petId);
    res.json({ environment: env });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching environment', error: err.message });
  }
});

export default router;
