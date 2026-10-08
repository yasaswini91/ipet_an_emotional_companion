"""
Supervised Fine-Tuning (SFT) Training Pipeline for iPET-Qwen2-EmotionalCompanion
Implements Section 3.1 of ACL 2025 iPET Paper with QLoRA/LoRA parameter efficiency:
- Base Model: Qwen/Qwen2-7B-Instruct
- LoRA Adapter: r=16, alpha=32, target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj']
- Checkpoint Path: server/ml/models/iPET-Qwen2-EmotionalCompanion
- Context Length: 2,048 tokens
- SFT Loss Masking: System & User tokens masked with -100; Assistant tokens trained
- Learning Rate: 1e-4 with cosine decay and 0.1 warmup
"""

import os
import sys
import json
import torch
from dataclasses import dataclass, field
from typing import Optional

try:
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForSeq2Seq
    )
    from datasets import Dataset
    from peft import LoraConfig, get_peft_model, TaskType
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUTPUT_DIR = os.path.join(SCRIPT_DIR, "models", "iPET-Qwen2-EmotionalCompanion")
DEFAULT_DATASET_PATH = os.path.join(SCRIPT_DIR, "dataset_sft.json")

@dataclass
class ModelArguments:
    model_name_or_path: str = field(
        default="Qwen/Qwen2-7B-Instruct",
        metadata={"help": "Base model HuggingFace ID or local path"}
    )
    use_lora: bool = field(
        default=True,
        metadata={"help": "Use LoRA/QLoRA adapter for efficient companion fine-tuning"}
    )
    lora_r: int = field(default=16, metadata={"help": "LoRA rank"})
    lora_alpha: int = field(default=32, metadata={"help": "LoRA scaling factor"})
    lora_dropout: float = field(default=0.05, metadata={"help": "LoRA dropout"})

@dataclass
class DataArguments:
    dataset_path: str = field(
        default=DEFAULT_DATASET_PATH,
        metadata={"help": "Path to SFT dataset JSON"}
    )
    max_seq_length: int = field(
        default=2048,
        metadata={"help": "Maximum sequence length: 2048 tokens"}
    )

def mask_prompt_tokens(input_ids, tokenizer):
    """
    Mask system and user tokens with -100 so loss is computed ONLY on assistant responses.
    Qwen ChatML format:
    <|im_start|>system ... <|im_end|>
    <|im_start|>user ... <|im_end|>
    <|im_start|>assistant ... <|im_end|>
    """
    labels = [-100] * len(input_ids)
    assistant_prefix = tokenizer.encode("<|im_start|>assistant\n", add_special_tokens=False)
    im_end_id = tokenizer.encode("<|im_end|>", add_special_tokens=False)[0] if tokenizer.encode("<|im_end|>", add_special_tokens=False) else tokenizer.eos_token_id

    # Search for assistant token start
    prefix_len = len(assistant_prefix)
    i = 0
    while i < len(input_ids) - prefix_len:
        if input_ids[i:i + prefix_len] == assistant_prefix:
            start_idx = i + prefix_len
            # Find end of assistant turn
            end_idx = len(input_ids)
            for j in range(start_idx, len(input_ids)):
                if input_ids[j] == im_end_id:
                    end_idx = j + 1
                    break
            for k in range(start_idx, end_idx):
                labels[k] = input_ids[k]
            i = end_idx
        else:
            i += 1
    return labels

def train():
    if not TRANSFORMERS_AVAILABLE:
        print("[Error] Required packages not found. Install: pip install torch transformers datasets peft accelerate")
        return

    if not torch.cuda.is_available():
        print("⚠️ [Hardware Check] CUDA GPU not detected. Training Qwen2-7B on CPU is not supported.")
        print(f"Target Checkpoint: {DEFAULT_OUTPUT_DIR}")
        print("The backend will report 'BASE_QWEN_NOT_FINETUNED' and run using base Qwen until training on a GPU environment completes.")
        return

    model_args = ModelArguments()
    data_args = DataArguments()

    os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=DEFAULT_OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=1e-4 if model_args.use_lora else 5e-6,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        bf16=torch.cuda.is_bf16_supported(),
        fp16=not torch.cuda.is_bf16_supported() and torch.cuda.is_available(),
        logging_steps=10,
        save_strategy="epoch",
        save_total_limit=2,
        report_to="none"
    )

    print(f"Loading tokenizer: {model_args.model_name_or_path}...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_args.model_name_or_path,
        model_max_length=data_args.max_seq_length,
        padding_side="right",
        use_fast=True
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"Loading base model: {model_args.model_name_or_path}...")
    model = AutoModelForCausalLM.from_pretrained(
        model_args.model_name_or_path,
        torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        device_map="auto"
    )

    if model_args.use_lora:
        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=model_args.lora_r,
            lora_alpha=model_args.lora_alpha,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=model_args.lora_dropout
        )
        model = get_peft_model(model, peft_config)
        model.print_trainable_parameters()

    if not os.path.exists(data_args.dataset_path):
        print(f"Dataset not found at {data_args.dataset_path}. Run datasetGenerator.js first.")
        return

    with open(data_args.dataset_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    def preprocess_function(examples):
        texts = examples["formatted_chatml"]
        tokenized = tokenizer(
            texts,
            max_length=data_args.max_seq_length,
            truncation=True,
            padding="max_length"
        )
        labels_list = []
        for input_id_seq in tokenized["input_ids"]:
            labels_list.append(mask_prompt_tokens(input_id_seq, tokenizer))
        tokenized["labels"] = labels_list
        return tokenized

    hf_dataset = Dataset.from_list(raw_data)
    tokenized_dataset = hf_dataset.map(preprocess_function, batched=True, remove_columns=hf_dataset.column_names)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8, return_tensors="pt")
    )

    print("Beginning SFT training with LoRA and instruction loss masking...")
    trainer.train()

    print(f"Saving checkpoint to {DEFAULT_OUTPUT_DIR}...")
    trainer.save_model(DEFAULT_OUTPUT_DIR)
    tokenizer.save_pretrained(DEFAULT_OUTPUT_DIR)
    print("Training finished successfully!")

if __name__ == "__main__":
    train()
