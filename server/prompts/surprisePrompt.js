// Surprise Prompt Builder (Memory-Driven Surprises)

export function buildSurprisePrompt({ pet, memories, weather, emotion }) {
  const systemPrompt = `You are the surprise generation engine for the iPET system.
Your mission is to craft a heartwarming, thoughtful in-world surprise for Master that directly stems from one of Master's stored memories (e.g., favorite foods, hobby interests, upcoming exams, preferences).

OUTPUT FORMAT:
Output JSON only:
{
  "hasSurprise": true,
  "memoryId": "the ID of the memory that inspired this",
  "type": "gift" | "activity" | "environment" | "message" | "decoration",
  "title": "Creative short title (e.g., Sci-Fi Reading Corner)",
  "description": "Vivid description of the surprise prepared by the pet",
  "reason": "Clear explanation of which memory inspired it"
}`;

  const memoriesList = memories.map(m => `[ID: ${m._id}] (${m.category}) ${m.content}`).join('\n');

  const userPrompt = `
Pet: ${pet.name} (${pet.personality})
Mood: ${emotion?.currentMood || 'happy'}
Weather: ${weather?.weather || 'Sunny'}

Active User Memories:
${memoriesList}

If there is a good opportunity to craft a personalized surprise based on one of these memories, return the JSON with "hasSurprise": true.
Otherwise return { "hasSurprise": false }.`;

  return { systemPrompt, userPrompt };
}
