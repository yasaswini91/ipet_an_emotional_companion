import { DiaryEntry } from '../models/DiaryEntry.js';
import { World } from '../models/World.js';
import { PetEmotion } from '../models/PetEmotion.js';
import { Memory } from '../models/Memory.js';
import { Message } from '../models/Message.js';
import { GameSession } from '../models/GameSession.js';
import { StudySession } from '../models/StudySession.js';
import { qwenService } from './qwenService.js';
import { buildDiaryPrompt } from '../prompts/diaryPrompt.js';

export const diaryService = {
  async getOrGenerateDailyDiary({ user, pet, date = null, force = false }) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Idempotent per petId + date
    const existing = await DiaryEntry.findByPetAndDate(pet._id, targetDate);
    if (existing && !force) return existing;

    // Collect REAL day data
    const world = await World.findByPetAndDate(pet._id, targetDate);
    const emotion = await PetEmotion.findByPetId(pet._id);
    const todayMessages = await Message.findByPetAndDate(pet._id, targetDate);
    const todayMemories = await Memory.findTouchedOnDate(pet._id, targetDate);
    const activeMemories = await Memory.findActiveByPetId(pet._id, user._id);
    const permanentMemories = activeMemories.filter(m => m.category === 'PERMANENT').slice(0, 3);
    const todayGames = await GameSession.findByPetAndDate(pet._id, targetDate);
    const todayStudy = await StudySession.findByPetAndDate(pet._id, targetDate);

    // Combine memories for prompt (today's memories + permanent profile memories)
    const combinedMemories = [...todayMemories];
    permanentMemories.forEach(pm => {
      if (!combinedMemories.some(m => String(m._id) === String(pm._id))) {
        combinedMemories.push(pm);
      }
    });

    // Format real activities and events
    const gameNotes = todayGames.map(g => `${g.gameType} (${g.result})`).join(', ');
    const studyNotes = todayStudy.map(s => `${s.topic} (${s.durationMinutes} min)`).join(', ');

    // Extract recent user topics / moments
    let recentMoments = '';
    const userMessages = (todayMessages || []).filter(m => m.sender === 'user').slice(-3);
    if (userMessages.length > 0) {
      recentMoments = userMessages.map(m => m.content).slice(-2).join('; ');
    }
    if (gameNotes) recentMoments += (recentMoments ? ', played ' : 'Played ') + gameNotes;
    if (studyNotes) recentMoments += (recentMoments ? ', studied ' : 'Studied ') + studyNotes;

    const { systemPrompt, userPrompt } = buildDiaryPrompt({
      pet,
      world,
      emotion,
      weather: world?.weather,
      recentMemories: combinedMemories.slice(0, 3),
      recentMoments
    });

    let diaryContent = '';
    try {
      const qwenRes = await qwenService.generateRaw({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        task: 'diary',
        maxTokens: 55
      });
      diaryContent = (qwenRes?.text || '').trim();
    } catch (err) {
      console.warn('[DiaryService] Qwen generation fallback triggered:', err.message);
      // Fallback: warm synthesized companion reflection from today's real world & pet state
      const weatherDesc = world?.weather?.weather || 'bright sunny';
      const moodDesc = emotion?.currentMood || 'happy';
      diaryContent = `Dear Diary, today was such a gentle and comforting day with my human. Under the ${weatherDesc} sky, feeling ${moodDesc}, every moment we spent together talking and cuddling filled my heart with warmth and joy.`;
    }

    if (!diaryContent || diaryContent.length < 15) {
      diaryContent = `Dear Diary, today was such a gentle and comforting day with my human. Every moment we spent together filled my heart with warmth and joy.`;
    }

    // Clean up any stray quotes
    diaryContent = diaryContent.replace(/^["'\s]+|["'\s]+$/g, '');

    // Trim trailing incomplete sentence if any
    if (diaryContent.includes('.')) {
      const lastPeriodIdx = diaryContent.lastIndexOf('.');
      if (lastPeriodIdx > 25) {
        diaryContent = diaryContent.slice(0, lastPeriodIdx + 1).trim();
      }
    }

    // Now safely replace the previous entry if force is true
    if (existing) {
      await DiaryEntry.deleteById(existing._id);
    }

    // Provenance validation
    const sourceMemoryIds = combinedMemories.map(m => m._id).filter(Boolean);
    const sourceMessageIds = (todayMessages || []).map(m => m._id).filter(Boolean);
    const sourceWorldId = world?._id || null;

    const title = `${pet.name}'s Diary for ${targetDate}`;

    return DiaryEntry.create({
      userId: user._id,
      petId: pet._id,
      type: 'PET',
      date: targetDate,
      title,
      content: diaryContent,
      mood: emotion?.currentMood || 'happy',
      weather: world?.weather?.weather || 'Sunny',
      highlights: (world?.schedules || []).slice(0, 3).map(s => s.activity),
      sourceMemoryIds,
      sourceMessageIds,
      sourceWorldId,
      generationStatus: 'GENERATED',
      generatedAt: new Date().toISOString()
    });
  },

  async getDiaryHistory(petId) {
    return DiaryEntry.findByPetId(petId);
  }
};
