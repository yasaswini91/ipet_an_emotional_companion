import express from 'express';
import { Pet } from '../models/Pet.js';
import { Message } from '../models/Message.js';
import { dialogueService } from '../services/dialogueService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Interactive Dialogue Endpoint
// Implements Equation (1): R = LLM(IR, H, T1, T2, T3, P, U, M)
router.post('/', authMiddleware, async (req, res) => {
  return handleChatMessage(req, res);
});

router.post('/message', authMiddleware, async (req, res) => {
  return handleChatMessage(req, res);
});

async function handleChatMessage(req, res) {
  try {
    const { petId, message, modeOverride } = req.body;
    if (!petId || !message) {
      return res.status(400).json({ message: 'petId and message are required' });
    }

    const pet = await getOwnedPet(req.user._id, petId);

    const result = await dialogueService.handleUserMessage({
      user: req.user,
      pet,
      userMessage: message,
      modeOverride,
      waitForMemory: false
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error in dialogue generation', error: err.message });
  }
}

// Get historical dialogue content H
router.get('/:petId', authMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    await getOwnedPet(req.user._id, petId);
    const limit = parseInt(req.query.limit || '50', 10);
    const messages = await Message.findByPetId(petId, limit);
    res.json({ messages });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error retrieving chat history', error: err.message });
  }
});

export default router;
