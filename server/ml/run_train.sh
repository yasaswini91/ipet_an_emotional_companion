#!/usr/bin/env bash
# Training launcher for iPET-Qwen2-SFT across 24 x A100 (80GB) GPUs
# Conforms strictly to Section 3.1: 2048 context, lr 5e-6, 3 epochs

export OMP_NUM_THREADS=8
export CUDA_DEVICE_MAX_CONNECTIONS=1

# Multi-GPU / Multi-Node torchrun with DeepSpeed ZeRO-3
torchrun --nproc_per_node=8 --nnodes=3 --node_rank=0 \
  --master_addr="127.0.0.1" --master_port=29500 \
  train_sft.py \
  --deepspeed deepspeed_zero3.json
