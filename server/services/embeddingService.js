import { companionConfig } from '../config/companionConfig.js';
import { logEvent, logError } from '../utils/logger.js';

export class EmbeddingUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmbeddingUnavailableError';
    this.code = 'EMBEDDING_UNAVAILABLE';
    this.status = 503;
  }
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function l2Normalize(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

let pipelinePromise = null;
let reportedDimension = companionConfig.embedding.dimension;

async function getTransformersEmbedder() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      const extractor = await pipeline('feature-extraction', companionConfig.embedding.model);
      return extractor;
    })();
  }
  return pipelinePromise;
}

async function embedWithTransformers(text) {
  const extractor = await getTransformersEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const vec = Array.from(output.data);
  reportedDimension = vec.length;
  return vec;
}

async function embedWithOllama(text) {
  const url = `${companionConfig.llm.ollamaEndpoint.replace(/\/$/, '')}/api/embeddings`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: companionConfig.embedding.ollamaModel,
        prompt: text
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Ollama embeddings HTTP ${res.status}`);
    const data = await res.json();
    if (!data.embedding?.length) throw new Error('Empty Ollama embedding');
    reportedDimension = data.embedding.length;
    return l2Normalize(data.embedding);
  } finally {
    clearTimeout(timer);
  }
}

export const embeddingService = {
  get dimension() {
    return reportedDimension;
  },

  async embedText(text) {
    const input = String(text || '').trim();
    if (!input) {
      return new Array(reportedDimension).fill(0);
    }

    try {
      const vec = await embedWithTransformers(input);
      logEvent('embedding.success', { provider: 'transformers', dim: vec.length });
      return vec;
    } catch (err) {
      logError('embedding.transformers_failed', err);
    }

    try {
      const vec = await embedWithOllama(input);
      logEvent('embedding.success', { provider: 'ollama', dim: vec.length });
      return vec;
    } catch (err) {
      logError('embedding.ollama_failed', err);
    }

    throw new EmbeddingUnavailableError(
      `Sentence embedding model unavailable (${companionConfig.embedding.model}). Install @xenova/transformers or serve BGE via Ollama. Fake hash embeddings are not used.`
    );
  },

  async getEmbedding(text) {
    return this.embedText(text);
  },

  async embedMemory(memory) {
    return this.embedText(memory?.content || '');
  },

  async embedQuery(query) {
    return this.embedText(query);
  },

  calculateSimilarity(a, b) {
    return cosineSimilarity(a, b);
  },

  async rankMemoriesByRelevance(query, memories, topK = companionConfig.memory.retrievalK, threshold = companionConfig.memory.similarityThreshold) {
    if (!memories?.length) return [];
    const queryVec = await this.embedQuery(query);
    const scored = [];
    for (const mem of memories) {
      let memVec = mem.embedding;
      if (!memVec || memVec.length === 0 || memVec.length !== queryVec.length) {
        memVec = await this.embedMemory(mem);
      }
      const similarity = cosineSimilarity(queryVec, memVec);
      scored.push({ ...mem, similarity, similarityScore: similarity, embedding: memVec });
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.filter((m) => m.similarity >= threshold).slice(0, topK);
  }
};
