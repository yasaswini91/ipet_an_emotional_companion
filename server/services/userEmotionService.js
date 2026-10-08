import { qwenService, QwenUnavailableError } from './qwenService.js';
import { logEvent, logError } from '../utils/logger.js';

const BASE_EMOTIONS = ['happy', 'sad', 'angry', 'anxious', 'excited', 'neutral', 'frustrated', 'lonely', 'surprised'];

const VALENCE = {
  happy: 0.8, excited: 0.85, surprised: 0.3, neutral: 0,
  sad: -0.7, lonely: -0.65, anxious: -0.75, angry: -0.7, frustrated: -0.6
};
const AROUSAL = {
  happy: 0.55, excited: 0.9, surprised: 0.85, neutral: 0.25,
  sad: 0.35, lonely: 0.3, anxious: 0.8, angry: 0.85, frustrated: 0.7
};

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function clampSigned(n) {
  return Math.max(-1, Math.min(1, Number(n) || 0));
}

const FAST_PATTERNS = [
  { regex: /^(hi|hello|hey|hiya|howdy|sup|good (morning|afternoon|evening))\b/i, emotion: 'happy', confidence: 0.95 },
  { regex: /\b(thank(s|\s+you)|appreciate|awesome|great|yay|glad|love you|love u|sweet|cute|wonderful|best|cool|haha|lol|nice)\b/i, emotion: 'happy', confidence: 0.90 },
  { regex: /\b(tir(ed|ing)|exhaust(ed|ing)|fatigue|sleepy|drained|burnout|hard\s+(and\s+)?tiring|long day|hard day)\b/i, emotion: 'sad', confidence: 0.85 },
  { regex: /\b(nervous|anxious|worried|anxiety|scared|panic|stress(ed)?|interview|exam|test|presentation|deadline)\b/i, emotion: 'anxious', confidence: 0.95 },
  { regex: /\b(sad|crying|depressed|unhappy|heartbroken|lonely|down|hurts?|pain|grief|miss you)\b/i, emotion: 'sad', confidence: 0.95 },
  { regex: /\b(angry|mad|furious|pissed|annoyed|hate|irritated|frustrated)\b/i, emotion: 'angry', confidence: 0.90 },
  { regex: /\b(excited|thrilled|hyped|can't wait|omg|wow)\b/i, emotion: 'excited', confidence: 0.95 }
];

export const userEmotionService = {
  async analyze(userMessage, { forceQwen = false } = {}) {
    const text = String(userMessage || '').trim();
    if (!text) {
      return { emotion: 'neutral', confidence: 1, valence: 0, arousal: 0.2, source: 'empty' };
    }

    // Fast path: common greetings and high-confidence emotional keywords (instant 0.001ms)
    if (!forceQwen) {
      for (const pat of FAST_PATTERNS) {
        if (pat.regex.test(text)) {
          const emotion = pat.emotion;
          const confidence = pat.confidence;
          const valence = VALENCE[emotion] ?? 0;
          const arousal = AROUSAL[emotion] ?? 0.3;
          logEvent('emotion.user_detected', { emotion, confidence, fast: true });
          return { emotion, confidence, valence, arousal, source: 'fast_pattern' };
        }
      }

      // If text is short (< 8 words) and has no strong emotion words, it's neutral
      if (text.split(/\s+/).length <= 7) {
        logEvent('emotion.user_detected', { emotion: 'neutral', confidence: 0.8, fast: true });
        return { emotion: 'neutral', confidence: 0.8, valence: 0, arousal: 0.2, source: 'fast_neutral' };
      }
    }

    try {
      const { parsed } = await qwenService.generateUserEmotion({
        systemPrompt: `Classify the USER's emotional state from one message.
Return strict JSON: {"emotion":"happy|sad|angry|anxious|excited|neutral|frustrated|lonely|surprised","confidence":0.0-1.0,"valence":-1.0-1.0,"arousal":0.0-1.0}
Do not classify the pet. Do not explain.`,
        userPrompt: text,
        maxTokens: 35
      });

      let emotion = String(parsed.emotion || 'neutral').toLowerCase();
      if (!BASE_EMOTIONS.includes(emotion)) emotion = 'neutral';
      const confidence = clamp01(parsed.confidence ?? 0.6);
      const valence = clampSigned(parsed.valence ?? VALENCE[emotion]);
      const arousal = clamp01(parsed.arousal ?? AROUSAL[emotion]);

      const result = { emotion, confidence, valence, arousal, source: 'qwen' };
      logEvent('emotion.user_detected', { emotion, confidence });
      return result;
    } catch (err) {
      logError('emotion.user_qwen_failed', err);
      if (err instanceof QwenUnavailableError) {
        return {
          emotion: 'neutral',
          confidence: 0,
          valence: 0,
          arousal: 0.3,
          source: 'UNAVAILABLE',
          error: err.message
        };
      }
      throw err;
    }
  }
};
