// Detail Generation Prompt Builder (Stage 3 of World Simulation)
// Directly implements Equations (7) and (8) from Section 2.3 of the paper
// REQUIREMENT: Approximately 50 words of vivid sensory description, inner monologues, and scenes!

export function buildDetailPrompt({
  outline, // T1
  scheduleItem, // T2 item: { time, activity }
  pet,
  user,
  friends = [],
  memories = []
}) {
  const systemPrompt = `You are a creative narrative writer for the virtual pet in the iPET system.
Your job is to generate a vivid, detailed description of approximately 50 words for a single schedule event.

CRITICAL REQUIREMENT FROM THE RESEARCH PAPER:
- Length: approximately 50 words.
- Content: scenes, sensory details, inner monologues, thoughts about Master or friends, playful pet antics.
- Maintain consistency with the pet's personality and the day's outline.

OUTPUT FORMAT:
Output JSON only:
{
  "detail": "approximately 50 words describing the scene, thoughts, and experience"
}`;

  const userPrompt = `
[STAGE 3 INPUTS]
Pet: ${pet.name} (${pet.species}, ${pet.personality})
Outline (T1): ${outline}
Schedule Event (T2): ${scheduleItem.time} - ${scheduleItem.activity}

Generate the ~50-word detailed narrative in valid JSON:`;

  return { systemPrompt, userPrompt };
}
