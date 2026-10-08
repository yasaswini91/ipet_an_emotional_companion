import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

const FINETUNED_RELATIVE = process.env.QWEN_FINETUNED_MODEL
  || path.join('server', 'ml', 'models', 'iPET-Qwen2-EmotionalCompanion');

function resolveModelPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  const fromProject = path.resolve(PROJECT_ROOT, p);
  const fromServer = path.resolve(SERVER_ROOT, p);
  if (fs.existsSync(fromProject)) return fromProject;
  if (fs.existsSync(fromServer)) return fromServer;
  return fromProject;
}

const finetunedPath = resolveModelPath(FINETUNED_RELATIVE);
const finetunedExists = !!(finetunedPath && fs.existsSync(finetunedPath) && (
  fs.existsSync(path.join(finetunedPath, 'config.json'))
  || fs.existsSync(path.join(finetunedPath, 'adapter_config.json'))
  || fs.existsSync(path.join(finetunedPath, 'tokenizer.json'))
));

const useFinetuned = String(process.env.QWEN_USE_FINETUNED || 'true').toLowerCase() !== 'false';

export const companionConfig = {
  llm: {
    provider: 'qwen',
    baseModel: process.env.QWEN_BASE_MODEL || 'Qwen/Qwen2-7B-Instruct',
    finetunedModelPath: finetunedPath,
    useFinetuned: useFinetuned && finetunedExists,
    modelStatus: (useFinetuned && finetunedExists)
      ? 'FINETUNED_EMOTIONAL_COMPANION'
      : 'BASE_QWEN_NOT_FINETUNED',
    endpoint: process.env.QWEN_ENDPOINT
      || process.env.OPENAI_BASE_URL
      || process.env.OLLAMA_ENDPOINT
      || 'http://127.0.0.1:11434',
    apiKey: process.env.QWEN_API_KEY || process.env.HF_TOKEN || '',
    ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434',
    ollamaModel: process.env.QWEN_OLLAMA_MODEL || 'qwen2:7b',
    temperature: Number(process.env.QWEN_TEMPERATURE || 0.9),
    contextLength: Number(process.env.QWEN_CONTEXT_LENGTH || 2048),
    timeoutMs: Number(process.env.QWEN_TIMEOUT_MS || 120000),
    maxNewTokens: Number(process.env.QWEN_MAX_NEW_TOKENS || 512)
  },
  embedding: {
    provider: process.env.EMBEDDING_PROVIDER || 'bge-small-en-v1.5',
    model: process.env.EMBEDDING_MODEL || 'Xenova/bge-small-en-v1.5',
    dimension: Number(process.env.EMBEDDING_DIMENSION || 384),
    ollamaModel: process.env.EMBEDDING_OLLAMA_MODEL || 'bge-small'
  },
  memory: {
    confidenceThreshold: Number(process.env.MEMORY_CONFIDENCE_THRESHOLD || 0.70),
    dedupThreshold: Number(process.env.MEMORY_DEDUP_THRESHOLD || 0.90),
    retrievalK: Number(process.env.MEMORY_RETRIEVAL_K || 5),
    similarityThreshold: Number(process.env.MEMORY_SIMILARITY_THRESHOLD || 0.35),
    permanentProfileK: Number(process.env.MEMORY_PERMANENT_PROFILE_K || 3),
    longTermRetentionMonths: 3,
    shortTermRetentionMonths: 1
  },
  dialogue: {
    historySize: Number(process.env.CONVERSATION_HISTORY_SIZE || 16)
  },
  scheduler: {
    diaryCron: process.env.DIARY_CRON || '30 23 * * *',
    worldCron: process.env.WORLD_CRON || '0 3 * * *'
  },
  storage: {
    mode: process.env.MONGODB_URI ? 'mongodb_preferred' : 'json_file',
    dataDir: path.join(SERVER_ROOT, 'data')
  }
};

export function getActiveQwenModelName() {
  if (companionConfig.llm.useFinetuned) {
    return companionConfig.llm.finetunedModelPath;
  }
  return companionConfig.llm.baseModel;
}

export function getPublicModelStatus() {
  return {
    provider: 'qwen',
    baseModel: companionConfig.llm.baseModel,
    finetunedPath: companionConfig.llm.finetunedModelPath,
    finetunedExists,
    modelStatus: companionConfig.llm.modelStatus,
    temperature: companionConfig.llm.temperature,
    contextLength: companionConfig.llm.contextLength,
    endpoint: companionConfig.llm.endpoint
  };
}
