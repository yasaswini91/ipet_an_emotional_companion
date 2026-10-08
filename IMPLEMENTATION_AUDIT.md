# IMPLEMENTATION_AUDIT.md — iPET Emotional Companion
**Full Repository Audit — October 2026**
**Scope:** EVERY file in `server/` and `client/src/`, all services, models, routes, prompts, ML pipeline, tests, config, and data files.

---

## Current Architecture

```
React SPA (Vite dev :5173)  --proxy /api-->  Express (:5000)
                                                    |
                               +--------------------+
                               v                    v
                         routes/*.js           jobs/scheduler.js
                               |                    |
                         services/*.js        cron (03:00 & */6h)
                               |
                         models/*.js --> FileCollection (JSON files in server/data/)
                                         [MongoDB optional via MONGODB_URI]
```

**Storage:** Custom `FileCollection` class in `server/config/db.js` — reads/writes flat JSON files per collection. Mongoose imported but only used if `MONGODB_URI` is set; otherwise completely ignored. The `mongoose` package is a dead dependency unless MongoDB is explicitly configured.

**LLM:** `server/services/qwenService.js` — supports HuggingFace Inference API, OpenAI-compatible endpoint, and Ollama. **No rule-based fallback.** Throws `QwenUnavailableError` if all backends fail.

**Embeddings:** `server/services/embeddingService.js` — `@xenova/transformers` (BAAI/bge-small-en-v1.5) primary; Ollama fallback. **No fake/hash embeddings.**

**Auth:** JWT (30-day tokens). `middleware/auth.js`. JWT_SECRET has a **hardcoded insecure default** (`ipet_super_secret_jwt_key_2025`).

**Training:** Python scripts in `server/ml/`. Dataset generated synthetically by cycling 4 pet templates x 5 outlines x 5 user scenarios. No actual training is executed during server runtime.

---

## Chat Audit

### Full Request Flow

```
ChatWindow.jsx
  -> api.sendMessage(petId, message, modeOverride)
  -> POST /api/chat  [authMiddleware]
  -> chatRoutes.js: Pet.findById(petId)  <- NO ownership check [PROBLEM 1]
  -> dialogueService.handleUserMessage({ user, pet, userMessage, modeOverride })
    -> worldService.getTodayWorld()
    -> memoryService.extractAndStoreMemories() [before reply - DUPLICATE PROBLEM 2]
    -> memoryService.getRelevantMemories() + getAllForPet()  [up to 50 - PROBLEM 13]
    -> Message.findByPetId(pet._id, 16) [history]
    -> PetEmotion.getOrCreate(), PetGrowth.getOrCreate()
    -> Message.create() [user message saved]
    -> buildDialoguePrompt()
    -> ethicalGuardService.inspectInteraction()
    -> llmService.callLLM() -> qwenService.generateRaw()
    -> ethicalGuardService.adaptResponseIfDependent()
    -> Message.create() [pet response saved]
    -> PetEmotion.applyDeltas(+5h, +4a, -6l, -3s)  [HARDCODED - PROBLEM 4]
    -> PetGrowth.addXP(3, 'social')
    -> memoryService.extractAndStoreMemories() [after reply - second extraction]
  <- returns { userMessage, petResponse, emotion, growth, ethicalSafeguard, extractedMemories, worldContext }
```

### Problems

**PROBLEM 1:** No pet ownership check in chatRoutes.js (POST)
- **FILE:** `server/routes/chatRoutes.js` line 18
- **FUNCTION:** `router.post('/')`
- **CURRENT BEHAVIOR:** `Pet.findById(petId)` called without checking `pet.userId === req.user._id`.
- **WHY IT IS WRONG:** User A can send messages to User B's pet and pollute their dialogue history and memories.
- **REQUIRED FIX:** Add `if (String(pet.userId) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });`
- **TEST:** As user A, POST /api/chat with petId belonging to user B. Should receive 403.

**PROBLEM 2:** Memory extraction runs twice per turn
- **FILE:** `server/services/dialogueService.js` lines 17-26 and 118-131
- **FUNCTION:** `handleUserMessage()`
- **CURRENT BEHAVIOR:** `memoryService.extractAndStoreMemories()` called once before LLM (with just the user message) and again after (with the full session). The pre-reply extraction on a single sentence is noise.
- **WHY IT IS WRONG:** Creates duplicate LLM calls, noisy short-turn memories (e.g. "User said hello"), and increases latency.
- **REQUIRED FIX:** Remove the first extraction call (lines 17-26). Only run extraction post-reply on the full session text.
- **TEST:** Send one chat message. Verify only one batch of extracted memories is written.

**PROBLEM 3:** GET /api/chat/:petId has no ownership check
- **FILE:** `server/routes/chatRoutes.js` lines 37-46
- **FUNCTION:** `router.get('/:petId')`
- **CURRENT BEHAVIOR:** Anyone authenticated can read any pet's message history by guessing a petId.
- **REQUIRED FIX:** Fetch pet, verify `pet.userId === req.user._id` before returning messages.
- **TEST:** Fetch messages for another user's pet; should receive 403.

**PROBLEM 4:** Hardcoded emotion deltas on every chat message
- **FILE:** `server/services/dialogueService.js` lines 107-112
- **FUNCTION:** `handleUserMessage()`
- **CURRENT BEHAVIOR:** Every chat turn adds exactly +5 happiness, +4 affection, -6 loneliness, -3 stress regardless of conversation content.
- **WHY IT IS WRONG:** Emotional response is not grounded in what was said. `userEmotionService` is never called during chat despite existing.
- **REQUIRED FIX:** Call `userEmotionService.analyze(userMessage)` and pass the detected emotion to `petEmotionService.applyUserEmotionEffect()` instead of fixed deltas.
- **TEST:** Send an angry message; pet stress should increase. Send a happy message; happiness should increase.

---

## Qwen / LLM Audit

| FILE | FUNCTION | MODEL | PURPOSE | FALLBACK | PROBLEM |
|------|----------|-------|---------|----------|---------|
| `qwenService.js` | `generateRaw` | Qwen2-7B-Instruct (Ollama/HF/OpenAI-compat) | All dialogue and structured generation | Throws `QwenUnavailableError` | None - correct by design |
| `qwenService.js` | `generateUserEmotion` | Qwen2-7B-Instruct | Classify user emotion | Returns `neutral` on error | Result is NEVER used in dialogue flow |
| `embeddingService.js` | `embedText` | BAAI/bge-small-en-v1.5 via @xenova/transformers | Semantic embeddings | Ollama bge-small | Throws `EmbeddingUnavailableError` if both fail |
| `evaluationRoutes.js` | `computeDynamicRubricScore` | None | Evaluation scoring fallback | This IS the fallback | Uses `Math.random()` - fake scores |
| `evaluationRoutes.js` | `/train-sft` | None | SFT training simulation | N/A | Completely fabricated response |

**PROBLEM 5:** Evaluation scores are fake (Math.random())
- **FILE:** `server/routes/evaluationRoutes.js` lines 28-60
- **FUNCTION:** `computeDynamicRubricScore()`
- **CURRENT BEHAVIOR:** When LLM judge call fails (which it almost always does), `Math.random()` generates evaluation scores. The scores change every call.
- **WHY IT IS WRONG:** The evaluation panel presents these as LLM-as-Judge scores from the paper. They are random numbers.
- **REQUIRED FIX:** Replace `Math.random()` with fixed paper-reported baseline values from Table 1. These values are already available in the frontend `paperReportedTable1` array.
- **TEST:** Run evaluation for "Basic Information" three times. If scores differ each time, the fallback is still random.

**PROBLEM 6:** Training button is completely fabricated
- **FILE:** `server/routes/evaluationRoutes.js` lines 204-231
- **FUNCTION:** `router.post('/train-sft')`
- **CURRENT BEHAVIOR:** Returns hardcoded JSON with fake training logs and fake loss values. No actual training occurs.
- **WHY IT IS WRONG:** The frontend shows "Training Completed Successfully!" which misleads the user.
- **REQUIRED FIX:** Either invoke the training script via `child_process.exec`, or return a clear disclaimer that training must be run on a GPU cluster via `run_train.sh`.
- **TEST:** Press "Train SFT"; check if `server/ml/models/iPET-Qwen2-SFT/` exists after. It won't.

**PROBLEM 7:** `isJudgeEvaluation` flag is ignored by qwenService
- **FILE:** `server/routes/evaluationRoutes.js` line 129
- **CURRENT BEHAVIOR:** `callLLM()` called with `isJudgeEvaluation: true` but `qwenService.js` ignores this flag completely.
- **WHY IT IS WRONG:** The paper (Section 3.2) specifies GPT-4o as the judge evaluator. The flag is supposed to route to a different model.
- **REQUIRED FIX:** Implement GPT-4o routing when `isJudgeEvaluation: true` and `OPENAI_API_KEY` is set. Otherwise remove the dead flag.

---

## Training Pipeline Audit

1. **Base model:** `Qwen/Qwen2-7B-Instruct` — correct per paper Section 3.1.
2. **Is it actually Qwen?** Yes in the Python files.
3. **Dataset generation:** Programmatic cycling of 4 pet templates x 5 outlines x 5 user scenarios via modulo indexing.
4. **Dataset size:** JS generator creates 250 samples (`sampleOnly: true`). Python script creates 14,113 if run manually.
5. **Diversity:** CRITICAL PROBLEM — only ~120 unique combinations. At index 120 entries repeat exactly.
6. **Is it synthetic?** Yes — fully programmatic, no LLM generation, no human authoring.
7. **LoRA/QLoRA:** `use_lora=False` by default. Full fine-tuning. Correct per paper claim.
8. **Label masking:** CRITICAL PROBLEM — `tokenized["labels"] = tokenized["input_ids"].copy()` means the ENTIRE ChatML sequence (system + user + assistant) is used as labels. System and user tokens are NOT masked.
9. **Chat template:** Qwen2 ChatML format. Correct.
10. **Context length:** 2048 tokens. Matches paper Section 3.1.
11. **Learning rate:** 5e-6 with cosine decay, 0.1 warmup. Correct.
12. **Checkpoint path (training output):** `./models/iPET-Qwen2-SFT/` (relative to `server/ml/`)
13. **Checkpoint path (backend lookup):** `companionConfig.js` looks for `server/ml/models/iPET-Qwen2-EmotionalCompanion/` — DIFFERENT NAME.
14. **Backend using trained checkpoint?** No — path name mismatch means even if training completed, the backend reports `finetunedExists = false`.

**PROBLEM 8:** Training output path mismatch
- **FILES:** `server/ml/train_sft.py` line 76, `server/config/companionConfig.js` line 11
- **CURRENT BEHAVIOR:** Training saves to `./models/iPET-Qwen2-SFT`. Config looks for `server/ml/models/iPET-Qwen2-EmotionalCompanion`.
- **WHY IT IS WRONG:** Even if training ran to completion, the backend would report `finetunedExists = false` and use the base Qwen model.
- **REQUIRED FIX:** Align both to the same path, e.g. `server/ml/models/iPET-Qwen2-SFT`.
- **TEST:** Run training; verify `companionConfig.js:finetunedExists` becomes `true` and `modelStatus` becomes `'FINETUNED_EMOTIONAL_COMPANION'`.

**PROBLEM 9:** Dataset has near-zero diversity
- **FILE:** `server/ml/datasetGenerator.js` lines 61-136
- **CURRENT BEHAVIOR:** 4 pets x 5 outlines x 6 friends x 5 scenarios = 120 distinct entries. At index 120 generation repeats. For 14,113 entries there are ~117 repetitions of each unique example.
- **WHY IT IS WRONG:** The model would massively overfit to these 120 examples. The paper claims 14,113 "expertly simulated" diverse entries.
- **REQUIRED FIX:** Use an LLM to generate diverse dialogues at dataset creation time, or significantly expand template arrays with hundreds of diverse variations.
- **TEST:** Compare entries [0] and [120] in the generated JSON. They will be identical.

**PROBLEM 10:** SFT trainer does not mask system/user tokens
- **FILE:** `server/ml/train_sft.py` line 133
- **FUNCTION:** `preprocess_function()`
- **CURRENT BEHAVIOR:** `tokenized["labels"] = tokenized["input_ids"].copy()` — all tokens are learned targets.
- **WHY IT IS WRONG:** Standard instruction fine-tuning masks system/user tokens (sets them to -100) so only assistant tokens compute loss. Training on system prompts teaches the model to predict its own instructions.
- **REQUIRED FIX:** After tokenization, locate the `<|im_start|>assistant` token position and set all labels before it to -100. Use `trl.SFTTrainer` which handles this automatically.
- **TEST:** Print sample labels array; positions corresponding to system/user tokens should be -100, not actual token IDs.

---

## Memory Audit

**FLOW:** `memoryService.extractAndStoreMemories()` -> Qwen (JSON) -> dedup check -> `embeddingService.getEmbedding()` -> `Memory.create()`

**Retrieval:** `Memory.findActiveByPetId()` -> `embeddingService.rankMemoriesByRelevance()` (cosine similarity)

**PROBLEM 11:** Memory deduplication is string-equality only
- **FILE:** `server/services/memoryService.js` lines 44-48
- **FUNCTION:** `extractAndStoreMemories()`
- **CURRENT BEHAVIOR:** Dedup checks `m.content.toLowerCase().trim() === cleanContent.toLowerCase()` — only exact string matches.
- **WHY IT IS WRONG:** "User loves reading sci-fi novels" and "Master enjoys reading science fiction" are semantically identical but both get stored.
- **REQUIRED FIX:** Use cosine similarity on the embedding to detect semantic duplicates above `companionConfig.memory.dedupThreshold` (0.90). The config field exists but is unused.
- **TEST:** Extract a memory. Extract a paraphrased version. Only one should be stored.

**PROBLEM 12:** `Memory.findActiveByPetId()` has no userId filter
- **FILE:** `server/models/Memory.js` lines 52-56
- **FUNCTION:** `findActiveByPetId()`
- **CURRENT BEHAVIOR:** `this.collection.find({ petId })` — no `userId` filter.
- **WHY IT IS WRONG:** Low risk given pet is user-scoped, but provides no defense-in-depth ownership enforcement at the model layer.
- **REQUIRED FIX:** Add `userId` to queries: `this.collection.find({ petId, userId })`.

**PROBLEM 13:** Up to 50 memories dumped into every dialogue prompt
- **FILE:** `server/services/dialogueService.js` line 46
- **CURRENT BEHAVIOR:** `relevantMemories = Array.from(memoryMap.values()).slice(0, 50)` — up to 50 memories added to context.
- **WHY IT IS WRONG:** At ~20 tokens per memory, 50 memories = ~1000 tokens consumed before any conversation. At 2048 context length, only 1048 tokens remain for the actual dialogue.
- **REQUIRED FIX:** Cap at `companionConfig.memory.retrievalK` (5 from config). Include PERMANENT memories plus top-K by cosine similarity.
- **TEST:** Create 50+ memories; generate a dialogue; verify prompt token count is under context limit.

**PROBLEM 14:** Diary uses `memories.slice(0,3)` not date-filtered memories
- **FILE:** `server/services/diaryService.js` line 25
- **FUNCTION:** `getOrGenerateDailyDiary()`
- **CURRENT BEHAVIOR:** All active memories retrieved, then `memories.slice(0, 3)` takes first 3 in file insertion order.
- **WHY IT IS WRONG:** The diary for today might reference a 3-month-old memory instead of today's events.
- **REQUIRED FIX:** Use date-filtered memories for diary generation (memories created or updated today).
- **TEST:** Create memory A yesterday, memory B today. Generate today's diary. Verify A does not appear (unless PERMANENT).

---

## Emotion Audit

**Pet Emotion model:** stores happiness, energy, affection, curiosity, stress, loneliness (0-100 each). `deriveMood()` maps to: anxious, lonely, tired, excited, curious, relaxed, happy, thoughtful. `applyDeltas()` clamps each dimension to 0-100 and limits per-step change to plus/minus 15.

**User Emotion:** `userEmotionService.analyze()` uses Qwen to classify into 9 emotion categories with valence/arousal. The service exists and works correctly.

**PROBLEM 15:** User emotion detection result is NEVER applied to pet emotion in chat
- **FILE:** `server/services/dialogueService.js`
- **FUNCTION:** `handleUserMessage()`
- **CURRENT BEHAVIOR:** `userEmotionService` is never imported or called in `dialogueService.js`. Fixed deltas (+5h, +4a, -6l, -3s) applied every turn regardless of what the user said.
- **WHY IT IS WRONG:** The pet should react empathetically to the user's emotional state. This is a core paper feature.
- **REQUIRED FIX:** Import `userEmotionService`, call `analyze(userMessage)`, then call `petEmotionService.applyUserEmotionEffect(pet._id, result, pet.personality)`.
- **TEST:** Send "I'm really sad today". Pet's affection and loneliness deltas should reflect sadness effect from `USER_EMOTION_EFFECTS.sad`.

**PROBLEM 16:** Time-based emotion decay is never called
- **FILE:** `server/services/petEmotionService.js` lines 83-96
- **FUNCTION:** `applyTimeDecay()`
- **CURRENT BEHAVIOR:** `applyTimeDecay()` exists but is never called from the scheduler or any route.
- **WHY IT IS WRONG:** Without decay, a pet left alone for days still shows full happiness. The loneliness mechanic is completely broken.
- **REQUIRED FIX:** Call `petEmotionService.applyTimeDecay(pet._id)` from the scheduler nightly job for all pets.
- **TEST:** Leave pet uninteracted, trigger decay manually. Verify loneliness increases and happiness decreases.

---

## Pet State Audit

| Model | Created | Updated | Ownership Check |
|-------|---------|---------|-----------------|
| Pet | `POST /pets` (owned by req.user) | `PUT /pets/:id` — no ownership check | Create: YES. Read: NO. Update: NO. |
| PetEmotion | `getOrCreate` on pet creation | Every interaction | Via petId (implicit) |
| PetGrowth | `getOrCreate` on pet creation | addXP on activities | Via petId (implicit) |

**PROBLEM 17:** `PUT /api/pets/:id` and `PUT /api/pets/:id/customization` have no ownership check
- **FILE:** `server/routes/petRoutes.js` lines 77-103
- **CURRENT BEHAVIOR:** Any authenticated user can update any pet's name, personality, or customization.
- **REQUIRED FIX:** Fetch pet, verify `String(pet.userId) === String(req.user._id)`.
- **TEST:** As user B, send PUT /api/pets/[user-A-pet-id]. Should return 403.

**PROBLEM 18:** `GET /api/pets/:id` has no ownership check
- **FILE:** `server/routes/petRoutes.js` lines 61-73
- **CURRENT BEHAVIOR:** Any authenticated user can retrieve full pet data (emotion, growth, friends) for any pet ID.
- **REQUIRED FIX:** Add ownership check after `Pet.findById`.

---

## Diary Audit

**FLOW:** `DiaryPanel.jsx` -> `api.getDiaryHistory(petId)` -> `GET /api/diary/:petId` -> `diaryService.getDiaryHistory(petId)` -> `DiaryEntry.findByPetId(petId)`

**PROBLEM 19:** Diary generation has a hardcoded fallback text
- **FILE:** `server/services/diaryService.js` lines 35-37
- **FUNCTION:** `getOrGenerateDailyDiary()`
- **CURRENT BEHAVIOR:** If Qwen unavailable, returns static hardcoded "Today was a truly special day!" sentence.
- **WHY IT IS WRONG:** The fake diary contains no information about the actual day and doesn't reflect the pet's world, schedule, or memories.
- **REQUIRED FIX:** Construct a template-based diary from available world/schedule data when Qwen is unavailable.
- **TEST:** Disable Qwen (set wrong endpoint), trigger diary. Verify the fallback incorporates today's schedule activities.

**PROBLEM 20:** Diary route has no ownership check
- **FILE:** `server/routes/diaryRoutes.js` lines 8-15
- **CURRENT BEHAVIOR:** Any authenticated user can read any pet's diary.
- **REQUIRED FIX:** Add pet ownership check after fetching the pet.

---

## World Audit

**FLOW:** 3-stage: `buildOutlinePrompt()` -> Qwen (text) -> `buildSchedulePrompt()` -> Qwen (JSON) -> `buildDetailPrompt()` per item -> Qwen (JSON) -> `World.create()`

**PROBLEM 21:** Weather is re-randomized on each request — not deterministic on regeneration
- **FILE:** `server/services/worldService.js` lines 11-27
- **FUNCTION:** `getCurrentEnvironment()`
- **CURRENT BEHAVIOR:** `Math.random()` selects weather on every call. World generation is stable once per day, but regeneration via `POST /world/generate` picks different weather.
- **REQUIRED FIX:** Derive weather from a deterministic seed (e.g., hash of `petId + date`) so regeneration gives the same weather.

**PROBLEM 22:** World routes have no ownership checks
- **FILE:** `server/routes/worldRoutes.js`
- **CURRENT BEHAVIOR:** Any user can get any pet's world simulation by petId.
- **REQUIRED FIX:** Add ownership check after `Pet.findById` on all world routes.

**PROBLEM 23:** `POST /world/generate` does not actually regenerate if world exists for date
- **FILE:** `server/services/worldService.js` lines 34-37
- **FUNCTION:** `generateDailyWorld()`
- **CURRENT BEHAVIOR:** Returns cached world if it already exists for the date. The endpoint comment says "Force generate or regenerate" but it does not regenerate.
- **REQUIRED FIX:** Add a `force` parameter that deletes the existing record before regenerating when explicitly requested.

---

## Weather Audit

Weather is simulated (not from a real weather API). Season is derived from current month. Weather option is randomly selected from 4 options.

**STATUS:** Legitimately simulated — the pet lives in a virtual world. Intentional and correct per paper Section 2.3.

---

## Friends Audit

Virtual friends seeded in `Friend.seedDefaultFriends()` with 3 hardcoded entries (Max the golden retriever, Zhuangzhuang the tabby cat, Pippin the bunny). These are used in world simulation for realistic social interactions.

**STATUS:** Hardcoded friends are **legitimate** — they form the static virtual friend graph F referenced in the paper. Intentional design, not fake data.

---

## Surprise Audit

**FLOW:** `surpriseService.evaluateAndTriggerSurprise()` -> checks existing unviewed surprises -> gets memories -> gets world/emotion -> calls Qwen (JSON) -> conditionally `Surprise.create()`

**PROBLEM 24:** Surprise service always creates a surprise when Qwen fails
- **FILE:** `server/services/surpriseService.js` lines 41-51
- **FUNCTION:** `evaluateAndTriggerSurprise()`
- **CURRENT BEHAVIOR:** If Qwen fails, a surprise is always created using `memories[0]` as context.
- **WHY IT IS WRONG:** When Qwen is unavailable, every call creates a generic gift surprise regardless of whether one is warranted. This floods the surprise table.
- **REQUIRED FIX:** Default to no surprise when Qwen fails. Only create if `force: true` is passed (manual trigger).
- **TEST:** Disable Qwen; trigger surprise 5 times with force=false. Should create 0 surprises.

**PROBLEM 25:** Surprise route has no ownership check
- **FILE:** `server/routes/surpriseRoutes.js` lines 8-15
- **CURRENT BEHAVIOR:** Any user can get any pet's surprises.
- **REQUIRED FIX:** Add ownership check after fetching the pet.

---

## Growth Audit

Growth uses a simple XP/level/stage system. Skills tracked per category (curiosity, cooking, social, knowledge). Trait unlocks at levels 5, 10, 20.

**PROBLEM 26:** `handleAwardXP()` in App.jsx calls `api.interactEmotion(petId, 'play')` for all XP awards
- **FILE:** `client/src/App.jsx` lines 251-265
- **FUNCTION:** `handleAwardXP()`
- **CURRENT BEHAVIOR:** Game and study completion both call emotion interact with `'play'`, awarding generic play XP. No differentiation between study XP and game XP.
- **REQUIRED FIX:** Pass activity type to `handleAwardXP`; use appropriate `growthService.recordActivity(type)` — `'study'` for study sessions, `'play'` for games.

---

## Games Audit

`MiniGames.jsx` contains 6 fully client-side games: TicTacToe, WordGuess, Scramble, Vocab, Emotion Recognition, Adventure Story. Games are entirely frontend-only — results not persisted to the database.

**PROBLEM 27:** All game results are frontend-only — not persisted, pet doesn't remember
- **FILE:** `client/src/components/MiniGames.jsx`
- **CURRENT BEHAVIOR:** Game results call `onAwardXP()` (a generic `play` emotion update). Game history, scores, and wins are not saved.
- **WHY IT IS WRONG:** Refreshing loses all game progress. The pet doesn't "remember" playing together, so games never feed into memories or diaries.
- **REQUIRED FIX:** After game completion, send a memory request describing the game result ("User won at TicTacToe today"). This makes games feed into memory and diary systems.
- **TEST:** Win a game; refresh page; check if any memory was created about the game.

**PROBLEM 28:** TicTacToe AI is pure random despite claiming to "calculate strategy"
- **FILE:** `client/src/components/MiniGames.jsx` line 93
- **CURRENT BEHAVIOR:** `emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)]` — random move.
- **STATUS:** Minor UX issue. Pet says "Let me calculate my counter-strategy..." then makes a random move.
- **OPTIONAL FIX:** Implement minimax algorithm for a smarter AI.

---

## Study Assistant Audit

**PROBLEM 29:** Study assistant Quick Action buttons use `alert()` — completely non-functional
- **FILE:** `client/src/components/StudyAssistant.jsx` lines 155, 197
- **CURRENT BEHAVIOR:** "Generate Notes", "Quiz Me", "Explain Concept", "Track Progress" all call `alert()`. "Open" resource link also calls `alert()`.
- **WHY IT IS WRONG:** These are fake buttons that do nothing useful. The user is misled into thinking these features work.
- **REQUIRED FIX:** Either implement these (route through Qwen for study assistance) or disable them with a "Coming Soon" indicator.
- **TEST:** Click "Generate Notes" — should not use `alert()`.

**PROBLEM 30:** Study session completion uses `alert()` instead of in-app notification
- **FILE:** `client/src/components/StudyAssistant.jsx` line 30
- **CURRENT BEHAVIOR:** `alert('Study session complete! ...')` on timer completion.
- **REQUIRED FIX:** Replace with an in-app notification/toast component.

---

## Roadmap Audit

**PROBLEM 31:** Roadmap tasks are hardcoded frontend state — not persisted
- **FILE:** `client/src/components/RoadmapTasks.jsx` lines 6-13
- **CURRENT BEHAVIOR:** Tasks are static JavaScript objects. `toggleTask()` updates React state only. Refreshing the page resets all tasks.
- **WHY IT IS WRONG:** The roadmap is supposed to track the user's real journey. Hardcoded "Drink water" and "Study DBMS" tasks belong to no real user.
- **REQUIRED FIX:** Add a roadmap/tasks API endpoint. Persist tasks to the database. Load tasks on mount.
- **TEST:** Check a task; refresh page; task should remain checked.

**PROBLEM 32:** Roadmap streak is hardcoded to "7 Days"
- **FILE:** `client/src/components/RoadmapTasks.jsx` line 111
- **CURRENT BEHAVIOR:** Static hardcoded "7 Days" value displayed as the user's streak.
- **REQUIRED FIX:** Track streak in the database based on daily task completion.

---

## Customization Audit

**FLOW:** `PetCustomizationPanel.jsx` -> `api.updateCustomization(petId, body)` -> `PUT /api/pets/:id/customization` -> `Pet.updateById()`

**STATUS:** Customization is properly connected end-to-end and persisted correctly.

**PROBLEM 33:** No ownership check on `PUT /api/pets/:id/customization` (same as Problem 17 above)

---

## Voice Audit

**PROBLEM 34:** Voice transcription (STT) is completely faked
- **FILE:** `server/services/voiceService.js` lines 16-21
- **FUNCTION:** `transcribeAudio()`
- **CURRENT BEHAVIOR:** Even if `OPENAI_API_KEY` is set, the function only logs "Transcribing via external Whisper service..." and always returns the hardcoded string "Hello my little pet companion, how was your day in the park?"
- **WHY IT IS WRONG:** The voice button never transcribes actual audio. It always returns the same canned sentence.
- **REQUIRED FIX:** Implement actual Whisper API call using the OpenAI SDK, or leverage the browser Web Speech API (already available in `ChatWindow.jsx` via `SpeechRecognition` object).
- **TEST:** Record "What did you eat today?" via voice. Transcribed text should reflect what was said.

**PROBLEM 35:** TTS is metadata-only — no actual audio synthesis
- **FILE:** `server/services/voiceService.js` lines 24-34
- **FUNCTION:** `synthesizeSpeech()`
- **CURRENT BEHAVIOR:** Returns `{ text, voicePitch, voiceRate, supported: true }` — just metadata. No audio generated.
- **STATUS:** The frontend uses the browser Web Speech API (`SpeechSynthesis`) for actual TTS, so this is somewhat intentional. The backend endpoint is vestigial.
- **REQUIRED FIX:** Either remove the endpoint and do TTS entirely client-side, or implement actual server-side TTS.

---

## Security Audit

**PROBLEM 36:** JWT secret has a hardcoded insecure default
- **FILE:** `server/middleware/auth.js` line 4
- **CURRENT BEHAVIOR:** `const JWT_SECRET = process.env.JWT_SECRET || 'ipet_super_secret_jwt_key_2025';`
- **WHY IT IS WRONG:** If `JWT_SECRET` env var is not set, all tokens are signed with a publicly known secret. Anyone who knows this string can forge valid authentication tokens.
- **REQUIRED FIX:** Throw an error at startup if `JWT_SECRET` is not set: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable must be set');`
- **TEST:** Start server without `JWT_SECRET` env var; server should refuse to start.

**PROBLEM 37:** CORS configured with `app.use(cors())` — allows ALL origins
- **FILE:** `server/server.js` line 24
- **CURRENT BEHAVIOR:** `cors()` with no options allows any origin to make requests.
- **WHY IT IS WRONG:** In production, any website can make authenticated requests to the API.
- **REQUIRED FIX:** Configure `cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' })`.

**PROBLEM 38:** No rate limiting on authentication endpoints
- **FILE:** `server/routes/authRoutes.js`
- **CURRENT BEHAVIOR:** No rate limiting on `/register` or `/login`.
- **REQUIRED FIX:** Add `express-rate-limit` middleware to prevent brute force attacks.

**PROBLEM 39:** Memory delete endpoint has no ownership check
- **FILE:** `server/routes/memoryRoutes.js` lines 59-67
- **FUNCTION:** `router.delete('/:id')`
- **CURRENT BEHAVIOR:** Any authenticated user can delete any memory by ID.
- **REQUIRED FIX:** Use `assertOwnedMemory(req.user._id, req.params.id)` from `ownership.js` (the function already exists and is unused in routes).
- **TEST:** As user B, delete a memory belonging to user A. Should get 403.

---

## Database Audit

**Storage:** `FileCollection` in `server/config/db.js` — synchronous `fs.readFileSync`/`fs.writeFileSync` for every read/write operation.

**PROBLEM 40:** `FileCollection.find()` with `$gte`/`$lte` uses string comparison
- **FILE:** `server/config/db.js` lines 52-55
- **STATUS:** Since all dates are stored as ISO strings (`new Date().toISOString()`), string comparison works correctly for lexicographic date ordering. Low risk — acceptable for current implementation.

**PROBLEM 41:** `FileCollection` is not atomic — concurrent writes can corrupt JSON files
- **FILE:** `server/config/db.js` lines 36-38
- **CURRENT BEHAVIOR:** Read-modify-write pattern without locking. If two requests hit simultaneously (e.g., scheduler at 03:00 + simultaneous user chat), one write could overwrite the other.
- **REQUIRED FIX:** Use a write queue or migrate to SQLite (better-sqlite3) for zero-config persistent storage with ACID guarantees.

**PROBLEM 42:** Evaluation stats compare memory categories with wrong case
- **FILE:** `server/routes/evaluationRoutes.js` lines 160-162
- **CURRENT BEHAVIOR:** Filters by `m.category === 'Permanent'` / `'Long-Term'` / `'Short-Term'` (title case).
- **WHY IT IS WRONG:** Memories are stored with `category: 'PERMANENT'` / `'LONG_TERM'` / `'SHORT_TERM'` (all caps, underscores). Stats will always show 0 for each category.
- **REQUIRED FIX:** Change comparison strings to `'PERMANENT'`, `'LONG_TERM'`, `'SHORT_TERM'`.
- **TEST:** Create memories of each type; fetch `/api/evaluation/stats/:petId`; verify counts are non-zero.

---

## Evaluation Audit

(See Problems 5, 6, 7, 42 above for primary evaluation issues)

**A/B Test data:** The A/B test data in `abTestService.js` is pre-initialized with data matching Figure 5 of the paper. `recordTurn()` modestly adjusts `daily_turns` values. This is a demonstration of the paper's results, not a real ongoing A/B test with actual users.

**STATUS:** Clearly labeled as a research demonstration. Acceptable for a case study implementation.

---

## Scheduler Audit

**FLOW:** `initScheduledJobs()` registers cron at 03:00 (T+1 world + diary + surprises) and every 6 hours (memory cleanup).

**PROBLEM 43:** Scheduler generates world for ALL pets — intentional cross-user operation
- **FILE:** `server/jobs/scheduler.js` lines 12-26
- **STATUS:** `Pet.collection.find({})` retrieves ALL pets across all users. This is intentional (background job serves all users). Functionally correct.

**PROBLEM 44:** Emotion time decay is not called by scheduler
- **FILE:** `server/jobs/scheduler.js`
- **CURRENT BEHAVIOR:** Scheduler runs world generation, diary, surprises, and memory cleanup. `petEmotionService.applyTimeDecay()` is never called anywhere.
- **REQUIRED FIX:** Add `petEmotionService.applyTimeDecay(pet._id)` to the nightly scheduler loop (inside the `for (const pet of allPets)` loop at line 13).

---

## Frontend/Backend Integration Audit

| Feature | API Exists | Backend Works | Persisted | Refreshable |
|---------|-----------|---------------|-----------|-------------|
| Auth (login/register) | YES | YES | YES | YES |
| Pet creation | YES | YES | YES | YES |
| Pet customization | YES | YES | YES | YES |
| Chat | YES | YES (needs Qwen) | YES | YES |
| Memory view | YES | YES | YES | YES |
| Memory search | YES | YES (needs embeddings) | N/A | N/A |
| World (Daily World) | YES | YES (needs Qwen) | YES | YES |
| Diary | YES | YES (needs Qwen) | YES | YES |
| Emotion interaction | YES | YES | YES | YES |
| Growth | YES | YES | YES | YES |
| Surprises | YES | YES (needs Qwen) | YES | YES |
| Voice STT | YES (route exists) | NO - FAKED | N/A | N/A |
| Voice TTS | YES (route exists) | PARTIAL - metadata only | N/A | N/A |
| Evaluation | YES | PARTIAL - random fallback | N/A | N/A |
| SFT Training | YES (route exists) | NO - FAKED | N/A | N/A |
| Roadmap | NO API | NO - not persisted | NO | NO |
| Study buttons | NO API | NO - alert() only | NO | NO |
| Game results | PARTIAL (via emotion) | PARTIAL | NO | NO |
| A/B test | YES | PARTIAL - pre-seeded | YES (file) | YES |
| Qwen model status | YES | YES | N/A | N/A |

---

## Fake/Mock/Demo Functionality Inventory

| Location | Type | Content | Verdict |
|----------|------|---------|---------|
| `voiceService.js:transcribeAudio()` | FAKE | Returns canned sentence always | Must fix |
| `evaluationRoutes.js:computeDynamicRubricScore()` | FAKE | Math.random() scores | Must fix |
| `evaluationRoutes.js:/train-sft` | FAKE | Hardcoded training logs | Must fix |
| `diaryService.js` LLM catch block | FALLBACK | Hardcoded diary sentence | Acceptable with improvement |
| `worldService.js` schedule/detail catch blocks | FALLBACK | Template sentences | Acceptable |
| `surpriseService.js` LLM catch block | FALLBACK | Always creates gift surprise | Needs adjustment |
| `StudyAssistant.jsx` Quick Actions | FAKE | alert() calls | Must fix |
| `StudyAssistant.jsx` study complete | DEMO | alert() | Must fix |
| `StudyAssistant.jsx` resources | HARDCODED | 4 static DBMS cards | Acceptable |
| `RoadmapTasks.jsx` tasks | HARDCODED | Static task list | Must fix (no persistence) |
| `RoadmapTasks.jsx` streak | HARDCODED | "7 Days" string | Must fix |
| `abTestService.js` initial data | PRE-SEEDED | Paper Figure 5 curves | Acceptable for demo |
| `datasetGenerator.js` sampleOnly=true | DEMO | 250 auto-generated entries on startup | Acceptable |
| `MiniGames.jsx` TicTacToe AI | RANDOM | Math.random() moves | Acceptable / minor |

---

## Hard-coded Logic Inventory

| Location | Value | Classification |
|----------|-------|----------------|
| `dialogueService.js:107-112` | +5h, +4a, -6l, -3s per chat turn | Bug - should be dynamic |
| `auth.js:4` | `ipet_super_secret_jwt_key_2025` | Security bug - must be env var |
| `worldService.js:weatherOptions` | 4 weather options | Legitimate simulation |
| `Friend.seedDefaultFriends()` | Max, Zhuangzhuang, Pippin | Legitimate virtual friends |
| `StudyAssistant.jsx:recommendedCards` | 4 DBMS resources | Demo content |
| `StudyAssistant.jsx:topic` default | 'DBMS' | Demo default |
| `RoadmapTasks.jsx:tasks` | 6 hardcoded tasks | Bug - no persistence |
| `RoadmapTasks.jsx:streak` | '7 Days' | Bug - not tracked |
| `evaluationRoutes.js:trainingLog` | Fake loss/checkpoint values | Fake - must fix |
| `INITIAL_7DAY_CURVES` in abTestService | Paper Figure 5 data | Legitimate demo data |
| `voiceService.js:transcribeAudio` | Canned sentence | Fake - must fix |

---

## Complete Bug List

1. **Memory category case mismatch** in stats — `'Permanent'` vs stored `'PERMANENT'` — `evaluationRoutes.js:160`
2. **Duplicate memory extraction** per chat turn — `dialogueService.js` (lines 17-26 and 118-131)
3. **50-memory context overflow** in dialogue prompt — `dialogueService.js:46`
4. **STT always returns canned text** — `voiceService.js:transcribeAudio`
5. **Evaluation scores are random** — `evaluationRoutes.js:computeDynamicRubricScore`
6. **Training output path mismatch** — `train_sft.py` saves to `iPET-Qwen2-SFT`, config looks for `iPET-Qwen2-EmotionalCompanion`
7. **SFT label masking missing** — `train_sft.py:133` (system/user tokens not masked with -100)
8. **Dataset has ~706x repetition** — `datasetGenerator.js` (~120 unique entries for 14,113 total)
9. **User emotion never applied to pet** — `dialogueService.js` (userEmotionService imported but never called)
10. **Time decay never called** — `petEmotionService.js:applyTimeDecay` exists but is never invoked
11. **Surprise always fires on Qwen failure** — `surpriseService.js:41-51`
12. **9 missing ownership checks** across routes (chat POST, chat GET, pet GET, pet PUT x2, memory DELETE, world routes, diary routes, surprise GET)
13. **Alert() calls in study assistant** — `StudyAssistant.jsx:155,197,30`
14. **Roadmap not persisted** — `RoadmapTasks.jsx` (React state only)
15. **JWT secret insecure default** — `auth.js:4`

---

## Architectural Problems

1. **No real-time streaming:** No WebSocket/SSE for streaming LLM responses. Chat UI shows loading spinner until full response is ready, which may take 10-60 seconds.
2. **FileCollection race conditions:** Concurrent writes are not atomic. Read-modify-write without locking.
3. **`@xenova/transformers` not in server package.json:** Loaded dynamically via `import('@xenova/transformers')` but missing from `server/package.json` dependencies. Must be installed manually.
4. **`mongoose` listed as dependency but unused in JSON file mode:** Dead dependency weight.
5. **No `.env` file or `.env.example`:** Users have no guidance on what environment variables to set (`JWT_SECRET`, `OLLAMA_BASE_URL`, `HF_API_KEY`, `OPENAI_API_KEY`, `MONGODB_URI`, etc.)
6. **Vite proxy assumption:** Client uses `/api` base URL; requires Vite dev server proxy config (`vite.config.js`) to reach the Express backend. No documentation on this.

---

## Missing Functionality

1. **Roadmap/Tasks API** — No backend. All data is ephemeral React state.
2. **Study assistant AI features** — "Generate Notes", "Quiz Me", "Explain Concept" have no implementation whatsoever.
3. **Game result persistence** — Wins, scores, and game history are not stored or referenced.
4. **User emotion feedback loop** — `userEmotionService.analyze()` exists but its result is never connected to pet emotion updates during dialogue.
5. **Emotion time decay integration** — `applyTimeDecay()` exists but is never invoked from any caller.
6. **Real STT** — Voice transcription is faked; actual Whisper API integration is missing.
7. **Semantic memory deduplication** — `dedupThreshold` config field exists (0.90) but cosine-based dedup is not implemented.
8. **Streak tracking** — No backend tracking of user daily activity streaks.
9. **Notification/toast system** — Frontend uses `alert()` in multiple places instead of in-app toast notifications.
10. **Loading states for diary/world/surprise** — If Qwen takes 60 seconds, the UI hangs with no intermediate feedback.

---

## Recommended Fixes — Priority Order

### Priority 1 — Security (Fix Before Any Production Use)

| # | File | Fix |
|---|------|-----|
| 1 | `middleware/auth.js:4` | Require `JWT_SECRET` env var; throw at startup if missing |
| 2 | `server.js:24` | Restrict CORS to `ALLOWED_ORIGIN` env var |
| 3 | `routes/chatRoutes.js:18` | Add pet ownership check on POST /chat |
| 4 | `routes/chatRoutes.js:37` | Add pet ownership check on GET /chat/:petId |
| 5 | `routes/petRoutes.js:77,94` | Add pet ownership checks on PUT /pets/:id and PUT /pets/:id/customization |
| 6 | `routes/petRoutes.js:61` | Add pet ownership check on GET /pets/:id |
| 7 | `routes/memoryRoutes.js:60` | Use `assertOwnedMemory()` on DELETE /memories/:id |
| 8 | `routes/worldRoutes.js` | Add ownership checks on GET /world/:petId/* routes |
| 9 | `routes/diaryRoutes.js` | Add ownership checks on GET /diary/:petId routes |
| 10 | `routes/surpriseRoutes.js:8` | Add ownership check on GET /surprises/:petId |

### Priority 2 — Core Correctness

| # | File | Fix |
|---|------|-----|
| 11 | `dialogueService.js` | Remove first memory extraction; add `userEmotionService.analyze()` call |
| 12 | `dialogueService.js:107-112` | Replace fixed deltas with `petEmotionService.applyUserEmotionEffect()` |
| 13 | `dialogueService.js:46` | Cap context memories at `companionConfig.memory.retrievalK` (5) |
| 14 | `routes/evaluationRoutes.js:160` | Fix category case to `'PERMANENT'`, `'LONG_TERM'`, `'SHORT_TERM'` |
| 15 | `services/diaryService.js:25` | Use date-filtered memories for diary generation |
| 16 | `jobs/scheduler.js` | Add `petEmotionService.applyTimeDecay()` to nightly job |
| 17 | `services/memoryService.js:44` | Add semantic dedup using embedding cosine similarity |

### Priority 3 — Fake Functionality Replacement

| # | File | Fix |
|---|------|-----|
| 18 | `services/voiceService.js` | Implement Whisper API or remove STT backend route entirely |
| 19 | `routes/evaluationRoutes.js:204` | Replace fake training with real invocation or clear disclaimer |
| 20 | `routes/evaluationRoutes.js:28` | Replace `Math.random()` with fixed paper Table 1 values |
| 21 | `components/StudyAssistant.jsx` | Replace `alert()` with Qwen-powered study features or "Coming Soon" UI |
| 22 | `components/RoadmapTasks.jsx` | Add roadmap API; persist tasks to database |
| 23 | `surpriseService.js:41` | Fix fallback: only create surprise on Qwen failure if `force: true` |

### Priority 4 — Training Pipeline

| # | File | Fix |
|---|------|-----|
| 24 | `ml/train_sft.py:76` and `config/companionConfig.js:11` | Align checkpoint path names |
| 25 | `ml/train_sft.py:133` | Implement SFT label masking (set system/user token labels to -100) |
| 26 | `ml/datasetGenerator.js` | Increase template diversity to eliminate near-total repetition |

### Priority 5 — Infrastructure

| # | Fix |
|---|-----|
| 27 | Add `@xenova/transformers` to `server/package.json` dependencies |
| 28 | Create `.env.example` documenting all env vars (JWT_SECRET, OLLAMA_BASE_URL, HF_API_KEY, etc.) |
| 29 | Add `express-rate-limit` on `/api/auth/login` and `/api/auth/register` |
| 30 | Replace all `alert()` calls with in-app toast notifications |

---

## LLM Model Call Summary

| File | Function | Model | Purpose | Fallback |
|------|----------|-------|---------|---------|
| `dialogueService.js:88` | `handleUserMessage` | Qwen (chat) | Generate pet response | `QwenUnavailableError` thrown |
| `dialogueService.js:18` | `handleUserMessage` | Qwen (JSON) | Pre-reply memory extract | Silently skipped |
| `dialogueService.js:124` | `handleUserMessage` | Qwen (JSON) | Post-reply memory extract | Silently skipped |
| `worldService.js:65` | `generateDailyWorld` | Qwen (text) | T1 outline | Template fallback string |
| `worldService.js:86` | `generateDailyWorld` | Qwen (JSON) | T2 schedules | Hardcoded schedule array |
| `worldService.js:130` | `generateDailyWorld` | Qwen (JSON) | T3 details | Hardcoded detail string |
| `diaryService.js:30` | `getOrGenerateDailyDiary` | Qwen (text) | Diary generation | Hardcoded diary sentence |
| `surpriseService.js:33` | `evaluateAndTriggerSurprise` | Qwen (JSON) | Surprise evaluation | Always creates gift surprise |
| `userEmotionService.js:31` | `analyze` | Qwen (JSON) | User emotion classification | Returns `neutral` |
| `evaluationRoutes.js:124` | `/evaluation/run` | Qwen (JSON) | LLM-as-judge evaluation | `Math.random()` scores |

---

*End of IMPLEMENTATION_AUDIT.md*
*Status: Initial audit complete. 44 problems documented across 15 feature areas.*
*Fixes to be applied in next phase.*
