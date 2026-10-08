import express from 'express';
import { speechToTextService, textToSpeechService } from '../services/voiceService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/transcribe', authMiddleware, async (req, res) => {
  try {
    const result = await speechToTextService.transcribeAudio(req.body.audio, req.body.mimeType);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, error: err.message, code: err.code });
  }
});

router.post('/speak', authMiddleware, async (req, res) => {
  try {
    const { text, personality } = req.body;
    const result = await textToSpeechService.synthesizeSpeech(text, personality);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'TTS error', error: err.message });
  }
});

export default router;
