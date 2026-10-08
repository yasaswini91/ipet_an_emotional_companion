import { World } from '../models/World.js';
import { Friend } from '../models/Friend.js';
import { Memory } from '../models/Memory.js';
import { qwenService, QwenUnavailableError } from './qwenService.js';
import { buildOutlinePrompt } from '../prompts/outlinePrompt.js';
import { buildSchedulePrompt } from '../prompts/schedulePrompt.js';
import { buildDetailPrompt } from '../prompts/detailPrompt.js';

function deterministicWeather(seedStr, dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const month = d.getMonth(); // 0 - 11
  let season = 'Spring';
  if (month >= 5 && month <= 7) season = 'Summer';
  else if (month >= 8 && month <= 10) season = 'Autumn';
  else if (month >= 11 || month <= 1) season = 'Winter';

  const weatherOptions = ['Sunny', 'Partly Cloudy', 'Gentle Rain', 'Clear Sky'];
  const fullSeed = `${seedStr || 'ipet'}_${dateStr || 'today'}`;
  let hash = 0;
  for (let i = 0; i < fullSeed.length; i++) {
    hash = (hash * 31 + fullSeed.charCodeAt(i)) & 0xffffffff;
  }
  const idx = Math.abs(hash) % weatherOptions.length;
  const selectedWeather = weatherOptions[idx];

  return {
    season,
    weather: selectedWeather,
    temperature: season === 'Summer' ? '28°C' : (season === 'Winter' ? '7°C' : '20°C'),
    description: `Pleasant ${season.toLowerCase()} day with ${selectedWeather.toLowerCase()}`
  };
}

export const worldService = {
  // Determine deterministic simulated weather & season per petId + date
  getCurrentEnvironment(petId = 'pet', date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return deterministicWeather(petId, targetDate);
  },

  // 3-Stage World Simulation Pipeline
  async generateDailyWorld({ user, pet, date = null, isOffline = false, force = false }) {
    const worldDate = date || new Date().toISOString().split('T')[0];

    // Check if world already generated for this date
    const existing = await World.findByPetAndDate(pet._id, worldDate);
    if (existing && !force) {
      return existing;
    }
    if (existing && force) {
      await World.deleteById(existing._id);
    }

    // Retrieve virtual friends F
    let friends = await Friend.findByPetId(pet._id);
    if (friends.length === 0) {
      friends = await Friend.seedDefaultFriends(user._id, pet._id);
    }

    // Retrieve active memories M
    const memories = await Memory.findActiveByPetId(pet._id, user._id);

    // Determine Mode: NORMAL vs MEMORY (Section 2.3 of paper)
    const mode = memories.length > 0 ? 'MEMORY' : 'NORMAL';
    const weather = this.getCurrentEnvironment(pet._id, worldDate);

    // ==========================================
    // STAGE 1: OUTLINE GENERATION (T1)
    // T1n = LLM(I1n, P, U, F) or T1m = LLM(I1m, P, U, F, M)
    // ==========================================
    const outlinePrompts = buildOutlinePrompt({
      mode,
      pet,
      user,
      friends,
      memories,
      weather
    });

    let outline = '';
    try {
      const outlineRes = await qwenService.generateRaw({
        systemPrompt: outlinePrompts.systemPrompt,
        userPrompt: outlinePrompts.userPrompt,
        temperature: 0.9,
        task: 'world_t1'
      });
      outline = outlineRes.text?.trim();
    } catch (err) {
      throw new QwenUnavailableError(
        `World simulation Stage 1 (T1 Outline) failed: Qwen is unavailable (${err.message}). No fabricated simulation returned.`,
        { stage: 'T1', petId: pet._id, date: worldDate }
      );
    }

    // ==========================================
    // STAGE 2: SCHEDULE GENERATION (T2)
    // {T2i} = LLM(I2, T1, P, U, F, [M])
    // Requirement: Brief 2 to 5 words per activity!
    // ==========================================
    const schedulePrompts = buildSchedulePrompt({
      outline,
      pet,
      user,
      friends,
      memories
    });

    let schedules = [];
    try {
      const scheduleRes = await qwenService.generateStructuredJSON({
        systemPrompt: schedulePrompts.systemPrompt,
        userPrompt: schedulePrompts.userPrompt,
        temperature: 0.7,
        task: 'world_t2'
      });
      const parsed = scheduleRes.parsed;
      if (Array.isArray(parsed?.schedules) && parsed.schedules.length > 0) {
        schedules = parsed.schedules;
      } else {
        throw new Error('Qwen did not produce a schedules array');
      }
    } catch (err) {
      throw new QwenUnavailableError(
        `World simulation Stage 2 (T2 Schedule) failed: Qwen is unavailable (${err.message}).`,
        { stage: 'T2', petId: pet._id, date: worldDate }
      );
    }

    // ==========================================
    // STAGE 3: DETAIL GENERATION (T3)
    // T3i = LLM(I3, T1, T2i, P, U, F, [M])
    // Requirement: ~50 words per schedule item
    // ==========================================
    const details = [];
    // Detail items generated for key schedule points (morning, afternoon, evening)
    const keyItems = schedules.slice(0, Math.min(schedules.length, 3));
    for (const item of keyItems) {
      const detailPrompts = buildDetailPrompt({
        outline,
        scheduleItem: item,
        pet,
        user,
        friends,
        memories
      });

      try {
        const detailRes = await qwenService.generateStructuredJSON({
          systemPrompt: detailPrompts.systemPrompt,
          userPrompt: detailPrompts.userPrompt,
          temperature: 0.85,
          task: 'world_t3'
        });
        const detailText = detailRes.parsed?.detail || detailRes.parsed?.description || '';
        details.push({
          time: item.time,
          activity: item.activity,
          detail: detailText
        });
      } catch (err) {
        throw new QwenUnavailableError(
          `World simulation Stage 3 (T3 Detail) failed: Qwen is unavailable (${err.message}).`,
          { stage: 'T3', petId: pet._id, date: worldDate }
        );
      }
    }

    // Store in World Database
    const savedWorld = await World.create({
      userId: user._id,
      petId: pet._id,
      date: worldDate,
      mode,
      outline,
      schedules,
      details,
      weather,
      isOfflineGenerated: isOffline
    });

    return savedWorld;
  },

  // Online retrieval: get today's world or create seed immediately
  async getTodayWorld({ user, pet }) {
    const today = new Date().toISOString().split('T')[0];
    let world = await World.findByPetAndDate(pet._id, today);
    if (!world) {
      world = await World.create({
        userId: user._id,
        petId: pet._id,
        date: today,
        mode: 'NORMAL',
        outline: `A pleasant, sunny day filled with playful energy, grooming, and cozy afternoon resting.`,
        schedules: [
          { time: '09:00', activity: 'Morning stretching and grooming' },
          { time: '13:00', activity: 'Sunny afternoon nap' },
          { time: '17:00', activity: 'Playful exploration' }
        ],
        details: [],
        weather: this.getCurrentEnvironment(pet._id, today),
        isOfflineGenerated: false
      });
      // Asynchronously enhance with full multi-stage simulation in the background
      this.generateDailyWorld({ user, pet, date: today, force: true }).catch(() => {});
    }
    return world;
  },

  // T+1 Strategy: Generate tomorrow's world offline
  async generateNextDayWorld({ user, pet }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const existing = await World.findByPetAndDate(pet._id, tomorrowStr);
    if (existing) return existing;

    return this.generateDailyWorld({ user, pet, date: tomorrowStr, isOffline: true });
  }
};
