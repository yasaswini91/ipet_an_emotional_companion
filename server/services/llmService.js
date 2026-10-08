// Qwen-only LLM adapter. The rule-based "Qwen2 persona engine" has been removed.
// All generative calls go to server/services/qwenService.js.

export { llmService, qwenService, QwenUnavailableError } from './qwenService.js';
export function formatQwenChatML(systemPrompt, userPrompt) {
  return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n`;
}
