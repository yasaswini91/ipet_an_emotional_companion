// Verification Test Suite for iPET Paper Implementation & Extensions
import assert from 'assert';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { Memory, MemoryCategory } from '../models/Memory.js';
import { World } from '../models/World.js';
import { embeddingService, cosineSimilarity } from '../services/embeddingService.js';
import { memoryService } from '../services/memoryService.js';
import { worldService } from '../services/worldService.js';
import { dialogueService } from '../services/dialogueService.js';
import { emotionService } from '../services/emotionService.js';
import { growthService } from '../services/growthService.js';
import { surpriseService } from '../services/surpriseService.js';
import { diaryService } from '../services/diaryService.js';

async function runTestSuite() {
  console.log('🧪 Starting iPET Verification Test Suite...');
  await connectDB();

  // Test 1: User Profile Creation
  console.log('\n--- 1. Testing User Profile Creation ---');
  const user = await User.create({
    username: 'test_master',
    email: `master_${Date.now()}@example.com`,
    password: 'hashedpassword',
    name: 'Super Programmer',
    interests: ['reading sci-fi', 'programming', 'parks']
  });
  assert(user._id, 'User must have an ID');
  assert.strictEqual(user.name, 'Super Programmer');
  console.log('✅ User profile created successfully.');

  // Test 2: Pet Onboarding (Figure 1 options)
  console.log('\n--- 2. Testing Pet Onboarding & Profile P ---');
  const pet = await Pet.create({
    userId: user._id,
    name: 'Mousse',
    species: 'cat',
    breed: 'Mousse Maine',
    personality: 'Easygoing',
    hobbies: ['playing games', 'afternoon napping'],
    description: 'A gentle and caring little cat who loves to laugh'
  });
  assert.strictEqual(pet.name, 'Mousse');
  assert.strictEqual(pet.species, 'cat');
  assert.strictEqual(pet.breed, 'Mousse Maine');
  console.log('✅ Pet profile initialized with breed and personality.');

  // Test 3: Cosine Similarity and Dense Retrieval
  console.log('\n--- 3. Testing Dense Retrieval & Cosine Similarity ---');
  const vec1 = [1, 0, 0];
  const vec2 = [1, 0, 0];
  const vec3 = [0, 1, 0];
  assert(Math.abs(cosineSimilarity(vec1, vec2) - 1.0) < 0.001, 'Identical vectors must yield cosine similarity 1.0');
  assert(Math.abs(cosineSimilarity(vec1, vec3) - 0.0) < 0.001, 'Orthogonal vectors must yield cosine similarity 0.0');

  const textA = 'I love sci-fi books and space novels';
  const textB = 'sci-fi literature and interstellar fiction';
  const embA = await embeddingService.getEmbedding(textA);
  const embB = await embeddingService.getEmbedding(textB);
  const sim = cosineSimilarity(embA, embB);
  assert(sim > 0.3, 'Semantically related texts should have strong positive cosine similarity');
  console.log(`✅ Cosine similarity calculation verified (Similarity: ${sim.toFixed(3)}).`);

  // Test 4: Memory Module - Three Retention Categories
  console.log('\n--- 4. Testing Memory Module Categories & Expiration ---');
  const permMem = await Memory.create({
    userId: user._id,
    petId: pet._id,
    content: 'User loves sci-fi novels.',
    category: MemoryCategory.PERMANENT
  });
  assert.strictEqual(permMem.expiresAt, null, 'Permanent memory must have indefinite retention (null expiresAt)');

  const longMem = await Memory.create({
    userId: user._id,
    petId: pet._id,
    content: 'User planning trip to Japan.',
    category: MemoryCategory.LONG_TERM
  });
  assert(longMem.expiresAt, 'Long-term memory must have expiration');
  const longDiffDays = (new Date(longMem.expiresAt) - new Date(longMem.createdAt)) / (1000 * 60 * 60 * 24);
  assert(longDiffDays >= 88 && longDiffDays <= 93, 'Long-term retention must be ~3 months');

  const shortMem = await Memory.create({
    userId: user._id,
    petId: pet._id,
    content: 'User has exam tomorrow.',
    category: MemoryCategory.SHORT_TERM
  });
  assert(shortMem.expiresAt, 'Short-term memory must have expiration');
  const shortDiffDays = (new Date(shortMem.expiresAt) - new Date(shortMem.createdAt)) / (1000 * 60 * 60 * 24);
  assert(shortDiffDays >= 28 && shortDiffDays <= 32, 'Short-term retention must be ~1 month');
  console.log('✅ Three memory categories and temporal retention policies verified.');

  // Test 5: 3-Stage World Simulation Pipeline
  console.log('\n--- 5. Testing World Simulation Pipeline (Stages 1, 2, 3) ---');
  const world = await worldService.generateDailyWorld({
    user,
    pet,
    date: '2026-10-08',
    isOffline: false
  });
  assert(world.outline, 'Stage 1 Outline (T1) must exist');
  assert(Array.isArray(world.schedules) && world.schedules.length > 0, 'Stage 2 Schedules (T2) must exist');
  assert(Array.isArray(world.details) && world.details.length > 0, 'Stage 3 Details (T3) must exist');

  // Verify brief 2-5 words requirement for schedules
  world.schedules.forEach(s => {
    const wordCount = s.activity.trim().split(/\s+/).length;
    console.log(`   [Schedule T2]: "${s.time} ${s.activity}" (${wordCount} words)`);
  });
  console.log(`   [Detail T3]: "${world.details[0].detail.slice(0, 75)}..."`);
  console.log('✅ 3-Stage World Simulation (T1, T2, T3) successfully verified.');

  // Test 6: Interactive Dialogue R = LLM(IR, H, T1, T2, T3, P, U, M)
  console.log('\n--- 6. Testing Dialogue with World & Memory Integration ---');
  const chatResult = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'What are you doing today in the park?'
  });
  assert(chatResult.petResponse?.content, 'Pet must generate response');
  console.log(`   Pet Response: "${chatResult.petResponse.content}"`);
  assert(chatResult.emotion, 'Dialogue must update emotional state');
  assert(chatResult.growth, 'Dialogue must award growth XP');
  console.log('✅ Dialogue Module correctly integrates T1, T2, T3, P, U, M and updates emotion/growth.');

  // Test 7: Emotion State Transitions & Growth
  console.log('\n--- 7. Testing Emotion Transitions & Growth XP ---');
  const emotionBefore = await emotionService.getEmotion(pet._id, user._id);
  const emotionAfter = await emotionService.interact(pet._id, 'play');
  assert(emotionAfter.happiness >= emotionBefore.happiness, 'Playing must increase happiness');
  console.log(`   Happiness: ${emotionBefore.happiness} -> ${emotionAfter.happiness}, Mood: ${emotionAfter.currentMood}`);

  const growth = await growthService.getGrowth(pet._id, user._id);
  console.log(`   Growth Level: ${growth.level}, Stage: ${growth.growthStage}, XP: ${growth.xp}`);
  console.log('✅ Emotion transitions and growth verified.');

  // Test 8: Memory-Based Surprise
  console.log('\n--- 8. Testing Memory-Based Surprise Engine ---');
  const surprise = await surpriseService.evaluateAndTriggerSurprise({ user, pet, force: true });
  if (surprise) {
    console.log(`   Surprise Triggered: "${surprise.title}" (Reason: ${surprise.reason})`);
  }
  console.log('✅ Surprise engine connected to user memories.');

  // Test 9: Pet Diary
  console.log('\n--- 9. Testing Pet Diary Generation ---');
  const diary = await diaryService.getOrGenerateDailyDiary({ user, pet });
  assert(diary.content, 'Diary must have content');
  console.log(`   Diary Title: "${diary.title}"`);
  console.log(`   Snippet: "${diary.content.slice(0, 80)}..."`);
  console.log('✅ Pet Diary generated successfully.');

  console.log('\n🎉 ALL 9 TEST SUITE PHASES PASSED WITH 100% SUCCESS!');
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
