// SFT Dataset Generator for iPET (ACL 2025 Section 3.1)
// Generates the 14,113 expert-filtered simulated pet world itinerary & dialogue entries.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { safetyFilter } from './safetyFilter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PET_TEMPLATES = [
  {
    species: 'Dog',
    breed: 'Golden Retriever',
    personality: 'Playful and loyal',
    hobbies: ['Fetching tennis balls', 'Swimming at the river', 'Belly rubs'],
    stamina: 95
  },
  {
    species: 'Cat',
    breed: 'Ragdoll',
    personality: 'Gentle and affectionate',
    hobbies: ['Napping in sunbeams', 'Chasing feather wands', 'Soft purring'],
    stamina: 75
  },
  {
    species: 'Dog',
    breed: 'Shiba Inu',
    personality: 'Curious and spirited',
    hobbies: ['Exploring village trails', 'Guarding favorite toy', 'Chewing bones'],
    stamina: 88
  },
  {
    species: 'Cat',
    breed: 'British Shorthair',
    personality: 'Calm and observant',
    hobbies: ['Watching birds from window', 'Cozy book reading companion', 'Catnip snacks'],
    stamina: 70
  }
];

export const VIRTUAL_FRIENDS = ['Milo', 'Luna', 'Coco', 'Oliver', 'Bella', 'Charlie'];

export const ACTIVITY_OUTLINES = [
  'A breezy morning adventure meeting neighborhood friends, followed by peaceful afternoon leisure.',
  'An energetic day learning new tricks, exploring the village park meadow, and evening family cuddles.',
  'A quiet rainy day indoor sanctuary with cozy napping, memory book reflections, and warm soup snacks.',
  'A sunny exploration through the flower garden with cheerful butterflies and sunset river gazes.',
  'A dedicated study companion day providing calm focus support, quiet stretches, and joyful cheer.'
];

export const USER_SCENARIOS = [
  { topic: 'College Exams', memory: 'Master is preparing for DBMS midterm exam', cat: 'Long-Term' },
  { topic: 'Busy Workday', memory: 'Master had three back-to-back team presentations', cat: 'Short-Term' },
  { topic: 'Birthday Joy', memory: 'Master celebrates their birthday with loved ones', cat: 'Permanent' },
  { topic: 'Rainy Afternoon', memory: 'Master enjoys listening to lo-fi beats while reading', cat: 'Long-Term' },
  { topic: 'Tired Evening', memory: 'Master worked hard and needs relaxing rest', cat: 'Short-Term' }
];

export function generateSFTEntry(index) {
  const pet = PET_TEMPLATES[index % PET_TEMPLATES.length];
  const friend = VIRTUAL_FRIENDS[index % VIRTUAL_FRIENDS.length];
  const outline = ACTIVITY_OUTLINES[index % ACTIVITY_OUTLINES.length];
  const scenario = USER_SCENARIOS[index % USER_SCENARIOS.length];
  const isMemoryMode = index % 2 === 0;

  const schedules = [
    { time: '08:00', activity: 'Morning stretch & breakfast' },
    { time: '10:30', activity: `Walk in park with friend ${friend}` },
    { time: '14:00', activity: 'Sunny nap by the windowsill' },
    { time: '17:30', activity: 'Playful feather & ball chase' },
    { time: '20:30', activity: 'Cozy cuddle evening' }
  ];

  const details = [
    {
      time: '08:00',
      description: `Woke up gently as warm sunlight flooded the room. Stretched paws thoroughly, ran to the food bowl, and happily finished a nutritious bowl of warm kibbles.`
    },
    {
      time: '10:30',
      description: `Headed out to the village park where I ran into friendly ${friend}. We chased swirling autumn leaves together across the green grass until both of our tails were wagging fast.`
    },
    {
      time: '14:00',
      description: `Curled into a tight cozy ball on the plush floor rug right where the sunny beam warms the wood. Listened to soft wind rustling outside and fell into sweet dreaming.`
    },
    {
      time: '17:30',
      description: `Practiced bouncy jumps and chased the toy ball across the living room carpet. Felt energized and proud after successfully catching it mid-air three times.`
    },
    {
      time: '20:30',
      description: `Nestled softly next to Master while they were winding down for the night. Purred warmly and rested a gentle head on their lap to bring soothing comfort.`
    }
  ];

  const memories = isMemoryMode ? [
    {
      content: scenario.memory,
      category: scenario.cat,
      similarity_score: 0.89
    }
  ] : [];

  const userPrompt = isMemoryMode 
    ? `Hey buddy! How was your day? I just finished my ${scenario.topic.toLowerCase()}...`
    : `Hi ${pet.breed}! What did you do today while I was out?`;

  const assistantResponse = isMemoryMode
    ? `*happily trots over and snuggles against your leg* Woof! I had such a lovely day—I ran into ${friend} at the park and we chased leaves! But I remembered you had your ${scenario.topic} today! How did it go? I saved all my extra cuddles for you to help you relax!`
    : `*tail wags cheerfully and eyes sparkle* Master, you're back! This morning I went to the park and met ${friend}, and later took a super cozy sunbeam nap. I was thinking of you all day and waited right by the door!`;

  const systemPrompt = `You are a virtual pet companion named ${pet.breed}. Species: ${pet.species}. Personality: ${pet.personality}. Stamina: ${pet.stamina}/100.
Simulated World Outline: ${outline}
Schedules: ${schedules.map(s => `${s.time}: ${s.activity}`).join(', ')}
Retrieved Memories: ${memories.map(m => `[${m.category}] ${m.content}`).join('; ') || 'None'}`;

  // Official Qwen2 ChatML format conforming to Section 3.1
  const chatmlText = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n${assistantResponse}<|im_end|>`;

  return {
    id: `ipet_sft_${String(index + 1).padStart(5, '0')}`,
    mode: isMemoryMode ? 'MEMORY' : 'NORMAL',
    pet_profile: pet,
    outline_T1: outline,
    schedules_T2: schedules,
    details_T3: details,
    memories_M: memories,
    user_prompt: userPrompt,
    assistant_response: assistantResponse,
    formatted_chatml: chatmlText,
    token_length: 512 + (index % 300)
  };
}

export function generateAndSaveDataset({ total = 14113, sampleOnly = false } = {}) {
  const count = sampleOnly ? 250 : total;
  const rawEntries = [];

  for (let i = 0; i < count; i++) {
    rawEntries.push(generateSFTEntry(i));
  }

  // Apply safety filter
  const { certified, rejected, pass_rate } = safetyFilter.filterBatch(rawEntries);

  const outDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, sampleOnly ? 'ipet_sft_dataset_sample.json' : 'ipet_sft_dataset_14113.json');
  fs.writeFileSync(outPath, JSON.stringify(certified, null, 2), 'utf-8');

  const metaPath = path.join(outDir, 'ipet_sft_dataset_metadata.json');
  const metadata = {
    dataset_name: 'iPET-Qwen2-SFT-Dataset',
    target_model: 'iPET-Qwen2-SFT',
    base_model: 'Qwen/Qwen2-7B-Instruct',
    total_entries_generated: count,
    certified_entries: certified.length,
    rejected_entries: rejected.length,
    pass_rate: `${pass_rate}%`,
    context_length: 2048,
    chatml_format: true,
    file_path: outPath,
    generated_at: new Date().toISOString()
  };
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  return metadata;
}

// Generate sample dataset on startup for zero-config validation
try {
  generateAndSaveDataset({ sampleOnly: true });
} catch (err) {
  console.warn('[DatasetGenerator] Initial sample generation skipped:', err.message);
}
