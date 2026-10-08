import { dialogueService } from '../services/dialogueService.js';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';

async function testDialogue() {
  const user = await User.create({ username: 'alex_test', name: 'Alex' });
  const pet = await Pet.create({ userId: user._id, name: 'bunn', species: 'rabbit', personality: 'Sunny' });

  console.log('\n--- Turn 1: "hi bunn" ---');
  const res1 = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'hi bunn',
    waitForMemory: false
  });
  console.log(`🐾 Bunn: "${res1.petResponse.content}"`);

  console.log('\n--- Turn 2: "I feel really tired from studying today." ---');
  const start = Date.now();
  const res2 = await dialogueService.handleUserMessage({
    user,
    pet,
    userMessage: 'I feel really tired from studying today.',
    waitForMemory: false
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`⏱️ Elapsed time: ${elapsed} seconds`);
  console.log(`🐾 Bunn: "${res2.petResponse.content}"`);

  const reply = res2.petResponse.content;
  if (reply.includes('USER MESSAGE:') || reply.includes('User:')) {
    console.error('❌ FAILED: Reply contains simulated user message!');
    process.exit(1);
  }
  console.log('✅ ALL CHECKS PASSED!');
  process.exit(0);
}

testDialogue().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
