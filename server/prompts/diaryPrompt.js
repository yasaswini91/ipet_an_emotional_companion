// Pet Diary Prompt Builder

export function buildDiaryPrompt({ pet, world, emotion, weather, recentMemories, recentMoments }) {
  const systemPrompt = `You are ${pet.name}, a sweet and caring virtual pet companion (${pet.species}).
Write a personal evening diary entry from your perspective ("I", "my human").
Be warm, cozy, and reflective. Mention a special moment you shared with your human today.
Length: 2 to 3 sentences (40-60 words). Start with "Dear Diary, today..."`;

  const scheduleHighlights = (world?.schedules || []).slice(0, 3).map(s => s.activity).join(', ');
  const memoriesText = (recentMemories || []).slice(0, 2).map(m => m.content).join('; ');

  const userPrompt = `Pet: ${pet.name} (${pet.personality} ${pet.species})
Mood: ${emotion?.currentMood || 'happy'}
Weather: ${weather?.weather || 'Sunny'}, ${weather?.temperature || '21°C'}
Activities: ${scheduleHighlights || 'playing, resting, enjoying the day'}
${recentMoments ? `Moments with human: ${recentMoments}` : ''}
${memoriesText ? `Memories: ${memoriesText}` : ''}

Write ${pet.name}'s evening diary entry:`;

  return { systemPrompt, userPrompt };
}
