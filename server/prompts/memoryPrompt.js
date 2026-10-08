// Memory Extraction Prompt Builder
// Implements Equation (2) from iPET paper: {Mi, Cati} = LLM(Is, S, P, U)
// Memory categories defined based on retention stability (iPET paper):
// 1. Permanent Memory: Enduring user traits and preferences. Retained indefinitely.
// 2. Long-term Memory: Medium-term plans or intentions, activity participation, skill acquisition. Retained for 3 months.
// 3. Short-term Memory: Transient details such as recent events, immediate tasks, current feelings. Retained for 1 month.

export function buildMemoryExtractionPrompt({ sessionDialogue, pet, user }) {
  const masterName = user?.name || user?.username || 'User';

  const systemPrompt = `You are an expert cognitive memory extraction system for an emotional AI pet companion (iPET framework).
Your task is to analyze the dialogue session between the user and the virtual pet, extract important user-related facts, and assign each extracted memory to one of three categories based on retention stability:

1. PERMANENT (Retained indefinitely):
   - Enduring user traits, preferences, identity, and favorites expected to remain true for a very long time.
   - Examples from paper:
     * "User's favorite food is pizza."
     * "User likes science-fiction novels."
     * "User's name is Yash."
     * "User is allergic to peanuts."
     * "User works as a software engineer."

2. LONG_TERM (Retained for 3 months):
   - Medium-term plans or intentions, such as activity participation or skill acquisition. Important for a longer period but not permanent.
   - Examples from paper:
     * "User is learning Python."
     * "User plans to participate in a hackathon."
     * "User is preparing for an upcoming exam."
     * "User is working on a machine learning project."

3. SHORT_TERM (Retained for 1 month):
   - Transient details such as recent events, immediate tasks, or current feelings/states.
   - Examples from paper:
     * "User has an exam tomorrow."
     * "User just went to the park."
     * "User is currently feeling tired."
     * "User had a stressful day today."

CRITICAL EXTRACTION RULES:
- Extract facts about the USER ONLY. Write in third person starting with "User ..." or "${masterName} ...".
- NEVER extract actions, gestures, thoughts, or responses performed by the pet (e.g. do NOT extract "Luna cuddled", "Pet purrs softly", "Pet is happy").
- DO NOT extract conversational greetings or pleasantries (e.g. "User said hello").

OUTPUT FORMAT:
Return ONLY valid JSON with this exact schema:
{
  "memories": [
    {
      "memory": "User ...",
      "category": "PERMANENT" | "LONG_TERM" | "SHORT_TERM"
    }
  ]
}`;

  const userPrompt = `[PET COMPANION PROFILE]
Name: ${pet.name}
Species: ${pet.species}

[USER PROFILE]
Name: ${masterName}

[DIALOGUE SESSION TO ANALYZE]
${sessionDialogue}

Extract important user-related memories and assign each to PERMANENT, LONG_TERM, or SHORT_TERM based on retention stability. Output valid JSON:`;

  return { systemPrompt, userPrompt };
}
