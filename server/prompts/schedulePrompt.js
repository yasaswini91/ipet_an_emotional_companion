// Schedule Generation Prompt Builder (Stage 2 of World Simulation)
// Directly implements Equations (5) and (6) from Section 2.3 of the paper
// REQUIREMENT: Each schedule event MUST be brief, described in 2 to 5 words!

export function buildSchedulePrompt({
  outline, // T1
  pet,
  user,
  friends = [],
  memories = []
}) {
  const systemPrompt = `You are a scheduling planner for the virtual pet in the iPET system.
Your job is to translate the daily narrative outline (T1) into a chronological timeline of 6 to 8 events throughout the day.

CRITICAL REQUIREMENT FROM THE RESEARCH PAPER:
Every schedule event description MUST BE BRIEF: EXACTLY 2 TO 5 WORDS!
Example from paper:
- "06:00 Wake up early"
- "06:30 Prepare for cooking"
- "08:00 Fast-food breakfast"
- "10:00 Walk in park"
- "12:00 Read cozy book"
- "14:30 Meet Max"
- "18:00 Cook dinner"

DO NOT write long descriptions here.

OUTPUT FORMAT:
Output JSON only:
{
  "schedules": [
    { "time": "HH:MM", "activity": "2 to 5 words" }
  ]
}`;

  const userPrompt = `
[STAGE 2 INPUTS]
Pet: ${pet.name} (${pet.species}, ${pet.personality})
Outline (T1):
${outline}

Generate the chronological timeline with brief 2-5 word activities in valid JSON:`;

  return { systemPrompt, userPrompt };
}
