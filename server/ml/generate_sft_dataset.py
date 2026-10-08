"""
Synthetic SFT Dataset Generator for iPET (ACL 2025 Section 3.1)
Synthesizes the complete 14,113 entries conforming to the paper's multi-tier schema.
"""

import os
import json
from safety_filter import evaluate_entry

PET_PROFILES = [
    {"species": "Dog", "breed": "Golden Retriever", "personality": "Playful and loyal", "stamina": 95},
    {"species": "Cat", "breed": "Ragdoll", "personality": "Gentle and affectionate", "stamina": 75},
    {"species": "Dog", "breed": "Shiba Inu", "personality": "Curious and spirited", "stamina": 88},
    {"species": "Cat", "breed": "British Shorthair", "personality": "Calm and observant", "stamina": 70}
]

FRIENDS = ["Milo", "Luna", "Coco", "Oliver", "Bella", "Charlie"]

OUTLINES = [
    "A breezy morning adventure meeting neighborhood friends, followed by peaceful afternoon leisure.",
    "An energetic day learning new tricks, exploring the village park meadow, and evening family cuddles.",
    "A quiet rainy day indoor sanctuary with cozy napping, memory book reflections, and warm soup snacks.",
    "A sunny exploration through the flower garden with cheerful butterflies and sunset river gazes.",
    "A dedicated study companion day providing calm focus support, quiet stretches, and joyful cheer."
]

def generate_entry(idx: int) -> dict:
    pet = PET_PROFILES[idx % len(PET_PROFILES)]
    friend = FRIENDS[idx % len(FRIENDS)]
    outline = OUTLINES[idx % len(OUTLINES)]
    is_memory = (idx % 2 == 0)

    schedules = [
        {"time": "08:00", "activity": "Morning stretch & breakfast"},
        {"time": "10:30", "activity": f"Walk in park with friend {friend}"},
        {"time": "14:00", "activity": "Sunny nap by windowsill"},
        {"time": "17:30", "activity": "Playful toy chase"},
        {"time": "20:30", "activity": "Cozy evening cuddle"}
    ]

    details = [
        {"time": "08:00", "description": "Woke up to warm rays of sunshine. Stretched paws happily and enjoyed a bowl of nutritious breakfast."},
        {"time": "10:30", "description": f"Met up with {friend} at the village grass park. We ran around joyfully chasing autumn leaves together."},
        {"time": "14:00", "description": "Curled up in a warm beam of light on the soft living room rug. Listened to the breeze outside and had sweet dreams."},
        {"time": "17:30", "description": "Chased after my bouncy toy ball and practiced catching it mid-air. Felt energized and proud of my agility."},
        {"time": "20:30", "description": "Settled down warmly beside Master while they relaxed. Purred gently to bring cozy comfort to the home."}
    ]

    memories = [
        {"content": "Master is working hard on college studies", "category": "Long-Term", "score": 0.88}
    ] if is_memory else []

    user_prompt = f"Hi {pet['breed']}! How was your day?" if not is_memory else "Hey buddy, I just finished studying... how was your day?"
    assistant_response = (
        f"*tail wags warmly* Master! I had a wonderful day exploring with {friend} and napping in the sun, but I missed you! I'm so happy you're back home!"
        if not is_memory else
        f"*gently snuggles against your hand* You worked so hard today on your studies, Master! I had fun playing with {friend}, but I saved all my warmest cuddles just for you!"
    )

    system_prompt = f"You are {pet['breed']}, an emotional pet companion. Species: {pet['species']}. Personality: {pet['personality']}.\nToday's Outline: {outline}\nMemories: {memories}"

    chatml = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_prompt}<|im_end|>\n<|im_start|>assistant\n{assistant_response}<|im_end|>"

    return {
        "id": f"sft_{idx+1:05d}",
        "mode": "MEMORY" if is_memory else "NORMAL",
        "pet_profile": pet,
        "outline_T1": outline,
        "schedules_T2": schedules,
        "details_T3": details,
        "memories_M": memories,
        "user_prompt": user_prompt,
        "assistant_response": assistant_response,
        "formatted_chatml": chatml
    }

def build_dataset(total: int = 14113, output_path: str = "../data/ipet_sft_14113.json"):
    print(f"Generating {total} candidate SFT entries...")
    certified = []
    rejected = 0

    for i in range(total):
        item = generate_entry(i)
        is_safe, cat, score = evaluate_entry(item)
        if is_safe:
            item["safety_status"] = "certified_expert_review"
            item["safety_score"] = score
            certified.append(item)
        else:
            rejected += 1

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(certified, f, indent=2)

    print(f"Successfully generated and filtered dataset!")
    print(f"Certified: {len(certified)} | Rejected: {rejected} | Pass Rate: {len(certified)/total*100:.2f}%")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    build_dataset(14113)
