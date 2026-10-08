import express from 'express';
import { Pet } from '../models/Pet.js';
import { Message } from '../models/Message.js';
import { memoryService } from '../services/memoryService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet, assertOwnedMemory } from '../middleware/ownership.js';

const router = express.Router();

// Get all active and categorized memories for a pet
router.get('/:petId', authMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    await getOwnedPet(req.user._id, petId);
    const memories = await memoryService.getAllForPet(petId);
    res.json({ memories });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching memories', error: err.message });
  }
});

// Create a new categorized memory manually
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { petId, content, category } = req.body;
    if (!petId || !content) {
      return res.status(400).json({ message: 'petId and content are required' });
    }
    const pet = await getOwnedPet(req.user._id, petId);
    const memory = await memoryService.createCategorizedMemory({
      user: req.user,
      pet,
      content,
      category
    });
    res.status(201).json({ memory });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error creating memory', error: err.message });
  }
});

// Explicit Memory Extraction trigger (Collection stage {Mi, Cati} = LLM(Is, S, P, U))
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { petId } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    const recentMsgs = await Message.findByPetId(petId, 10);
    const sessionDialogue = recentMsgs
      .map(m => `${m.sender === 'user' ? 'User' : pet.name}: ${m.content}`)
      .join('\n');

    const newMemories = await memoryService.extractAndStoreMemories({
      sessionDialogue,
      pet,
      user: req.user
    });

    res.json({
      message: 'Memory collection stage completed',
      extractedCount: newMemories.length,
      memories: newMemories
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error processing memories', error: err.message });
  }
});

// Dense Retrieval Search Test (Cosine similarity demonstration)
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { petId, query, topK } = req.body;
    await getOwnedPet(req.user._id, petId);
    const results = await memoryService.getRelevantMemories(query, petId, topK || 5);
    res.json({ query, results });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error in dense memory retrieval', error: err.message });
  }
});

// Memory Deletion (Privacy & user control)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await assertOwnedMemory(req.user._id, req.params.id);
    await memoryService.deleteMemory(req.params.id);
    res.json({ message: 'Memory successfully removed' });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error deleting memory', error: err.message });
  }
});

export default router;
