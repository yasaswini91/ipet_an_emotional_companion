// LLM-as-a-Judge Evaluation Prompt
// Directly implements Section 3.2 of the paper:
// 4 Dimensions: Realism, Consistency, Richness, Attraction
// Score range: 1.0 to 5.0 using the "analyze-rate" methodology

export function buildEvaluationPrompt({ method, pet, worldContent, memories = [] }) {
  const systemPrompt = `You are an expert NLP evaluator acting as an LLM judge for simulated virtual pet dialogue and world generation systems.
Evaluate the generated pet world simulation across four distinct dimensions (rated 1.0 to 5.0):

(1) Realism: Evaluates logical coherence and realism. Checks for activity conflicts, schedule feasibility, and real-life plausibility with stamina constraints.
(2) Consistency: Evaluates consistency between the activities and character profile, ensuring behaviors align with predefined personality and background.
(3) Richness: Assesses the richness of the virtual itinerary, stamina variety, and sensory detail.
(4) Attraction: Evaluates the user's desire to converse about the pet's life, conversational appeal, and emotional resonance.

Evaluation Method being judged: "${method}"

OUTPUT JSON FORMAT:
{
  "analysis": "Brief step-by-step analysis following the analyze-rate approach...",
  "scores": {
    "realism": 4.5,
    "consistency": 4.8,
    "richness": 4.6,
    "attraction": 3.4
  }
}`;

  const userPrompt = `
[PET PROFILE]
Name: ${pet.name}
Species: ${pet.species}
Personality: ${pet.personality}
Hobbies: ${(pet.hobbies || []).join(', ')}

[SIMULATED WORLD CONTENT UNDER EVALUATION]
${typeof worldContent === 'string' ? worldContent : JSON.stringify(worldContent, null, 2)}

Please analyze and rate each metric on a 1.0 to 5.0 scale according to the ACL 2025 iPET paper criteria in valid JSON:`;

  return { systemPrompt, userPrompt };
}
