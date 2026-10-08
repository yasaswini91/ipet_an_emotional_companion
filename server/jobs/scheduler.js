import cron from 'node-cron';
import { Pet } from '../models/Pet.js';
import { User } from '../models/User.js';
import { worldService } from '../services/worldService.js';
import { memoryService } from '../services/memoryService.js';
import { diaryService } from '../services/diaryService.js';
import { surpriseService } from '../services/surpriseService.js';

import { petEmotionService } from '../services/petEmotionService.js';

export async function runTPlusOneWorldGeneration() {
  console.log('⏰ [T+1 Offline Worker] Starting scheduled daily world construction and memory summarization...');
  try {
    const allPets = await Pet.collection.find({});
    for (const pet of allPets) {
      const user = await User.findById(pet.userId);
      if (!user) continue;

      // 1. Apply time-based emotion decay
      await petEmotionService.applyTimeDecay(pet._id);

      // 2. Generate tomorrow's world (T+1)
      await worldService.generateNextDayWorld({ user, pet });

      // 3. Generate evening pet diary
      await diaryService.getOrGenerateDailyDiary({ user, pet });

      // 4. Evaluate potential surprises
      await surpriseService.evaluateAndTriggerSurprise({ user, pet });
    }
    console.log(`✅ [T+1 Offline Worker] Successfully pre-generated world & diaries for ${allPets.length} pets.`);
  } catch (err) {
    console.error('❌ [T+1 Offline Worker] Error running T+1 generation:', err);
  }
}

export async function runMemoryCleanup() {
  console.log('🧹 [Memory Management] Running temporal retention cleanup job...');
  try {
    const result = await memoryService.cleanupExpired();
    console.log(`✅ [Memory Management] Cleaned up ${result.deletedCount} expired memory entries.`);
  } catch (err) {
    console.error('❌ [Memory Management] Error cleaning memories:', err);
  }
}

export function initScheduledJobs() {
  // Run every day at 03:00 AM (off-peak hours as specified in Section 2.4)
  cron.schedule('0 3 * * *', () => {
    runTPlusOneWorldGeneration();
    runMemoryCleanup();
  });

  // Also run memory retention check every 6 hours
  cron.schedule('0 */6 * * *', () => {
    runMemoryCleanup();
  });

  console.log('📅 [Scheduler] Daily T+1 offline world generation and memory cleanup jobs registered.');
}
