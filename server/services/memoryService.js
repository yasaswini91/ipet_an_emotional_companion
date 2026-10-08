import { Memory, MemoryCategory } from '../models/Memory.js';
import { embeddingService, cosineSimilarity } from './embeddingService.js';
import { qwenService } from './qwenService.js';
import { companionConfig } from '../config/companionConfig.js';
import { buildMemoryExtractionPrompt } from '../prompts/memoryPrompt.js';

const TRIVIAL_PHRASES = [
  'hello', 'hi', 'hey', 'good morning', 'good evening', 'good night',
  'bye', 'see you', 'thanks', 'thank you', 'okay', 'ok', 'yes', 'no'
];

/**
 * Filter out pet roleplay actions or trivial pleasantries so ONLY user facts are saved.
 */
export function isPetActionOrTrivial(text, petName = '') {
  if (!text || text.trim().length < 5) return true;
  const clean = text.toLowerCase().trim();

  // Trivial pleasantries
  if (TRIVIAL_PHRASES.includes(clean)) return true;

  // Pet actions / persona roleplay (e.g., "Luna nuzzles...", "Pet purrs...")
  const petLower = (petName || '').toLowerCase().trim();
  if (petLower && clean.startsWith(petLower)) return true;
  if (/^(?:the pet|pet|companion|bunn|luna|mousse|alex's pet)\b/i.test(clean)) return true;
  if (/\b(?:nuzzles|purrs|curls up|touches terra firma|wags tail|licks|hops into your lap|cuddles gently)\b/i.test(clean)) return true;

  return false;
}

/**
 * Classify memory category strictly according to retention stability defined in iPET paper:
 * - PERMANENT: Enduring user traits and preferences (retained indefinitely)
 *   Examples: Favorite food is pizza, Likes science-fiction novels, Name is Yash
 * - LONG_TERM: Medium-term plans or intentions, activity participation, skill acquisition (retained for 3 months)
 *   Examples: Learning Python, Plans to participate in a hackathon, Preparing for an upcoming exam
 * - SHORT_TERM: Transient details such as recent events, immediate tasks, current feelings (retained for 1 month)
 *   Examples: Has an exam tomorrow, Just went to the park, Currently feeling tired
 */
export function classifyMemoryCategory(content, rawCategory = null) {
  const text = String(content || '').trim();
  const lower = text.toLowerCase();

  // 1. SHORT_TERM: Immediate tasks (tomorrow/today), recent events ("just went"), current transient feelings
  const hasImmediateTimeline = /\b(?:tomorrow|tonight|today|this morning|this afternoon|this evening|later today|in an hour)\b/i.test(lower);
  const isRecentEvent = /\b(?:just went|went to the|just got back|just arrived|just finished|just ate|just saw|yesterday|earlier today|a moment ago|right now)\b/i.test(lower);
  const isTransientState = /\b(?:currently feeling|is feeling|feeling (?:tired|exhausted|sleepy|sad|anxious|nervous|happy|stressed|down|low|overwhelmed|great)|feels (?:tired|exhausted|sleepy|sad|anxious|nervous)|is tired|had a (?:tiring|exhausting|rough|stressful|hard) day)\b/i.test(lower);

  if (hasImmediateTimeline || isRecentEvent || isTransientState) {
    return MemoryCategory.SHORT_TERM;
  }

  // 2. LONG_TERM: Skill acquisition, medium-term projects, planned activity participation
  const isSkillAcquisition = /\b(?:learning|studying|practicing|taking a course in|training in)\s+([a-zA-Z0-9#+.\s]{2,30})/i.test(lower);
  const isMediumTermPlan = /\b(?:plans to|planning to|intends to|preparing for an upcoming|working on|aims to|scheduled to participate|participating in a hackathon|preparing for an exam)\b/i.test(lower);

  if (isSkillAcquisition || isMediumTermPlan) {
    return MemoryCategory.LONG_TERM;
  }

  // 3. PERMANENT: Enduring user traits, preferences, favorites, core identity
  const isFavorite = /\b(?:favorite|favourite)\b/i.test(lower);
  const isEnduringPreference = /\b(?:likes|loves|enjoys|prefers|dislikes|hates|allergic to)\b/i.test(lower);
  const isIdentityOrTrait = /\b(?:name is|works as|is a (?:software|engineer|doctor|developer|programmer|teacher|student|nurse|designer|lawyer|scientist|manager|artist)|lives in|born in|birthday is|native language is|has a pet)\b/i.test(lower);

  if (isFavorite || isEnduringPreference || isIdentityOrTrait) {
    return MemoryCategory.PERMANENT;
  }

  // 4. If LLM provided category and it's valid, respect it if no explicit override applied
  if (rawCategory) {
    const catUpper = String(rawCategory).toUpperCase().replace(/[-\s]/g, '_');
    if (catUpper.includes('PERM')) return MemoryCategory.PERMANENT;
    if (catUpper.includes('LONG')) return MemoryCategory.LONG_TERM;
    if (catUpper.includes('SHORT')) return MemoryCategory.SHORT_TERM;
  }

  // 5. Default based on stability
  return MemoryCategory.SHORT_TERM;
}

// Fast heuristic extractor for explicit user statements directly adhering to paper definitions
function extractHeuristicMemories(sessionDialogue = '', user, pet) {
  const masterName = user?.name || user?.username || 'User';
  const extracted = [];
  const lines = sessionDialogue.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.replace(/^(User|Master|Human):\s*/i, '').trim();
    if (!line || line.length < 5) continue;
    if (new RegExp(`^${pet?.name || 'Pet'}:`, 'i').test(rawLine)) continue;

    // 1. Permanent Memory: Enduring user traits and preferences (retained indefinitely)
    // Paper Examples: "User's favorite food is pizza", "User likes science-fiction novels", "User's name is Yash"
    const favMatch = line.match(/\bmy favorite\s+([a-zA-Z\s]{2,20}?)\s+is\s+([a-zA-Z0-9\s]{2,30}?)(?:\.|\band\b|,|$)/i);
    if (favMatch) {
      extracted.push({
        memory: `User's favorite ${favMatch[1].trim()} is ${favMatch[2].trim()}`,
        category: MemoryCategory.PERMANENT
      });
    }

    const prefMatch = line.match(/\bi (?:like|love|enjoy|prefer)\s+([a-zA-Z0-9\s-]{3,35}?)(?:\.|\band\b|,|$)/i);
    if (prefMatch && !/tomorrow|today|tonight|right now|currently/.test(line.toLowerCase())) {
      const topic = prefMatch[1].trim();
      // If it's learning/studying, it's skill acquisition (LONG_TERM)
      if (!/learning|studying|practicing/.test(topic)) {
        extracted.push({
          memory: `User likes ${topic}`,
          category: MemoryCategory.PERMANENT
        });
      }
    }

    const profMatch = line.match(/\b(?:i am|i'm)\s+(?:a|an)\s+([a-zA-Z\s]{3,30}?)(?:\.|\band\b|,|$)/i);
    if (profMatch && !/tired|sad|happy|sleepy|nervous|sorry|excited|fine|okay|busy|exhausted|learning|studying/.test(profMatch[1].toLowerCase())) {
      extracted.push({
        memory: `User is a ${profMatch[1].trim()}`,
        category: MemoryCategory.PERMANENT
      });
    }

    const allergyMatch = line.match(/\b(?:i am|i'm)\s+allergic to\s+([a-zA-Z\s]{2,30}?)(?:\.|\band\b|,|$)/i);
    if (allergyMatch) {
      extracted.push({
        memory: `User is allergic to ${allergyMatch[1].trim()}`,
        category: MemoryCategory.PERMANENT
      });
    }

    // 2. Long-term Memory: Medium-term plans, intentions, skill acquisition (retained for 3 months)
    // Paper Examples: "User is learning Python", "User plans to participate in a hackathon", "User is preparing for an upcoming exam"
    const learnMatch = line.match(/\bi am (?:learning|studying|practicing|taking a course in)\s+([a-zA-Z0-9#+.\s]{2,35}?)(?:\.|\band\b|,|$)/i);
    if (learnMatch) {
      extracted.push({
        memory: `User is learning ${learnMatch[1].trim()}`,
        category: MemoryCategory.LONG_TERM
      });
    }

    const planMatch = line.match(/\bi (?:plan to|am planning to|intend to|want to participate in|am preparing for)\s+([a-zA-Z0-9\s]{3,40}?)(?:\.|\band\b|,|$)/i);
    if (planMatch && !/tomorrow|today|tonight/.test(line.toLowerCase())) {
      extracted.push({
        memory: `User plans to ${planMatch[1].trim()}`,
        category: MemoryCategory.LONG_TERM
      });
    }

    // 3. Short-term Memory: Transient details, recent events, immediate tasks, current feelings (retained for 1 month)
    // Paper Examples: "User has an exam tomorrow", "User just went to the park", "User is currently feeling tired"
    const immediateTaskMatch = line.match(/\b(?:tomorrow|tonight|today)\s+(?:i have|i got|i'm having)\s+([a-zA-Z0-9\s]{3,40}?)(?:\.|\band\b|,|$)/i);
    if (immediateTaskMatch) {
      extracted.push({
        memory: `User has ${immediateTaskMatch[1].trim()} tomorrow`,
        category: MemoryCategory.SHORT_TERM
      });
    }

    const recentEventMatch = line.match(/\bi (?:just went to|went to|just visited|visited|just got back from)\s+(?:the\s+)?([a-zA-Z0-9\s]{3,35}?)(?:\.|\band\b|,|$)/i);
    if (recentEventMatch) {
      extracted.push({
        memory: `User just went to ${recentEventMatch[1].trim()}`,
        category: MemoryCategory.SHORT_TERM
      });
    }

    const stateMatch = line.match(/\b(?:i am|i'm|i feel|i am feeling|currently feeling)\s+(?:a bit\s+|really\s+|very\s+|so\s+)?(tired|exhausted|sleepy|stressed|anxious|nervous|sad|down|low|overwhelmed|excited|happy)(?:\.|\band\b|,|$)/i);
    if (stateMatch) {
      extracted.push({
        memory: `User is currently feeling ${stateMatch[1].trim()}`,
        category: MemoryCategory.SHORT_TERM
      });
    }
  }

  return extracted;
}

export const memoryService = {
  // Stage 1: Memory Collection {Mi, Cati} = LLM(Is, S, P, U) + Fast Heuristics
  async extractAndStoreMemories({ sessionDialogue, pet, user }) {
    if (!sessionDialogue || sessionDialogue.trim().length < 5) return [];

    try {
      const candidates = [];

      // 1. Fast heuristic patterns aligned with paper
      const fastItems = extractHeuristicMemories(sessionDialogue, user, pet);
      candidates.push(...fastItems);

      // 2. Qwen LLM extraction
      try {
        const { systemPrompt, userPrompt } = buildMemoryExtractionPrompt({
          sessionDialogue,
          pet,
          user
        });

        const result = await qwenService.generateMemoryExtraction({
          systemPrompt,
          userPrompt,
          maxTokens: 150
        });

        const llmItems = result.parsed?.memories || [];
        if (Array.isArray(llmItems)) {
          candidates.push(...llmItems);
        }
      } catch (err) {
        console.warn('[MemoryService] Qwen memory extraction fallback to heuristics:', err.message);
      }

      const savedMemories = [];
      const existingMemories = await Memory.findActiveByPetId(pet._id, user._id);
      const dedupThreshold = companionConfig.memory.dedupThreshold || 0.88;

      for (const item of candidates) {
        const rawContent = (item.memory || item.content || '').trim();
        if (!rawContent || rawContent.length < 4) continue;
        if (isPetActionOrTrivial(rawContent, pet.name)) continue;

        // Classify strictly according to paper retention stability
        const category = classifyMemoryCategory(rawContent, item.category);

        // Standardize third-person wording if needed
        let formattedContent = rawContent;
        if (/^i\s+/i.test(formattedContent)) {
          formattedContent = formattedContent.replace(/^i\s+/i, 'User ');
        }

        // Semantic embedding
        const embedding = await embeddingService.getEmbedding(formattedContent);

        // Deduplication against existing active memories
        let isDuplicate = false;
        for (const existing of existingMemories) {
          if (existing.content.toLowerCase().trim() === formattedContent.toLowerCase()) {
            isDuplicate = true;
            break;
          }
          if (existing.embedding && existing.embedding.length === embedding.length) {
            const sim = cosineSimilarity(embedding, existing.embedding);
            if (sim >= dedupThreshold) {
              isDuplicate = true;
              break;
            }
          }
        }
        if (isDuplicate) continue;

        // Create memory record with retention tier
        const created = await Memory.create({
          userId: user._id,
          petId: pet._id,
          content: formattedContent,
          category,
          embedding,
          importance: category === MemoryCategory.PERMANENT ? 9.0 : (category === MemoryCategory.LONG_TERM ? 7.0 : 5.0)
        });

        savedMemories.push(created);
        existingMemories.push(created);
      }

      return savedMemories;
    } catch (err) {
      console.error('[MemoryService] Error extracting memories:', err);
      return [];
    }
  },

  // Manual Memory Creation with explicit categorization and validation
  async createCategorizedMemory({ user, pet, content, category = 'SHORT_TERM' }) {
    const cleanContent = String(content || '').trim();
    if (!cleanContent) throw new Error('Memory content cannot be empty');

    // Classify category by retention stability rules
    const normalizedCategory = classifyMemoryCategory(cleanContent, category);

    const embedding = await embeddingService.getEmbedding(cleanContent);
    return Memory.create({
      userId: user._id,
      petId: pet._id,
      content: cleanContent,
      category: normalizedCategory,
      embedding,
      importance: normalizedCategory === MemoryCategory.PERMANENT ? 9.0 : (normalizedCategory === MemoryCategory.LONG_TERM ? 7.0 : 5.0)
    });
  },

  // Stage 2: Memory Management - Temporal policy cleanup
  async cleanupExpired() {
    return Memory.deleteExpired();
  },

  // Stage 3: Memory Utilization - Dense Retrieval via Cosine Similarity
  async getRelevantMemories(query, petId, topK = companionConfig.memory.retrievalK || 5, threshold = companionConfig.memory.similarityThreshold || 0.35) {
    const activeMemories = await Memory.findActiveByPetId(petId);
    if (!activeMemories || activeMemories.length === 0) return [];

    return embeddingService.rankMemoriesByRelevance(query, activeMemories, topK, threshold);
  },

  async getAllForPet(petId) {
    return Memory.findByPetId(petId);
  },

  async deleteMemory(id) {
    return Memory.deleteById(id);
  },

  // Migration & cleanup: reclassify existing memories in store based on paper stability definitions
  async reclassifyAllExistingMemories() {
    const all = await Memory.collection.find({});
    let updatedCount = 0;
    let deletedPetActionCount = 0;

    for (const m of all) {
      if (isPetActionOrTrivial(m.content)) {
        await Memory.deleteById(m._id);
        deletedPetActionCount++;
        continue;
      }

      const correctCategory = classifyMemoryCategory(m.content, m.category);
      if (correctCategory !== m.category || !m.retentionPeriod) {
        let newExpiresAt = null;
        const createdDate = new Date(m.createdAt || new Date());
        if (correctCategory === MemoryCategory.LONG_TERM) {
          const exp = new Date(createdDate);
          exp.setMonth(exp.getMonth() + 3);
          newExpiresAt = exp.toISOString();
        } else if (correctCategory === MemoryCategory.SHORT_TERM) {
          const exp = new Date(createdDate);
          exp.setMonth(exp.getMonth() + 1);
          newExpiresAt = exp.toISOString();
        }

        await Memory.updateById(m._id, {
          category: correctCategory,
          expiresAt: newExpiresAt,
          importance: correctCategory === MemoryCategory.PERMANENT ? 9.0 : (correctCategory === MemoryCategory.LONG_TERM ? 7.0 : 5.0),
          retentionPeriod: correctCategory === MemoryCategory.PERMANENT ? 'Indefinite' : (correctCategory === MemoryCategory.LONG_TERM ? '3 Months' : '1 Month')
        });
        updatedCount++;
      }
    }

    return { updatedCount, deletedPetActionCount };
  }
};
