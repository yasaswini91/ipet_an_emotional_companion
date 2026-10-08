# iPET: An Interactive Emotional Companion Dialogue System with LLM-Powered Virtual Pet World Simulation

Implementation based on the research paper:
> **iPET: An Interactive Emotional Companion Dialogue System with LLM-Powered Virtual Pet World Simulation**  
> *ACL 2025, System Demonstrations, pages 416–425.*  
> Zheyong Xie, Shaosheng Cao, Zuozhu Liu, Zheyu Ye, Zihan Niu, Chonggang Lu, Tong Xu, Enhong Chen, Zhe Xu, Yao Hu, Wei Lu (Xiaohongshu Inc., Zhejiang University, USTC, SUTD)

---

## 1. Project Overview & Source-of-Truth Separation

This project is a full-stack, modular reproduction of the **iPET** system described in the ACL 2025 paper, together with the specified architectural extensions.

### Core Paper Implementation vs. Additional Features

| Component Category | Feature | Reference in Paper / System |
| :--- | :--- | :--- |
| **Original Paper** | Interactive Dialogue Module | Equation (1): $R = \text{LLM}(I_R, H, T_1, T_2, T_3, P, U, M)$ |
| **Original Paper** | Memory Collection | Equation (2): $\{M_i, \text{Cat}_i\} = \text{LLM}(I_s, S, P, U)$ |
| **Original Paper** | Three Memory Retention Categories | Permanent (Indefinite), Long-Term (3 Months), Short-Term (1 Month) |
| **Original Paper** | Dense Retrieval & Cosine Similarity | Normalized dense embeddings + Cosine ranking $\frac{A \cdot B}{\|A\| \|B\|}$ |
| **Original Paper** | Three-Stage World Simulation | Stage 1: Outline ($T_1$) → Stage 2: Schedules ($T_2$, 2-5 words) → Stage 3: Details ($T_3$, ~50 words) |
| **Original Paper** | Normal vs. Memory Modes | $T_{1n} = \text{LLM}(I_{1n}, P, U, F)$ vs. $T_{1m} = \text{LLM}(I_{1m}, P, U, F, M)$ |
| **Original Paper** | Virtual Friends ($F$) | Randomized/LLM character profiles (Name, Relation, Personality, Hobbies) |
| **Original Paper** | T+1 Offline Operational Strategy | Off-peak pre-generation of world & memory summarization (Section 2.4) |
| **Original Paper** | Onboarding Workflow & UI | Figure 1: Breed selection, Personality selection, Naming, Initial world intro |
| **Original Paper** | Daily World Exploration UI | Figure 2 & Figure 6: Timeline of daily events, expandable detailed records |
| **Original Paper** | Offline LLM-as-a-Judge Evaluation | Section 3.2 & Table 1: Realism, Consistency, Richness, Attraction across 4 baselines |
| **Original Paper** | Interaction Turns vs Memories Analytics | Section 3.5 & Figure 5 distribution trends |
| **Original Paper** | A/B Test Dialogue-Only Comparison | Section 3.4: Dialogue Only vs. Full iPET (Dialogue + World + Memory) |
| **Extension #1** | User Authentication & Privacy | JWT auth, bcrypt password hashing, per-user data isolation |
| **Extension #2** | Pet Diary System | AI-generated first-person daily journal entries + Master's reflections |
| **Extension #3** | Multi-Dimensional Emotional State | Multi-attribute state: Happiness, Energy, Affection, Curiosity, Stress, Loneliness (0-100) |
| **Extension #4** | Pet Growth & Evolution | XP, level progression, growth stages (Baby → Young → Teen → Adult → Mature Companion) |
| **Extension #5** | Expanded Pet Customization | Fur/coat colors, eye colors, wearable accessories (wizard hat, glasses, bow, scarf, beret), room themes |
| **Extension #6** | Voice Interaction | Microphone STT (Web Speech API + backend fallback) & Pet TTS speech output |
| **Extension #7** | Dynamic Weather and Seasons | Spring/Summer/Autumn/Winter with Sunny/Rain/Snow/Cloudy effects impacting world activities |
| **Extension #8** | Memory-Based Surprises | Surprise Engine detecting opportunities from permanent/long-term memories (e.g. sci-fi reading nook, special pasta dish) |

---

## 2. Logical Architecture (Figure 4)

```
                            USER
                             │
                             ▼
                        React Client (Vite)
                             │
                             ▼
                    Express.js Backend / API
                 ┌───────────┴───────────┐
                 ▼                       ▼
          Dialogue Module          World Display
                 │                       │
                 ▼                       ▼
            LLM Service            World Database
                 │                       ▲
                 ▼                       │
           Memory Module                 │
                 │                       │
                 ▼                       │
          Memory Database                │
                                         │
 ────────────────── Offline T+1 Strategy ┴──────────────────
   World Simulation Module (Node Cron @ 03:00 AM)
     ├─► Outline Generator (Stage 1: T1)
     ├─► Schedule Generator (Stage 2: T2 [2-5 words])
     └─► Detail Generator (Stage 3: T3 [~50 words])
```

---

## 3. Core Paper Mathematical Formalisms

### 3.1 Interactive Dialogue Generation
$$\mathbf{R} = \text{LLM}(I_R, H, T_1, T_2, T_3, P, U, M)$$
- $I_R$: Instructional prompt & World Rules (e.g., pet has an independent personality, realistic daily life, emotional companion tone).
- $H$: Historical dialogue session.
- $T_1$: Today's outline generated by Stage 1.
- $T_2$: Timeline schedule items generated by Stage 2 (brief 2–5 words each).
- $T_3$: Detailed sensory and internal thoughts generated by Stage 3 (~50 words each).
- $P$: Pet profile (Name, species, breed, personality, hobbies, description).
- $U$: User profile (Master name, interests, preferences).
- $M$: Top-ranked user memories retrieved via dense cosine similarity.

### 3.2 Memory Module Three Stages
1. **Collection**:
   $$\{M_i, \text{Cat}_i\}_{1 \le i \le K_s} = \text{LLM}(I_s, S, P, U)$$
2. **Management**:
   - `PERMANENT`: Enduring user traits, favorite food, hobbies $\to$ **Indefinite retention** (`expiresAt = null`).
   - `LONG_TERM`: Medium-term plans, upcoming trips, skills $\to$ **3 Months retention** (`expiresAt = createdAt + 90 days`).
   - `SHORT_TERM`: Transient events, exam tomorrow, today's tasks $\to$ **1 Month retention** (`expiresAt = createdAt + 30 days`).
   - Scheduled job automatically purges expired memories.
3. **Utilization**:
   Dense vector embeddings calculated for query and candidate memories:
   $$\text{cosine}(A, B) = \frac{\sum_{i=1}^{d} A_i B_i}{\sqrt{\sum_{i=1}^d A_i^2} \sqrt{\sum_{i=1}^d B_i^2}}$$

### 3.3 Three-Stage World Simulation Pipeline
1. **Outline Generation ($T_1$)**:
   - Normal Mode: $T_{1n} = \text{LLM}(I_{1n}, P, U, F)$
   - Memory Mode: $T_{1m} = \text{LLM}(I_{1m}, P, U, F, M)$
2. **Schedule Generation ($T_2$)**:
   $$\{T_{2i}\} = \text{LLM}(I_2, T_1, P, U, F, [M])$$
   *Constraint: Brief descriptions, exactly 2 to 5 words per activity.*
3. **Detail Generation ($T_3$)**:
   $$T_{3i} = \text{LLM}(I_3, T_1, T_{2i}, P, U, F, [M])$$
   *Constraint: Approximately 50 words of rich sensory description, scenes, and thoughts.*

---

## 4. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React, Canvas Confetti, Web Speech API.
- **Backend**: Node.js (ES Modules), Express.js, JWT, bcryptjs, Node Cron.
- **Database Layer**: Dual-mode persistence. Automatically connects to MongoDB via Mongoose if `MONGODB_URI` is specified; seamlessly activates a high-performance local persistent JSON store (`server/data/`) with identical Mongoose-like querying when no external MongoDB daemon is active.
- **LLM Layer Strictly Adhering to Paper (Section 3.1 & 3.2)**:
  - **Qwen2 Family (Yang et al., 2024)**: Offline verification model family (`Qwen2-7B-Instruct`, `Qwen2-72B-Instruct`).
  - **iPET-Qwen2-SFT Model**: Online deployment model trained via Supervised Fine-Tuning (SFT) on 14,113 safety-filtered entries with context length 2,048 tokens and temperature 0.9 on 24 A100 GPUs.
  - **GPT-4o (Section 3.2)**: Dedicated LLM-as-a-Judge model for offline evaluation across Realism, Consistency, Richness, and Attraction.
  - **ChatML Format**: Formatted with the official Qwen2 `<|im_start|>system...<|im_end|><|im_start|>user...<|im_end|>` template.

---

## 5. API Reference

### Authentication
- `POST /api/auth/register` — Register master user
- `POST /api/auth/login` — Login & receive JWT token
- `GET /api/auth/me` — Get current authenticated user
- `PUT /api/auth/profile` — Update user profile ($U$)

### Pet Onboarding & Customization
- `POST /api/pets` — Create pet (Figure 1 Onboarding: Breed, Personality, Name)
- `GET /api/pets` — List user pets
- `GET /api/pets/:id` — Get pet profile ($P$), emotions, growth, and friends
- `PUT /api/pets/:id/customization` — Update coat color, eye color, accessories, room theme

### Interactive Dialogue
- `POST /api/chat` — Generate pet response $R = \text{LLM}(I_R, H, T_1, T_2, T_3, P, U, M)$
- `GET /api/chat/:petId` — Get conversation history $H$

### Memory Module
- `GET /api/memories/:petId` — View categorized memories ($M$)
- `POST /api/memories/process` — Manually trigger memory extraction
- `POST /api/memories/search` — Dense retrieval query with live cosine similarity scores
- `DELETE /api/memories/:id` — Remove memory (User privacy control)

### World Simulation
- `GET /api/world/:petId/today` — Retrieve today's pre-generated world ($T_1, T_2, T_3$)
- `GET /api/world/:petId/date/:date` — Historical simulated world
- `POST /api/world/generate` — Generate world for date
- `POST /api/world/offline-trigger` — Run T+1 offline background simulation
- `GET /api/world/:petId/environment` — Get current simulated season & weather

### Pet Diary
- `GET /api/diary/:petId` — Get pet and user diary entries
- `GET /api/diary/:petId/today` — Get or generate today's pet diary
- `POST /api/diary` — Save user reflection note

### Emotion & Growth
- `GET /api/emotion/:id` — Get multi-dimensional emotional state
- `POST /api/emotion/:id/interact` — Interact (play, feed, pet, rest, explore)
- `GET /api/growth/:id` — Get XP, level, growth stage, unlocked traits

### Memory-Based Surprises
- `GET /api/surprises/:petId` — List surprises
- `POST /api/surprises/trigger` — Evaluate memory-linked surprise opportunity
- `POST /api/surprises/:id/view` — Mark surprise acknowledged

### Evaluation & Analytics
- `POST /api/evaluation/run` — Run live LLM-as-a-judge evaluation across 4 baselines on 4 metrics
- `GET /api/evaluation/stats/:petId` — User dialogue turns vs memory count (Figure 5)

---

## 6. How to Run Locally

### 1. Install Dependencies
```bash
# In project root
npm run install:all
```

### 2. Run Backend & Frontend Concurrently
```bash
npm run dev
```
- Backend server runs on: `http://localhost:5000`
- Frontend application runs on: `http://localhost:5173`

### 3. Run Backend Verification Tests
```bash
npm run test:backend
```
The test suite validates:
1. User profile creation
2. Pet onboarding & Profile $P$
3. Dense retrieval & Cosine similarity calculation
4. Memory module with 3 temporal retention policies (Permanent, Long-term, Short-term)
5. 3-stage World Simulation ($T_1 \to T_2 \to T_3$, 2-5 words for $T_2$, ~50 words for $T_3$)
6. Dialogue generation incorporating $I_R, H, T_1, T_2, T_3, P, U, M$
7. Emotion state transitions & Growth XP
8. Memory-based surprise triggering
9. Pet diary generation

---

## 7. Experimental Baselines & Metrics (Section 3)

The evaluation tab in the application allows executing the **LLM-as-a-Judge** framework from Section 3.2:

### Baselines Evaluated:
1. **Basic Information**: Only pet profile details provided.
2. **Direct Generation**: Direct single-inference generation of behavior and daily schedule.
3. **World Simulation without Outline**: Generates schedules and details directly without the narrative outline stage.
4. **World Simulation (Full iPET)**: Complete 3-stage pipeline (Outline $\to$ Schedules $\to$ Details).

### Four Dimensions Judged (1.0 to 5.0 scale):
1. **Realism**: Logical coherence, activity conflicts, schedule feasibility, stamina constraints.
2. **Consistency**: Alignment between character behaviors and predefined personality/background.
3. **Richness**: Variety of virtual itinerary and sensory detail.
4. **Attraction**: User conversational appeal, topic relevance, emotional resonance.

*Note: As required by Section 74, the paper's reported numbers from Table 1 are displayed for benchmark reference, while live runs are explicitly labeled as Our Local Results.*

---

## 8. Limitations & Ethical Considerations (Section 79 & Limitations)

- **AI Companion Role**: The virtual pet is an AI emotional companion and role-play simulation designed to provide comfort and validation. It is explicitly positioned as a supplement to, rather than a substitute for, human social connections and real animal companionship.
- **Privacy & User Control**: Users have full control over their memory bank. All extracted user facts can be inspected, searched, or permanently deleted at any time.
- **Emotional Simulation**: The emotional and growth engines are computational simulations reflecting user care and interaction history, not genuine sentient consciousness.
