import express from 'express';
import { Pet } from '../models/Pet.js';
import { Surprise } from '../models/Surprise.js';
import { surpriseService } from '../services/surpriseService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

router.get('/:petId', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.petId);
    const surprises = await surpriseService.getSurprises(pet._id);
    res.json({ surprises });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error retrieving surprises', error: err.message });
  }
});

router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const { petId, force } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    const surprise = await surpriseService.evaluateAndTriggerSurprise({
      user: req.user,
      pet,
      force: !!force
    });

    res.json({ surprise });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error generating surprise', error: err.message });
  }
});

router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const surprise = await Surprise.collection.findById(req.params.id);
    if (!surprise) return res.status(404).json({ message: 'Surprise not found' });
    if (String(surprise.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await surpriseService.markSurpriseViewed(req.params.id);
    res.json({ surprise: updated });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error marking surprise viewed', error: err.message });
  }
});

export default router;
