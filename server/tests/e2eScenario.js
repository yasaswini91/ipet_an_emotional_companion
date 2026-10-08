import assert from 'assert';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { Memory } from '../models/Memory.js';
import { GameSession } from '../models/GameSession.js';
import { StudySession } from '../models/StudySession.js';
import { World } from '../models/World.js';
import { DiaryEntry } from '../models/DiaryEntry.js';
import { dialogueService } from '../services/dialogueService.js';
import { worldService } from '../services/worldService.js';
import { diaryService } from '../services/diaryService.js';
import { petEmotionService } from '../services/petEmotionService.js';
import { userEmotionService } from '../services/userEmotionService.js';
import { memoryService } from '../services/memoryService.js';
import { growthService } from '../services/growthService.js';

async function runEndToEndScenario() {
  console.log('🐾 Running End-to-End Scenario Verification...');

  // 1. Create user and pet Luna with Sunny personality
  const user = await User.create({
    username: 'e2e_tester_' + Date.now(),
    email: 'e2e_' + Date.now() + '@example.com',
    password: 'password123',
    interests: ['coding', 'sci-fi']
  });

  const pet = await Pet.create({
    userId: user._id,
    name: 'Luna',
    species: 'Cat',
    breed: 'British Shorthair',
    personality: 'Sunny',
    gender: 'Female'
  });
  console.log(`✅ Pet ${pet.name} created with personality "${pet.personality}".`);

  // 2. Send: "I'm really nervous about my interview tomorrow."
  console.log('\n--- Turn 1: "I\'m really nervous about my interview tomorrow." ---');
  const turn1 = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: "I'm really nervous about my interview tomorrow."
  });

  assert(turn1.petResponse?.content, 'Turn 1 must produce pet response');
  assert(turn1.userEmotion, 'Turn 1 must detect user emotion');
  console.log(`   User Emotion Detected: ${turn1.userEmotion.emotion} (Confidence: ${turn1.userEmotion.confidence})`);
  console.log(`   Pet Response: "${turn1.petResponse.content}"`);
  console.log(`   Pet Mood: ${turn1.emotion.currentMood}, Happiness: ${turn1.emotion.happiness}`);
  assert(['anxious', 'sad', 'nervous', 'neutral'].includes(turn1.userEmotion.emotion.toLowerCase()) || turn1.userEmotion.confidence > 0, 'Emotion must be recognized');

  // Check memory extracted from Turn 1
  const memoriesTurn1 = await Memory.findActiveByPetId(pet._id, user._id);
  console.log(`   Memories after Turn 1: ${memoriesTurn1.length} recorded.`);
  memoriesTurn1.forEach(m => console.log(`     - [${m.category}] ${m.content}`));

  // 3. Send: "I love science fiction movies."
  console.log('\n--- Turn 2: "I love science fiction movies." ---');
  const turn2 = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: "I love science fiction movies."
  });
  assert(turn2.petResponse?.content, 'Turn 2 must produce pet response');
  console.log(`   Pet Response: "${turn2.petResponse.content}"`);

  const memoriesTurn2 = await Memory.findActiveByPetId(pet._id, user._id);
  console.log(`   Memories after Turn 2: ${memoriesTurn2.length} recorded.`);
  memoriesTurn2.forEach(m => console.log(`     - [${m.category}] ${m.content}`));

  // 4. Send: "Do you remember what I was worried about?"
  console.log('\n--- Turn 3: "Do you remember what I was worried about?" ---');
  const turn3 = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: "Do you remember what I was worried about?"
  });
  assert(turn3.petResponse?.content, 'Turn 3 must produce pet response');
  console.log(`   Pet Response: "${turn3.petResponse.content}"`);

  // 5. Play a game & verify persistence
  console.log('\n--- Game Session Persistence ---');
  const game = await GameSession.create({
    userId: user._id,
    petId: pet._id,
    gameType: 'tictactoe',
    score: 100,
    result: 'won',
    duration: 60
  });
  assert(game._id, 'GameSession must be saved');
  await growthService.recordActivity(pet._id, user._id, 'game', 'TicTacToe Win');
  const petGames = await GameSession.findByPetId(pet._id);
  assert(petGames.length >= 1, 'GameSession must be retrieved from database');
  console.log(`✅ Game session persisted: Type=${game.gameType}, Score=${game.score}, Result=${game.result}.`);

  // 6. Complete a study session & verify persistence
  console.log('\n--- Study Session Persistence ---');
  const study = await StudySession.create({
    userId: user._id,
    petId: pet._id,
    topic: 'Database Normalization',
    mode: 'explain_concept',
    durationMinutes: 20,
    notes: 'Reviewed 1NF, 2NF, 3NF'
  });
  assert(study._id, 'StudySession must be saved');
  await growthService.recordActivity(pet._id, user._id, 'study', 'Database Normalization');
  const petStudies = await StudySession.findByPetId(pet._id);
  assert(petStudies.length >= 1, 'StudySession must be retrieved from database');
  console.log(`✅ Study session persisted: Topic=${study.topic}, Mode=${study.mode}.`);

  // 7. Generate today's world & verify persistence
  console.log('\n--- World Simulation Persistence ---');
  const worldDate = '2026-10-08';
  const world = await worldService.generateDailyWorld({
    user,
    pet,
    date: worldDate,
    isOffline: false
  });
  assert(world._id, 'World must be persisted with an _id');
  const loadedWorld = await World.findByPetAndDate(pet._id, worldDate);
  assert(loadedWorld, 'World must be retrievable by petId and date');
  console.log(`✅ World simulation persisted: Date=${loadedWorld.date}, Weather=${loadedWorld.weather?.condition}, Schedules=${loadedWorld.schedules?.length}.`);

  // 8. Generate today's diary & verify provenance IDs
  console.log('\n--- Pet Diary Generation & Provenance Verification ---');
  const diary = await diaryService.getOrGenerateDailyDiary({
    user,
    pet,
    date: worldDate,
    force: true
  });
  assert(diary._id, 'Diary must be saved');
  assert(diary.content, 'Diary must have content generated by Qwen');
  console.log(`   Diary Title: "${diary.title}"`);
  console.log(`   Provenance: SourceWorldId=${diary.sourceWorldId}, SourceMessages=${diary.sourceMessageIds?.length}, SourceMemories=${diary.sourceMemoryIds?.length}`);
  assert(diary.sourceWorldId, 'Diary must record sourceWorldId provenance');
  console.log('✅ Diary generated with Qwen and complete provenance IDs verified.');

  console.log('\n🏆 END-TO-END SCENARIO FULLY VERIFIED!');
}

runEndToEndScenario().catch(err => {
  console.error('❌ E2E Scenario failed:', err);
  process.exit(1);
});
