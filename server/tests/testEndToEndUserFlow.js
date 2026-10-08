import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { generateToken } from '../middleware/auth.js';

async function testFullUserFlow() {
  console.log('🔄 Creating test user and pet...');
  const username = 'testuser_' + Date.now();
  const user = await User.create({ username, email: `${username}@test.com`, name: 'Alex' });
  const pet = await Pet.create({ userId: user._id, name: 'bunn', species: 'rabbit', personality: 'Sunny' });
  const token = generateToken(user);
  console.log('✅ User & Pet ready:', user.name, '&', pet.name, `(${pet.species})`);

  // 1. Test Diary Generation (POST /api/diary/generate)
  console.log('\n--- 1. Testing Generate Today\'s Diary (POST /api/diary/generate) ---');
  const dStart = Date.now();
  const diaryRes = await fetch('http://localhost:5000/api/diary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, force: true })
  });
  const diaryData = await diaryRes.json();
  console.log('Diary Generation Status:', diaryRes.status);
  console.log('Diary Entry Title:', diaryData.entry?.title);
  console.log('Diary Entry Snippet:', diaryData.entry?.content?.slice(0, 150) + '...');
  console.log('⏱️ Diary Time:', ((Date.now() - dStart) / 1000).toFixed(1) + 's');

  // 2. Test Pet Companion Chat: 'hi bunn! what did you do today?'
  console.log('\n--- 2. Testing Companion Chat: "hi bunn! what did you do today?" ---');
  const cStart = Date.now();
  const chatRes = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, message: 'hi bunn! what did you do today?' })
  });
  const chatData = await chatRes.json();
  console.log('Chat Status:', chatRes.status);
  console.log('⏱️ Chat Reply Time:', ((Date.now() - cStart) / 1000).toFixed(1) + 's');
  console.log('🐾 ' + pet.name + ' replied:', chatData.petResponse?.content || chatData.reply?.content || JSON.stringify(chatData));

  // 3. Test Emotional Relevance Chat: 'I had such a hard and tiring day at work...'
  console.log('\n--- 3. Testing Emotional Empathy Chat: "I had such a hard and tiring day at work..." ---');
  const eStart = Date.now();
  const empRes = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, message: 'I had such a hard and tiring day at work...' })
  });
  const empData = await empRes.json();
  console.log('Chat Status:', empRes.status);
  console.log('⏱️ Chat Reply Time:', ((Date.now() - eStart) / 1000).toFixed(1) + 's');
  console.log('🐾 ' + pet.name + ' replied:', empData.petResponse?.content || empData.reply?.content || JSON.stringify(empData));

  process.exit(0);
}

testFullUserFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
