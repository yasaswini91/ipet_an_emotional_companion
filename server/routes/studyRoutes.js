import express from 'express';
import { StudySession } from '../models/StudySession.js';
import { PetGrowth } from '../models/PetGrowth.js';
import { PetEmotion } from '../models/PetEmotion.js';
import { qwenService } from '../services/qwenService.js';
import { authMiddleware } from '../middleware/auth.js';
import { getOwnedPet } from '../middleware/ownership.js';

const router = express.Router();

// Record a completed study session
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { petId, topic, durationMinutes, mode, notes } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    const session = await StudySession.create({
      userId: req.user._id,
      petId: pet._id,
      topic: topic || 'Study Session',
      durationMinutes: durationMinutes || 25,
      mode: mode || 'pomodoro',
      notes: notes || '',
      completed: true
    });

    // Award knowledge growth XP (not generic play!)
    const growth = await PetGrowth.addXP(pet._id, 8, 'knowledge');

    // Pet learns alongside user: thoughtful/curious emotion boost
    const emotion = await PetEmotion.applyDeltas(pet._id, {
      happiness: 4,
      affection: 3,
      energy: -2,
      curiosity: 8
    });

    res.json({ session, growth, emotion });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error recording study session', error: err.message });
  }
});

// Qwen-backed study assistant actions
router.post('/action', authMiddleware, async (req, res) => {
  try {
    const { petId, action, topic } = req.body;
    const pet = await getOwnedPet(req.user._id, petId);

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'Topic or concept is required' });
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'generate_notes') {
      systemPrompt = `You are ${pet.name}, a helpful and encouraging pet companion studying alongside your master.
Generate structured, easy-to-read study notes for the given topic. Include key concepts, bullet points, and a brief encouraging tip from ${pet.name}. Keep it under 200 words.`;
      userPrompt = `Please generate study notes on: "${topic}"`;
    } else if (action === 'quiz_me') {
      systemPrompt = `You are ${pet.name}, a friendly study buddy. Create a fun, 3-question multiple choice quiz on the topic with question, options A/B/C, and an explanation of the correct answers at the end.`;
      userPrompt = `Create a 3-question quiz on: "${topic}"`;
    } else if (action === 'explain_concept') {
      systemPrompt = `You are ${pet.name}, a curious and caring companion. Explain the requested concept in clear, simple terms with a vivid analogy and cheerful encouragement. Keep it friendly and concise.`;
      userPrompt = `Please explain this concept simply: "${topic}"`;
    } else {
      return res.status(400).json({ message: `Unknown study action: ${action}` });
    }

    const qwenResult = await qwenService.generateRaw({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      task: 'study_assist'
    });

    res.json({
      action,
      topic,
      result: qwenResult.text,
      petName: pet.name,
      modelStatus: qwenResult.modelStatus
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error executing study action', error: err.message });
  }
});

// Get study session history
router.get('/:petId/history', authMiddleware, async (req, res) => {
  try {
    const pet = await getOwnedPet(req.user._id, req.params.petId);
    const history = await StudySession.findByPetId(pet._id);
    res.json({ history });
  } catch (err) {
    res.status(err.status || 500).json({ message: 'Error fetching study history', error: err.message });
  }
});

export default router;
