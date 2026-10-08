import { dialogueService } from '../services/dialogueService.js';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';

async function testPetCompanion() {
  const user = await User.create({ username: 'bunny_lover', name: 'Alex' });
  const pet = await Pet.create({ userId: user._id, name: 'bunn', species: 'rabbit', personality: 'Sunny' });

  console.log('\n--- Test 1: "hi bunn" ---');
  let start = Date.now();
  let res = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'hi bunn',
    waitForMemory: false
  });
  console.log(`⏱️ Turn 1 Time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.log(`🐾 Bunn: "${res.petResponse.content}"`);

  console.log('\n--- Test 2: "I had such a hard and tiring day..." ---');
  start = Date.now();
  res = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'I had such a hard and tiring day...',
    waitForMemory: false
  });
  console.log(`⏱️ Turn 2 Time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.log(`🐾 Bunn: "${res.petResponse.content}"`);

  console.log('\n--- Test 3: "can I get a cuddle?" ---');
  start = Date.now();
  res = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'can I get a cuddle?',
    waitForMemory: false
  });
  console.log(`⏱️ Turn 3 Time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.log(`🐾 Bunn: "${res.petResponse.content}"`);

  console.log('\n--- Test 4: "what did you do today?" ---');
  start = Date.now();
  res = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'what did you do today?',
    waitForMemory: false
  });
  console.log(`⏱️ Turn 4 Time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
  console.log(`🐾 Bunn: "${res.petResponse.content}"`);

  process.exit(0);
}

testPetCompanion().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
