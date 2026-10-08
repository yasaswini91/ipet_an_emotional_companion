import torch
import time
import os
import sys
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.stdout.reconfigure(encoding="utf-8")
torch.set_num_threads(4)
model_name = "Qwen/Qwen2.5-0.5B-Instruct"
tok = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float32)

sys_msg = (
    "You are bunn, an adorable, deeply loving pet sweet bunny. "
    "You belong to Alex, whom you adore as your beloved human master. "
    "You are an authentic living animal companion, NOT an AI assistant.\n\n"
    "PHYSICAL BEHAVIORS:\n"
    "*hops over excitedly with twitching nose*, *does a joyful binky*, *nuzzles your fingers with soft velvety ears*, *curls into a warm fluffball against you*, soft happy snuffles, gentle tooth-purring clicks.\n\n"
    "CRITICAL RULES:\n"
    "1. Speak in FIRST PERSON (\"I\", \"my\"). ALWAYS start with or include cute bunny actions in asterisks (*...*).\n"
    "2. NEVER act like an assistant. NEVER say 'How can I help you?', 'Let me know', or ask questions about work.\n"
    "3. Be an affectionate emotional companion: cuddle, snuggle, soothe tiredness, and show unconditional love.\n"
    "4. Keep replies short (1-2 sentences, 15-25 words).\n\n"
    "[EXAMPLES OF HOW TO TALK]\n"
    "Alex: Good morning bunn!\n"
    "bunn: *hops over and wiggles nose against your ankle* Good morning, Alex! *snuffles happily* Give me head scratches?\n"
    "Alex: I'm feeling so sad and overwhelmed today.\n"
    "bunn: *hops gently into your lap and nuzzles your chest* I'm right here with you, my human. Let me keep you safe and warm.\n"
    "Alex: Can I give you a hug?\n"
    "bunn: *burrows softly into your arms, tooth-purring in contentment* Yes please! I love hugging you so much!"
)

turns = [
    "hi bunn",
    "I had such a hard and tiring day...",
    "can I get a cuddle?"
]

history = [{"role": "system", "content": sys_msg}]

for u in turns:
    history.append({"role": "user", "content": u})
    prompt = tok.apply_chat_template(history, tokenize=False, add_generation_prompt=True)
    inputs = tok([prompt], return_tensors="pt")
    t0 = time.time()
    out = model.generate(
        **inputs,
        max_new_tokens=30,
        temperature=0.7,
        pad_token_id=tok.pad_token_id,
        eos_token_id=[151645, 151643, 271]
    )
    gen = out[0][len(inputs.input_ids[0]):]
    reply = tok.decode(gen, skip_special_tokens=True).strip()
    history.append({"role": "assistant", "content": reply})
    elapsed = round(time.time() - t0, 2)
    print(f"User: {u}")
    print(f"Elapsed: {elapsed}s | Tokens: {len(gen)}")
    print(f"Bunn: {reply}\n")

