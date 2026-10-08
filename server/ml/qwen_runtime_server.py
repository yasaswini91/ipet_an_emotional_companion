"""
Local Qwen Runtime Server (Ollama and OpenAI Compatible)
Serves actual Qwen LLM for iPET emotional companion dialogue and world simulation.
Supports Qwen base model and fine-tuned emotional companion adapter.
"""

import os
import sys
import json
import argparse
import threading
import torch
from flask import Flask, request, jsonify

app = Flask(__name__)
GEN_LOCK = threading.Lock()


import sys
sys.stdout.reconfigure(encoding="utf-8")

# Model state
MODEL = None
TOKENIZER = None
MODEL_NAME = os.environ.get("QWEN_BASE_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

if DEVICE == "cpu":
    cpu_threads = min(4, os.cpu_count() or 4)
    torch.set_num_threads(cpu_threads)
    torch.set_num_interop_threads(cpu_threads)
    print(f"[QWEN] Optimized PyTorch CPU threads set to {cpu_threads}")

def load_qwen_model(model_path=None):
    global MODEL, TOKENIZER, MODEL_NAME
    from transformers import AutoModelForCausalLM, AutoTokenizer
    try:
        from peft import PeftModel
    except ImportError:
        PeftModel = None

    target_model = model_path or MODEL_NAME
    print(f"[QWEN] Loading Qwen model: {target_model} on {DEVICE}...")

    TOKENIZER = AutoTokenizer.from_pretrained(target_model, use_fast=True)
    if TOKENIZER.pad_token is None:
        TOKENIZER.pad_token = TOKENIZER.eos_token

    dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else (
        torch.float16 if torch.cuda.is_available() else torch.float32
    )

    base_model = AutoModelForCausalLM.from_pretrained(
        target_model,
        torch_dtype=dtype,
        device_map="auto" if torch.cuda.is_available() else None,
        low_cpu_mem_usage=True
    )

    # Check if fine-tuned adapter exists
    finetuned_path = os.environ.get(
        "QWEN_FINETUNED_MODEL",
        os.path.join(os.path.dirname(__file__), "models", "iPET-Qwen2-EmotionalCompanion")
    )
    if os.path.exists(finetuned_path) and os.path.exists(os.path.join(finetuned_path, "adapter_config.json")):
        if PeftModel is not None:
            print(f"[QWEN] Loading fine-tuned adapter from: {finetuned_path}")
            MODEL = PeftModel.from_pretrained(base_model, finetuned_path)
        else:
            print("[QWEN] Fine-tuned adapter found, but peft is not installed. Using base model.")
            MODEL = base_model
    else:
        MODEL = base_model

    MODEL.eval()
    if not torch.cuda.is_available():
        MODEL.to("cpu")
    print("[QWEN] Qwen runtime ready!")

from transformers import StoppingCriteria, StoppingCriteriaList

class StopOnKeywordsCriteria(StoppingCriteria):
    def __init__(self, tokenizer, stop_words, prompt_length):
        super().__init__()
        self.tokenizer = tokenizer
        self.stop_words = stop_words
        self.prompt_length = prompt_length

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor, **kwargs) -> bool:
        generated = input_ids[0][self.prompt_length:]
        if len(generated) < 3:
            return False
        recent_text = self.tokenizer.decode(generated[-10:], skip_special_tokens=False)
        for stop in self.stop_words:
            if stop in recent_text:
                return True
        return False

def generate_completion(messages, temperature=0.7, max_new_tokens=30, task='dialogue'):
    global MODEL, TOKENIZER
    if MODEL is None or TOKENIZER is None:
        load_qwen_model()

    prompt = TOKENIZER.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = TOKENIZER([prompt], return_tensors="pt").to(MODEL.device)

    # For freeform diary, world, or JSON tasks, do not terminate on double newline
    if task in ['diary', 'world', 'json']:
        stop_keywords = [
            "USER MESSAGE:", "User Message:", "\nUser:", "\nMaster:", "\nHuman:",
            "<|im_end|>", "<|im_start|>"
        ]
        native_eos = [151645, 151643]
    else:
        stop_keywords = [
            "USER MESSAGE:", "User Message:", "\nUser:", "\nMaster:", "\nHuman:",
            "\n\nUser", "\n\nMaster", "\n\n", "<|im_end|>", "<|im_start|>"
        ]
        native_eos = [151645, 151643, 271]

    if TOKENIZER.eos_token_id and TOKENIZER.eos_token_id not in native_eos:
        native_eos.append(TOKENIZER.eos_token_id)

    stopping_criteria = StoppingCriteriaList([
        StopOnKeywordsCriteria(TOKENIZER, stop_keywords, len(inputs.input_ids[0]))
    ])

    import time
    t0 = time.time()
    print(f"[QWEN-GEN] [{task}] Starting generate with max_new_tokens={max_new_tokens}", flush=True)

    with GEN_LOCK:
        with torch.no_grad():
            output_ids = MODEL.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=max(0.01, float(temperature)),
                do_sample=float(temperature) > 0.1,
                top_p=0.9,
                pad_token_id=TOKENIZER.pad_token_id,
                eos_token_id=native_eos,
                stopping_criteria=stopping_criteria
            )

    # Decode assistant tokens only
    generated_ids = output_ids[0][len(inputs.input_ids[0]):]
    reply = TOKENIZER.decode(generated_ids, skip_special_tokens=True).strip()
    print(f"[QWEN-GEN] [{task}] Finished in {time.time()-t0:.2f}s, tokens generated: {len(generated_ids)}", flush=True)

    # Truncate at any stop marker
    for marker in stop_keywords:
        if marker in reply:
            reply = reply.split(marker)[0].strip()

    return reply

@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "runtime": "Qwen-Native-Transformers"
    })

@app.route("/api/tags", methods=["GET"])
def list_models():
    return jsonify({
        "models": [
            {"name": "qwen2:7b", "model": MODEL_NAME},
            {"name": "qwen2.5:0.5b", "model": MODEL_NAME},
            {"name": "Qwen/Qwen2-7B-Instruct", "model": MODEL_NAME}
        ]
    })

# Ollama /api/chat endpoint
@app.route("/api/chat", methods=["POST"])
def ollama_chat():
    data = request.json or {}
    messages = data.get("messages", [])
    options = data.get("options", {})
    temperature = float(options.get("temperature", 0.7))
    num_predict = options.get("num_predict")
    task = options.get("task", "dialogue")
    if task == "dialogue" and messages:
        sys_content = str(messages[0].get("content", "")).lower()
        if "diary" in sys_content:
            task = "diary"
        elif "json" in sys_content or "{" in sys_content:
            task = "json"

    if num_predict is not None:
        max_tokens = int(num_predict)
    elif "max_tokens" in options:
        max_tokens = int(options["max_tokens"])
    else:
        max_tokens = 30

    print(f"[OLLAMA_CHAT] task={task}, num_predict={num_predict}, resolved max_tokens={max_tokens}", flush=True)

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    reply = generate_completion(messages, temperature=temperature, max_new_tokens=max_tokens, task=task)
    return jsonify({
        "model": data.get("model", MODEL_NAME),
        "created_at": "2026-10-08T00:00:00Z",
        "message": {
            "role": "assistant",
            "content": reply
        },
        "done": True
    })

# OpenAI compatible /chat/completions endpoint
@app.route("/chat/completions", methods=["POST"])
@app.route("/v1/chat/completions", methods=["POST"])
def openai_chat():
    data = request.json or {}
    messages = data.get("messages", [])
    temperature = data.get("temperature", 0.7)
    max_tokens = data.get("max_tokens", 256)

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    reply = generate_completion(messages, temperature=temperature, max_new_tokens=max_tokens)
    return jsonify({
        "id": "chatcmpl-qwen-local",
        "object": "chat.completion",
        "model": data.get("model", MODEL_NAME),
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": reply
            },
            "finish_reason": "stop"
        }]
    })

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=11434, help="Port to listen on (default: 11434)")
    parser.add_argument("--model", type=str, default=None, help="Base Qwen model path")
    args = parser.parse_args()

    if args.model:
        MODEL_NAME = args.model

    print(f"Starting Qwen local server on http://localhost:{args.port}...")
    load_qwen_model(MODEL_NAME)
    app.run(host="0.0.0.0", port=args.port, threaded=True)
