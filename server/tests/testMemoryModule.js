import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { generateToken } from '../middleware/auth.js';

async function testMemoryModule() {
  console.log('🔄 Setting up test user and pet...');
  const username = 'mem_tester_' + Date.now();
  const user = await User.create({ username, email: `${username}@test.com`, name: 'Alex' });
  const pet = await Pet.create({ userId: user._id, name: 'bunn', species: 'rabbit', personality: 'Sunny' });
  const token = generateToken(user);
  console.log(`✅ User: ${user.name}, Pet: ${pet.name} (${pet.species})`);

  // 1. Test POST /api/memories - Creating neatly categorized memories
  console.log('\n--- 1. Testing Memory Creation & Categorization (POST /api/memories) ---');
  const memoriesToCreate = [
    { content: 'Alex is a software engineer who loves tennis', category: 'PERMANENT' },
    { content: 'Alex is studying for a machine learning certification', category: 'LONG_TERM' },
    { content: 'Alex has a big project presentation tomorrow morning', category: 'SHORT_TERM' }
  ];

  for (const item of memoriesToCreate) {
    const res = await fetch('http://localhost:5000/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ petId: pet._id, content: item.content, category: item.category })
    });
    const data = await res.json();
    console.log(`✅ Created [${data.memory?.category}]: "${data.memory?.content}" (Expires: ${data.memory?.expiresAt || 'Never'})`);
  }

  // 2. Test GET /api/memories/:petId - Verify all categories retrieved
  console.log('\n--- 2. Testing Memory Retrieval (GET /api/memories/:petId) ---');
  const listRes = await fetch(`http://localhost:5000/api/memories/${pet._id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log(`Total memories in store: ${listData.memories?.length}`);
  const perms = listData.memories.filter(m => m.category === 'PERMANENT');
  const longs = listData.memories.filter(m => m.category === 'LONG_TERM');
  const shorts = listData.memories.filter(m => m.category === 'SHORT_TERM');
  console.log(`🟣 Permanent: ${perms.length}, 🔵 Long-term: ${longs.length}, 🟢 Short-term: ${shorts.length}`);

  // 3. Test Dense Retrieval Search (POST /api/memories/search)
  console.log('\n--- 3. Testing Semantic Dense Search (Cosine Sim) ---');
  const searchRes = await fetch('http://localhost:5000/api/memories/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, query: 'What is my career or coding job?' })
  });
  const searchData = await searchRes.json();
  console.log('Search Results for "What is my career or coding job?":');
  searchData.results.forEach(r => {
    console.log(` -> Sim: ${(r.similarityScore || r.similarity || 0).toFixed(3)} | [${r.category}] ${r.content}`);
  });

  // 4. Test Memory Recall in Chat: Pet remembers what Alex has tomorrow!
  console.log('\n--- 4. Testing Pet Memory Recall in Chat (POST /api/chat) ---');
  const chatStart = Date.now();
  const chatRes = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, message: 'I feel a bit anxious about what I have tomorrow...' })
  });
  const chatData = await chatRes.json();
  console.log('⏱️ Reply Time:', ((Date.now() - chatStart) / 1000).toFixed(1) + 's');
  console.log(`🐾 ${pet.name}: "${chatData.petResponse?.content}"`);

  // 5. Test Memory Extraction from New Chat (POST /api/memories/process)
  console.log('\n--- 5. Testing Autonomous Memory Extraction (POST /api/memories/process) ---');
  // First send a message with fresh user fact
  await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id, message: 'I work as a senior doctor at the city hospital.' })
  });

  const extractRes = await fetch('http://localhost:5000/api/memories/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ petId: pet._id })
  });
  const extractData = await extractRes.json();
  console.log(`Extracted ${extractData.extractedCount} new memories:`);
  extractData.memories?.forEach(m => {
    console.log(` -> [${m.category}] ${m.content}`);
  });

  process.exit(0);
}

testMemoryModule().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
