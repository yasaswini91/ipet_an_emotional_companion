// Outline Generation Prompt Builder (Stage 1 of World Simulation)
// Directly implements Figure 3 and Equations (3) and (4) from paper

export function buildOutlinePrompt({
  mode = 'NORMAL', // 'NORMAL' or 'MEMORY'
  pet,
  user,
  friends = [],
  memories = [],
  weather
}) {
  const systemPrompt = `You are a planning expert designing the virtual pet's daily life outline for the iPET system.

[World Rules]
1. Pets have independent personalities and their own daily schedules.
2. The pet behaves consistently with its personality, background, and species.
3. The pet can interact with virtual friends during the day.
4. The pet's daily itinerary must be realistic, logically coherent, and constrained by physical stamina.
5. In Memory Mode, the pet's day should thoughtfully incorporate user memories and shared interests.`;

  const friendsFormatted = friends.map((f, i) =>
    `Friend ${i + 1}: ${f.name}\nRelation: ${f.relation}\nPersonality: ${f.personality}\nHobbies: ${(f.hobbies || []).join(', ')}`
  ).join('\n\n') || 'Friend 1: Max\nRelation: Good Friend\nHobbies: Running, Swimming';

  const memorySection = mode === 'MEMORY' && memories.length > 0
    ? `\n[Memory M]\n${memories.map(m => `- ${m.content}`).join('\n')}`
    : '';

  const weatherSection = weather
    ? `\n[Weather & Season]\nSeason: ${weather.season}, Weather: ${weather.weather}, Temperature: ${weather.temperature}`
    : '';

  const userPrompt = `
Prompt Template
Instruction & World rule I
You are a planning expert.
[World Rules]
1. Pets have independent personalities.
2. Pets live realistic, coherent daily lives with balanced rest and activity.

Pet profile P
Name: ${pet.name}
Species: ${pet.species}
Breed: ${pet.breed}
Personality: ${pet.personality}
Hobbies: ${(pet.hobbies || []).join(', ')}

User profile U
Master Name: ${user.name || 'Super Programmer'}
Interests: ${(user.interests || []).join(', ')}

Friends' profile F
${friendsFormatted}
${memorySection}
${weatherSection}

Task:
Generate a cohesive narrative Outline (T1) describing what ${pet.name} plans to do today.
Focus on key milestones of the day (morning breakfast/activities, afternoon adventures/friend meeting, relaxing evening).
Keep the outline rich, character-consistent, and 100-150 words.`;

  return { systemPrompt, userPrompt };
}
