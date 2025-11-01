# Progressive Learning System - Implementation Plan

**AI-Powered Adaptive Learning Platform**

Version 1.0 | Last Updated: 2025-11-01

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Phase 1: Database Schema & Data Model](#phase-1-database-schema--data-model)
4. [Phase 2: Bloom's Taxonomy System](#phase-2-blooms-taxonomy-system)
5. [Phase 3: FSRS Integration](#phase-3-fsrs-integration)
6. [Phase 4: Multidimensional IRT](#phase-4-multidimensional-irt)
7. [Phase 5: Confidence & Dunning-Kruger](#phase-5-confidence--dunning-kruger)
8. [Phase 6: Generation Effect](#phase-6-generation-effect-levels-3-6)
9. [Phase 7: Bayesian Inference](#phase-7-bayesian-inference--pattern-learning)
10. [Phase 8: Adaptive Question Selection](#phase-8-adaptive-question-selection)
11. [Phase 9: User Interface & Workflow](#phase-9-user-interface--workflow)
12. [Phase 10: System Coordination](#phase-10-system-coordination)
13. [Phase 11: Evolution - Day 1 to Day 50](#phase-11-day-1-vs-day-50-comparison)
14. [Implementation Timeline](#implementation-timeline)

---

## Overview

### Core Principles

This implementation plan describes a **progressive learning system** that combines multiple evidence-based learning techniques to create a personalized, adaptive educational experience.

**Ultimate Goal:** Progressive learning - steady advancement from novice to expert with solid foundations at each level.

### Six Integrated Systems

1. **Bloom's Taxonomy** (Remember → Understand → Apply → Analyze → Evaluate → Create)
   - Progressive skill development
   - Mastery-based level unlocking
   - Prerequisite enforcement

2. **FSRS (Free Spaced Repetition Scheduler)**
   - Memory retention optimization
   - Foundation maintenance
   - Forgetting curve modeling

3. **Item Response Theory (IRT)**
   - Multidimensional ability estimation
   - Adaptive difficulty matching
   - Optimal challenge targeting

4. **Dunning-Kruger Effect Detection**
   - Confidence calibration tracking
   - Metacognitive awareness
   - Overconfidence intervention

5. **Generation Effect**
   - Typed answers for deeper encoding (Levels 3-6)
   - Recall vs. recognition tracking
   - Active retrieval practice

6. **Bayesian Inference**
   - Pattern recognition across topics
   - Personalized learning insights
   - Time-of-day optimization

---

## System Architecture

### High-Level Data Flow

```
User answers question
    ↓
Multi-signal collection:
  - Pre-answer confidence (5-point scale)
  - Typed answer (L3+)
  - Selected answer
  - Post-answer reflection (behavioral)
    ↓
Parallel updates:
  - Bloom's mastery calculation
  - IRT theta estimation
  - FSRS card scheduling
  - Confidence calibration
  - Bayesian pattern learning
    ↓
Check gates & milestones:
  - Level unlock ready?
  - Foundation stable?
  - Intervention needed?
    ↓
Next question selection:
  - IRT difficulty matching
  - FSRS urgency
  - Content balance
  - Bloom's progression
    ↓
Repeat
```

---

## Phase 1: Database Schema & Data Model

### 1.1 Core Data Structures

#### User Profile Extended

```sql
user_profile:
  - user_id: uuid (primary key)
  - overall_ability: float (global IRT θ)
  - created_at: timestamp
  - last_active: timestamp
  - total_questions_answered: int
  - learning_preferences: json
```

#### Bloom's Level Tracking (Per Topic)

```sql
user_bloom_mastery:
  - user_id: uuid
  - topic_id: string (e.g., "Networking", "Encryption")
  - bloom_level: enum(1-6) [Remember, Understand, Apply, Analyze, Evaluate, Create]
  - mastery_percentage: float (0-100%)
  - questions_answered: int
  - questions_correct: int
  - last_practiced: timestamp
  - unlocked: boolean
  - unlocked_at: timestamp

Key metrics per level:
  - accuracy: float (correct/total)
  - average_confidence: float (20-95 scale)
  - calibration_score: float (confidence - performance)
  - irt_theta: float (ability at this specific level)
  - fsrs_average_stability: float
```

#### Multidimensional IRT Ability

```sql
user_irt_ability:
  - user_id: uuid
  - topic_id: string
  - bloom_level: enum(1-6)
  - theta: float (-3 to +3, current ability estimate)
  - theta_history: json array [{timestamp, theta, confidence_interval}]
  - questions_answered: int
  - last_updated: timestamp
  - confidence_interval: float (uncertainty in estimate)
```

**Example entry:**
```json
{
  "user_id": "sarah_123",
  "topic_id": "Networking",
  "bloom_level": 3,
  "theta": 0.0,
  "questions_answered": 18,
  "confidence_interval": 0.3
}
```

#### FSRS Card State (Per Question × User)

```sql
user_fsrs_cards:
  - user_id: uuid
  - question_id: uuid
  - stability: float (days until 90% retention)
  - difficulty: float (0-10, inherent difficulty for this user)
  - retrievability: float (0-1, current retention probability)
  - last_review: timestamp
  - next_review: timestamp
  - review_count: int
  - rating_history: json array [{timestamp, rating, elapsed_days}]
  - created_at: timestamp
```

#### Confidence & Metacognition Tracking

```sql
user_confidence_data:
  - user_id: uuid
  - question_id: uuid
  - attempt_timestamp: timestamp
  - pre_answer_confidence: enum(1-5) [20%, 40%, 60%, 80%, 95%]
  - post_answer_process: enum (knew_memory, recognized, educated_guess, random_guess)
  - actual_performance: float (0-1, includes partial credit)
  - calibration_score: float (confidence - performance)
  - topic_id: string
  - bloom_level: enum(1-6)
  - time_of_day: time
  - session_id: uuid
```

#### Question Response Records

```sql
user_question_responses:
  - response_id: uuid
  - user_id: uuid
  - question_id: uuid
  - session_id: uuid
  - timestamp: timestamp

Question metadata:
  - topic_id: string
  - bloom_level: enum(1-6)
  - irt_difficulty: float
  - core_intent_topic: string
  - prerequisite_topics: json array

User response:
  - pre_confidence: enum(1-5)
  - typed_answer: text (nullable, only for L3+)
  - typed_answer_match_score: float (0-1, fuzzy match)
  - selected_answer: string
  - correct: boolean
  - partial_credit_score: float (0-1, for multi-select)
  - post_process_reflection: enum (4 options)
  - time_to_answer: int (seconds)

Updates triggered:
  - irt_theta_before: float
  - irt_theta_after: float
  - bloom_mastery_before: float
  - bloom_mastery_after: float
  - fsrs_rating_calculated: enum (Again, Hard, Good, Easy)
  - fsrs_next_review: timestamp
```

#### Bayesian Learning Patterns

```sql
user_bayesian_patterns:
  - user_id: uuid
  - pattern_type: enum (topic_correlation, time_of_day, learning_style, prerequisite_chain)
  - pattern_data: json
  - confidence: float (0-1, pattern strength)
  - sample_size: int (observations)
  - last_updated: timestamp
```

**Example patterns:**

```json
{
  "pattern_type": "topic_correlation",
  "pattern_data": {
    "source_topic": "Risk Assessment",
    "target_topic": "Control Selection",
    "correlation": 0.90,
    "interpretation": "Missing Risk Assessment predicts missing Control Selection"
  },
  "confidence": 0.95,
  "sample_size": 47
}
```

```json
{
  "pattern_type": "time_of_day",
  "pattern_data": {
    "morning_confidence_bias": +0.5,
    "post_lunch_confidence_bias": -0.3,
    "evening_retention": 0.72
  }
}
```

---

## Phase 2: Bloom's Taxonomy System

### 2.1 Level Unlocking Logic

#### Initial State (Day 1)

On user registration:
1. Create `user_bloom_mastery` entries for ALL topics × Level 1 (Remember)
   - `mastery_percentage: 0%`
   - `unlocked: TRUE` (Level 1 always unlocked)
   - `questions_answered: 0`

2. Create `user_bloom_mastery` entries for ALL topics × Levels 2-6
   - `mastery_percentage: 0%`
   - `unlocked: FALSE` (locked until prerequisites met)

3. Initialize `user_irt_ability` for all topics × Level 1
   - `theta: 0.0` (neutral starting point)
   - `confidence_interval: 1.0` (maximum uncertainty)

#### Unlock Requirements (Hard Gates)

**To unlock Level 2 (Understand):**
- ✅ Level 1 mastery ≥ 60%
- ✅ Level 1 questions_answered ≥ 10
- ✅ Level 1 IRT theta ≥ -0.5
- ✅ Level 1 calibration within ±30

**To unlock Level 3 (Apply):**
- ✅ Level 2 mastery ≥ 60%
- ✅ Level 1 mastery maintained ≥ 50%
- ✅ Level 2 questions_answered ≥ 15
- ✅ Level 2 IRT theta ≥ -0.3

**To unlock Level 4 (Analyze):**
- ✅ Level 3 mastery ≥ 65% (higher bar)
- ✅ Level 2 + Level 1 both maintained ≥ 50%
- ✅ Level 3 questions_answered ≥ 20
- ✅ Level 3 IRT theta ≥ 0.0
- ✅ Average calibration at L3 within ±25

**To unlock Level 5 (Evaluate):**
- ✅ Level 4 mastery ≥ 70%
- ✅ All lower levels maintained ≥ 50%
- ✅ Level 4 questions_answered ≥ 25
- ✅ Level 4 IRT theta ≥ 0.5

**To unlock Level 6 (Create):**
- ✅ Level 5 mastery ≥ 75%
- ✅ All lower levels maintained ≥ 50%
- ✅ Level 5 questions_answered ≥ 30
- ✅ Level 5 IRT theta ≥ 1.0
- ✅ Overall confidence calibration excellent (±15)

#### Foundation Stability Check

Before unlocking next Bloom's level:

```
Check all lower-level FSRS cards:
- Count cards with stability < 7 days (unstable foundation)
- If >20% of cards unstable → Recommend foundation review
- If >40% of cards unstable → Require foundation review before unlock

Example:
User at Apply (L3) 65% mastery, ready to unlock Analyze (L4)

Foundation check:
- Remember (L1): 45 cards, 8 due soon (18% unstable) ✅ OK
- Understand (L2): 32 cards, 15 due soon (47% unstable) ❌ FAIL

System response:
"You've reached 65% Apply mastery! However, 47% of your
Understand-level knowledge needs review. Let's strengthen
that foundation first (one 15-minute session)."

[Review Foundation] [Skip (not recommended)]
```

### 2.2 Mastery Calculation

#### Base Mastery Formula

For each `[user][topic][bloom_level]`:

```
Base score per question:
= correctness × bloom_multiplier × calibration_modifier × recency_weight

Where:
- correctness: 0.0 (wrong) to 1.0 (correct), or 0.0-1.0 (partial credit)
- bloom_multiplier:
  L1=1.0x, L2=1.3x, L3=1.6x, L4=2.0x, L5=2.5x, L6=3.0x
- calibration_modifier:
  Well-calibrated (±10): 1.1x
  Moderate (±20): 1.0x
  Poor (>±30): 0.9x
- recency_weight:
  Last 7 days: 1.0x
  7-30 days: 0.7x
  30+ days: 0.4x
  Needs review (FSRS overdue): 0.2x

Mastery percentage:
= (sum of all weighted scores) / (max possible score) × 100%
```

#### Example Calculation

```
Topic: Networking, Level: Apply (L3)
Questions answered: 20

Q1: Correct (1.0) × 1.6 (L3) × 1.1 (calibrated) × 1.0 (recent) = 1.76
Q2: Partial (0.7) × 1.6 × 0.9 (overconfident) × 1.0 = 1.01
Q3: Wrong (0.0) × 1.6 × 1.0 × 0.7 (older) = 0.0
...
Q20: Correct (1.0) × 1.6 × 1.1 × 1.0 = 1.76

Sum of scores: 25.3
Max possible (20 × 1.76): 35.2
Mastery: 25.3 / 35.2 = 71.9%
```

### 2.3 Skill Decay Model

#### Forgetting Curve per Bloom's Level

```
Decay function: R(t) = mastery_peak × e^(-t / half_life)

Half-lives by level:
- L1 Remember: 45 days (facts decay slowly)
- L2 Understand: 35 days
- L3 Apply: 25 days (skills need practice)
- L4 Analyze: 18 days
- L5 Evaluate: 15 days
- L6 Create: 12 days (complex skills decay fastest)

Where t = days since last practice at this level
```

#### Decay Check and Adjustment

Every session start:

```
For each [topic][bloom_level]:
1. Calculate days_since_last_practice
2. Calculate decay: R(days) = mastery_peak × e^(-days/half_life)
3. Update mastery_percentage:
   mastery_current = mastery_peak × R(days)
4. If mastery dropped below unlock threshold:
   - Don't re-lock level (avoid frustration)
   - But flag for maintenance review
5. Update IRT theta with decay factor

Example:
Topic: Networking, Level: Apply
mastery_peak: 70%
days_since_practice: 30
half_life: 25 days

decay = e^(-30/25) = e^(-1.2) = 0.30 (30% retention)
mastery_current = 70% × 0.30 = 21% (catastrophic decay!)

Action: Flag "Apply level needs urgent maintenance"
```

---

## Phase 3: FSRS Integration

### 3.1 FSRS Card Creation

#### When to Create FSRS Card

Create new FSRS card when:
1. User answers a question for the first time
2. Question is at Level 1-4 (Remember through Analyze)
3. Question is marked as "reviewable"

**Initial FSRS state:**
```
- stability: Based on first performance + confidence
  If correct + confident: 3 days
  If correct + unconfident: 2 days
  If wrong: 1 day
- difficulty: 5.0 (neutral, will adapt)
- retrievability: 1.0 (just learned)
- next_review: now + stability
```

#### FSRS Rating Calculation

Automatic FSRS rating based on multi-signal input:

```
Rating = f(correctness, pre_confidence, post_process, typed_quality)

1. If wrong answer → "Again" (always)

2. If correct answer:

   Based on combination of:
   - Typed answer quality (L3+):
     • typed_match ≥ 90% → Strong recall
     • typed_match 50-90% → Partial recall
     • typed_match < 50% → Weak recall

   - Post-process reflection:
     • "Knew from memory" → Strong
     • "Recognized in options" → Moderate
     • "Educated guess" → Weak
     • "Random guess" → Very weak

   - Pre-confidence:
     • Very confident (95%) + Strong recall → "Easy"
     • Confident (80%) + Strong recall → "Easy"
     • Moderately confident (60%) + Moderate recall → "Good"
     • Slightly confident (40%) + Weak recall → "Hard"
     • Not confident (20%) + Any → "Hard"
```

**FSRS Rating Matrix:**

| Performance | Confidence | Post-Process | Typed Match | → FSRS Rating |
|-------------|-----------|--------------|-------------|---------------|
| Correct | 95% | Knew memory | 100% | **Easy** |
| Correct | 80% | Knew memory | 90% | **Easy** |
| Correct | 60% | Recognized | N/A | **Good** |
| Correct | 80% | Educated guess | 60% | **Good** |
| Correct | 40% | Recognized | N/A | **Hard** |
| Correct | 20% | Random guess | N/A | **Hard** |
| Wrong | Any | Any | Any | **Again** |

#### FSRS Update Formulas

Use standard FSRS algorithm with 17 parameters:

```
After each review:
1. Calculate elapsed time since last review
2. Calculate expected retrievability at review time
3. Update stability based on rating:

   If "Again":
     S_new = S_old × recall_factor × difficulty_penalty

   If "Hard":
     S_new = S_old × 1.2

   If "Good":
     S_new = S_old × ease_factor (typically 2.5)

   If "Easy":
     S_new = S_old × ease_factor × 1.3

4. Update difficulty:
   D_new = D_old + weight × (rating - 3)

5. Calculate next review:
   next_review = now + S_new (days)
```

### 3.2 FSRS Personalization

#### Training Period

```
First 20-30 reviews per user:
- Use default FSRS parameters (population average)
- Collect data: ratings, elapsed times, outcomes

After 100+ total reviews:
- Run FSRS optimizer
- Fit 17 parameters to THIS user's data
- Parameters include:
  * Initial stability for each rating
  * Difficulty weights
  * Recall decay rates

Re-optimize every 500 new reviews:
- User's learning patterns evolve
- Account for skill improvement
```

#### Time-of-Day Personalization

Track review performance by time of day:

```
Example pattern:
- Morning reviews (6am-10am): 85% retention
- Midday reviews (10am-2pm): 78% retention
- Afternoon reviews (2pm-6pm): 72% retention
- Evening reviews (6pm-10pm): 68% retention

Adjust FSRS stability:
If morning: S × 1.1 (can wait longer)
If evening: S × 0.9 (review sooner)

This is Bayesian learning: Adapt to user's patterns
```

### 3.3 FSRS Session Integration

#### Question Selection with FSRS

Each session (30 questions):

```
Phase 1: FSRS Urgent Reviews (5 questions)
- Cards overdue by >3 days (critical)
- Cards with stability <3 days (about to forget)
- Priority: Prevent catastrophic forgetting

Phase 2: Current Level Practice (20 questions)
- Bloom's level user is working on
- IRT-matched difficulty
- New cards + cards due within 2 days

Phase 3: Foundation Maintenance (3 questions)
- FSRS cards from lower Bloom's levels
- Due today or tomorrow
- Keep foundation solid

Phase 4: Preview (2 questions)
- Next Bloom's level (if close to unlock)
- Build confidence for advancement
```

---

## Phase 4: Multidimensional IRT

### 4.1 IRT Ability Estimation

#### Initial State (Day 1)

For each `[user][topic][bloom_level]`:
```
- theta: 0.0 (population mean)
- confidence_interval: 1.0 (maximum uncertainty)
```

#### Hierarchical Bayesian Structure

```
Level 1: Overall user ability
  prior: theta_overall ~ Normal(0, 1)

Level 2: Topic-level ability (informed by overall)
  prior: theta_topic ~ Normal(theta_overall, 0.5)

  Examples:
  theta_Networking ~ Normal(theta_overall, 0.5)
  theta_Encryption ~ Normal(theta_overall, 0.5)

Level 3: Bloom's-level ability (informed by topic)
  prior: theta_topic_bloom ~ Normal(theta_topic + bloom_offset, 0.3)

  Bloom offsets (Remember is easier than Create):
  L1 Remember: +0.5
  L2 Understand: +0.2
  L3 Apply: 0.0
  L4 Analyze: -0.3
  L5 Evaluate: -0.5
  L6 Create: -0.7
```

#### IRT Update After Each Question

```
Input:
- question_difficulty: d
- user_theta_before: θ_old
- performance: p (0-1)
- pre_confidence: c (20, 40, 60, 80, 95)
- typed_match_score: t (0-1, only for L3+)

Enhanced IRT performance score:
performance_score = (p × 0.5) + (t × 0.3) + (calibration_bonus × 0.2)

Where calibration_bonus:
= 1.0 if |c - (p×100)| ≤ 10 (well-calibrated)
= 0.5 if |c - (p×100)| ≤ 20 (moderate)
= 0.0 if |c - (p×100)| > 20 (poorly calibrated)

IRT update (Maximum Likelihood Estimation):
θ_new = θ_old + learning_rate × (performance_score - expected_performance)

Where:
expected_performance = 1 / (1 + e^(-(θ_old - d)))

learning_rate = 0.3 / (1 + questions_answered/10)

Confidence interval update:
ci_new = ci_old × 0.9 (decreases with more data)
```

#### Example IRT Evolution

```
User: Sarah
Topic: Networking, Level: Apply (L3)

Question 1: difficulty = 1.0
θ_before: 0.0, ci: 1.0
Performance: Correct (1.0), Confidence: 80%, Typed: 0.9
expected = 0.27
performance_score = 0.97
θ_after = 0.0 + 0.21 = 0.21

Question 5: difficulty = 1.2
θ_before: 0.18, ci: 0.7
learning_rate = 0.20 (lower, more data)
θ_after = 0.25

Question 18: difficulty = 1.1
θ_before: 0.52, ci: 0.3
Performance: Wrong (0.0)
θ_after = 0.45

Final state (20 questions):
θ = 0.5, ci = 0.25 (fairly confident in estimate)
```

#### Hierarchical Propagation

After updating theta at `[topic][bloom_level]`:

```
Propagate UP (inform higher levels):
theta_Networking_Apply updated →
  Adjust theta_Networking (topic-level) →
    Adjust theta_overall (global)

Propagate ACROSS (inform related levels):
theta_Networking_Apply updated →
  Adjust theta_Networking_Understand (if sparse data)
  Adjust theta_Networking_Analyze prior (prepare for next)

Propagate via CORRELATIONS (Bayesian):
If "Risk Assessment correlates with Control Selection":
  theta_RiskAssessment updated →
    Adjust theta_ControlSelection estimate
```

### 4.2 Adaptive Question Selection

#### IRT-Based Difficulty Matching

Goal: Select questions where user has ~60-70% success probability (optimal challenge zone)

```
For current [user][topic][bloom_level]:
1. Get current theta estimate
2. Calculate target difficulty range:
   d_target = theta ± 0.3

   If theta = 0.5:
     Target difficulty: 0.2 to 0.8
     (50-75% success probability)

3. Filter candidate questions:
   - Same topic
   - Same Bloom's level
   - Difficulty in target range
   - Not answered in last 7 days
   - Not in FSRS review queue

4. Apply secondary filters:
   - Content balance
   - Intent-based tagging
   - Randomization (±20% variance)

5. Select highest weighted score
```

#### Multi-Criteria Scoring

```
score = (irt_information × 0.25)
      + (bloom_relevance × 0.30)
      + (fsrs_urgency × 0.20)
      + (content_balance × 0.15)
      + (decay_prevention × 0.10)

Where:
irt_information = f(theta_uncertainty, difficulty_match)
bloom_relevance = 1.0 if current level, 0.3 if locked
fsrs_urgency = days_overdue / 7 (capped at 1.0)
content_balance = 1.0 if under-represented topic
decay_prevention = days_since_practice / half_life
```

---

## Phase 5: Confidence & Dunning-Kruger

### 5.1 Confidence Data Collection

#### Pre-Answer Confidence (Step 2)

After question displayed, before options shown:

```
UI presents 5-point scale:
1. Not confident (guessing) - ~20% chance I'm right
2. Slightly confident - ~40% chance I'm right
3. Moderately confident - ~60% chance I'm right
4. Confident - ~80% chance I'm right
5. Very confident (almost certain) - ~95% chance I'm right

User selects one (keyboard shortcut: 1-5)

Store:
- pre_confidence: 1-5
- pre_confidence_percentage: 20, 40, 60, 80, 95
- time_to_rate: seconds
```

#### Post-Answer Process Reflection

After user sees result:

**If CORRECT:**
```
"How did you answer this question?"
○ I knew the answer from memory before seeing the options
○ I wasn't sure, but recognized the right answer in the options
○ I narrowed it down and made an educated guess
○ I guessed randomly
```

**If WRONG:**
```
First: Same process reflection as above

Then:
"How difficult was this question for you?"
○ Easy - I thought I knew this (overconfidence!)
○ Moderate - I had to think
○ Hard - I struggled
○ Very hard - I had no idea
```

### 5.2 Calibration Calculation

#### Per-Question Calibration

```
calibration_score = pre_confidence_percentage - (actual_performance × 100)

Examples:
Pre-confidence: 80% (Confident)
Result: Correct (100%)
Calibration: -20 (underconfident)

Pre-confidence: 95% (Very confident)
Result: Wrong (0%)
Calibration: +95 (SEVERE overconfidence - Dunning-Kruger!)

Pre-confidence: 60% (Moderately confident)
Result: Partial (67%)
Calibration: -7 (well-calibrated)
```

#### Aggregate Calibration Metrics

```
Overall calibration:
= Average(calibration_scores over last 50 questions)

Per-topic calibration:
= Average(calibration_scores for topic, last 20 questions)

Per-Bloom-level calibration:
= Average(calibration_scores at level, last 20 questions)

Time-of-day calibration:
Morning avg: +0.5 (overconfident)
Post-lunch avg: -0.3 (underconfident)

Calibration quality:
Excellent: ±5
Good: ±10
Moderate: ±15
Poor: ±25
Severe: >±30 (Dunning-Kruger)
```

### 5.3 Dunning-Kruger Detection & Intervention

#### Pattern Detection

Trigger Dunning-Kruger alert when:

```
1. Persistent overconfidence in topic:
   Last 10 questions: avg calibration > +20
   Pattern: High confidence → Wrong answers

2. Level-specific overconfidence:
   User at L3: avg calibration > +15
   Attempting unlock but overconfident

3. "Easy difficulty" + Wrong answer:
   User rates "Easy - I thought I knew this"
   But answers wrong
   Frequency > 30% of wrong answers

4. Confidence not decreasing after failures:
   Gets 3 wrong in a row
   But confidence stays "Very confident (95%)"
```

#### Intervention Strategies

**Soft intervention (calibration +15 to +25):**
```
- Show calibration feedback after each question
- "You rated 80% confidence but answered incorrectly.
   This suggests overconfidence in this topic."
- Visual: Show calibration graph
```

**Medium intervention (calibration +25 to +35):**
```
- Require calibration training module (5 minutes)
- Show examples of well-calibrated vs. overconfident
- Practice estimating confidence
- Don't allow level unlock until improves
```

**Strong intervention (calibration > +35):**
```
- Block advancement to next Bloom's level
- Require foundation review
- Message: "Your confidence exceeds ability by 35+ points.
   Let's strengthen fundamentals."
- Schedule diagnostic questions
```

**At level unlock gate:**
```
User reaches 65% Apply mastery but calibration +30

System: "You've reached the mastery threshold, but your
confidence accuracy suggests you may not be ready.
Complete 10 more questions with calibration <±15 to unlock."
```

---

## Phase 6: Generation Effect (Levels 3-6)

### 6.1 Typed Answer Collection

#### When to Require Typing

```
Level 1 (Remember): NO typing (MCQ only)
  - Goal: Rapid fact acquisition

Level 2 (Understand): NO typing (MCQ only)
  - Goal: Build conceptual framework quickly

Level 3 (Apply): CONDITIONAL typing
  - If pre-confidence ≥ 80%: Require typing ("Prove it!")
  - If pre-confidence < 80%: Skip typing
  - Text field: "Type your answer (1-2 sentences)"

Level 4 (Analyze): REQUIRED typing
  - Always show text field
  - "Analyze this scenario (2-3 sentences)"

Level 5 (Evaluate): REQUIRED typing
  - "Evaluate and justify (3-4 sentences)"

Level 6 (Create): REQUIRED typing
  - "Design a solution (paragraph)"
```

#### UI Workflow with Typing

Levels 3-6:

```
Step 1: Question displayed (no options)
Step 2: Pre-confidence rating
Step 3: Typed answer field
  - Character limits:
    L3: 50-200 chars
    L4: 100-400 chars
    L5: 150-600 chars
    L6: 200-1000 chars
  - Allow skip button

Step 4: Options revealed
Step 5: User selects from options
Step 6: Feedback shown
Step 7: Post-process reflection
```

### 6.2 Typed Answer Evaluation

#### Fuzzy Matching Algorithm

```
Compare typed answer to correct answer:

1. Exact match (case-insensitive):
   typed: "GCM", correct: "gcm" → 100%

2. Semantic equivalence:
   typed: "Galois Counter Mode", correct: "GCM" → 100%

3. Partial match (Levenshtein distance):
   typed: "aes-gcm mode", correct: "GCM" → 80%

4. Concept extraction (NLP):
   typed: "mode that provides authentication with encryption"
   correct: "GCM" → 60%

5. Keyword scoring:
   typed: "AES with authenticated encryption"
   keywords: ["AES", "authenticated", "encryption"] → 40%

Final match score = MAX(all strategies)
```

#### Match Score Interpretation

```
90-100%: Perfect recall (strong mastery)
70-89%: Good recall (mostly correct)
50-69%: Partial recall (significant gaps)
25-49%: Weak recall (major gaps)
0-24%: No recall (no knowledge)
```

### 6.3 Generation Effect Impact

#### Performance Score Calculation

```
For L3-L6 (with typing):
performance = (typed_match_score × 0.6) + (selected_correct × 0.4)

Typed answer weighted MORE (60%) - generation is primary
Selected answer weighted LESS (40%) - recognition is secondary

Examples:

Scenario 1: Perfect generation
typed: 100%, selected: Correct
performance = 1.0
Bonus: +0.2 generation effect multiplier
Final: 1.2 (extra credit!)

Scenario 2: Typed wrong, selected correct
typed: 0%, selected: Correct
performance = 0.4
Interpretation: Recognition only
IRT update: Small (+0.03)

Scenario 3: Partial typed, correct selected
typed: 60%, selected: Correct
performance = 0.76
IRT update: Moderate (+0.08)
```

#### Recall vs. Recognition Tracking

```
Track two memory strengths:
- recall_strength: float (from typed answers)
- recognition_strength: float (from selected answers)
- last_recall_success: timestamp
- last_recognition_success: timestamp

Decay rates:
- Recall: half-life = 18 days (decays faster)
- Recognition: half-life = 35 days (decays slower)

FSRS scheduling uses WEAKER strength:
next_review = MIN(recall_next_review, recognition_next_review)
```

---

## Phase 7: Bayesian Inference & Pattern Learning

### 7.1 Pattern Types to Detect

#### Topic Correlation Patterns

```
Detect: "When user misses Topic A, they also miss Topic B"

Algorithm:
1. Track co-occurrence for each topic pair
2. Calculate correlation coefficient
3. If |correlation| > 0.7 AND sample_size > 20: Store pattern

Example:
{
  "source_topic": "Risk Assessment",
  "target_topic": "Control Selection",
  "correlation": 0.90,
  "sample_size": 47,
  "interpretation": "Missing Risk Assessment predicts missing Control Selection"
}

Usage:
- When user fails Risk Assessment:
  → Schedule diagnostic Control Selection question
  → Alert: "These topics are related for you"
```

#### Learning Style Patterns

```
Detect: "User learns better with visual examples vs. text"

Track:
- has_visual: boolean
- success_with_visual vs. success_without_visual

If difference > 0.15:
→ Pattern: "Needs visual examples"

Example:
{
  "visual_success_rate": 0.83,
  "text_only_success_rate": 0.61,
  "difference": 0.22,
  "recommendation": "Prioritize questions with diagrams"
}

Usage:
- Question selection: Boost visual questions
- Feedback: "You learn 22% better with visuals!"
```

#### Time-of-Day Patterns

```
Track performance by time:
- morning_performance: 0.85
- evening_performance: 0.72
- morning_confidence_bias: +0.5
- evening_confidence_bias: -0.3

Usage:
- Adjust confidence interpretation
  Morning 80% → Interpret as 75%
- Schedule reviews for best times
- FSRS: Extend morning intervals
```

#### Prerequisite Chain Patterns

```
Detect: "Failing Topic A at L3 predicts failing Topic B at L2"

If p(fail_B_L2 | fail_A_L3) > 0.70:
→ Pattern discovered

Usage:
- When user fails Network Security (L3):
  → Present OSI Model (L2) diagnostic
  → If fails: "Root cause found!"
```

#### Learning Velocity Patterns

```
Track per topic:
- questions_to_mastery
- time_to_mastery
- learning_velocity: mastery_gain / day

Example:
Encryption: 7.5% per day (fast)
Compliance: 2.7% per day (slow, 3x slower)

Usage:
- Set realistic expectations
- Adjust scheduling
```

### 7.2 Bayesian Prior Updates

#### IRT Theta Priors with Correlations

```
Standard: theta_TopicB ~ Normal(theta_overall, 0.5)

Bayesian enhanced (with correlations):
If TopicA correlates with TopicB (r=0.85):

  theta_TopicB_prior = weighted_average(
    theta_overall,              weight=0.3
    theta_domain,               weight=0.3
    theta_TopicA × correlation, weight=0.4
  )

Example:
- theta_overall = 0.3
- theta_Hashing = 0.9
- Pattern: Hashing ↔ PKI (r=0.80)

theta_PKI_prior = 0.56 (much better than 0.3!)
```

#### FSRS Stability with Time-of-Day

```
Standard: next_review = now + stability

Bayesian (with time pattern):
If morning retention = 85%, evening = 72%:

  If morning review:
    adjusted_stability = stability × 1.09

  If evening review:
    adjusted_stability = stability × 0.92

Personalizes FSRS to circadian patterns!
```

### 7.3 Pattern Discovery Algorithm

#### Continuous Learning Process

```
Background job (runs after each session):
1. Collect recent data
2. Update pattern statistics
3. Re-calculate confidences
4. Detect new patterns (confidence > 0.70, n > 20)
5. Invalidate broken patterns (confidence < 0.50)

Pattern lifecycle:
Emerging (0.50-0.70): Collecting evidence
Established (0.70-0.90): Used for recommendations
Strong (0.90+): Used for critical decisions
Broken (<0.50): Discard
```

---

## Phase 8: Adaptive Question Selection

### 8.1 Session Structure

#### 30-Question Session Plan

```
Phase 1: Foundation Check (10% - 3 questions)
Source: FSRS reviews from L1-L2
Purpose: Ensure foundation solid
Urgency: Overdue or stability < 3 days

Phase 2: Current Level Practice (65% - 20 questions)
Source: Current Bloom's level
Purpose: Main growth happens here
Selection: IRT-matched (theta ± 0.3)

Phase 3: Skill Maintenance (10% - 3 questions)
Source: Same level, different topics
Purpose: Prevent decay in inactive areas
Selection: Not practiced in 7+ days

Phase 4: Bridge Questions (10% - 2 questions)
Source: Between current and next level
Purpose: Preview, build confidence

Phase 5: Stretch Goals (5% - 2 questions)
Source: Current level, high difficulty
Purpose: Challenge, test upper limits
Selection: difficulty = theta + 0.5
```

#### Adaptive Adjustments

```
If struggling (accuracy < 50%):
  - Increase Phase 1 to 15% (more foundation)
  - Lower difficulty: theta - 0.2
  - Skip Phase 4 (not ready)

If excelling (accuracy > 85%):
  - Reduce Phase 1 to 5% (foundation solid)
  - Increase Phase 4 to 15% (accelerate)
  - Raise difficulty: theta + 0.2

If near unlock (mastery 63%, need 65%):
  - Increase Phase 2 to 75% (push for unlock)
  - Increase Phase 4 to 15% (prepare)
```

### 8.2 Multi-Criteria Selection

#### Scoring Function

```
For each candidate question:

score = (irt_information × 0.25)
      + (bloom_relevance × 0.30)
      + (fsrs_urgency × 0.20)
      + (content_balance × 0.15)
      + (decay_prevention × 0.10)

Randomization:
Add noise: score × uniform(0.9, 1.1)
```

---

## Phase 9: User Interface & Workflow

### 9.1 Question Flow (Levels 1-2)

**Simple, fast workflow:**

```
┌─────────────────────────────────────┐
│ Question 15/30                      │
│ Topic: Cryptography - Level 1       │
│                                     │
│ What does AES stand for?            │
│                                     │
│ ○ Advanced Encryption Standard      │
│ ○ Asymmetric Encryption System      │
│ ○ Automated Encryption Service      │
│ ○ Advanced Encryption Suite         │
│                                     │
│          [Submit Answer]             │
└─────────────────────────────────────┘

Time per question: ~5 seconds
```

### 9.2 Question Flow (Levels 3-6)

**Enhanced workflow with typing:**

```
Step 1: Question Display
┌─────────────────────────────────────┐
│ Question 15/30                      │
│ Topic: Cryptography - Level 3       │
│                                     │
│ Your company transmits sensitive    │
│ healthcare data. Which encryption   │
│ mode provides BOTH confidentiality  │
│ and authentication?                 │
│                                     │
│          [Continue]                  │
└─────────────────────────────────────┘

Step 2: Confidence Rating
┌─────────────────────────────────────┐
│ Before seeing the options,          │
│ how confident are you?              │
│                                     │
│ ○ Not confident (~20%)              │
│ ○ Slightly confident (~40%)         │
│ ● Moderately confident (~60%)       │
│ ○ Confident (~80%)                  │
│ ○ Very confident (~95%)             │
│                                     │
│     [Continue to Answer]             │
└─────────────────────────────────────┘

Step 3: Typed Answer (L3+)
┌─────────────────────────────────────┐
│ Type your answer:                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ GCM mode                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Continue to Options] or [Skip]     │
└─────────────────────────────────────┘

Step 4: Options Revealed
┌─────────────────────────────────────┐
│ You typed: "GCM mode"               │
│                                     │
│ Select the best answer:             │
│ ○ CBC (Cipher Block Chaining)       │
│ ○ ECB (Electronic Codebook)         │
│ ● GCM (Galois/Counter Mode)         │
│ ○ CTR (Counter Mode)                │
│                                     │
│          [Submit Answer]             │
└─────────────────────────────────────┘

Step 5: Feedback
┌─────────────────────────────────────┐
│ ✓ Correct!                          │
│                                     │
│ Your typed answer: "GCM mode" ✓     │
│ Match quality: 95% (excellent!)     │
│                                     │
│ Confidence: 60% | Performance: 100% │
│ Calibration: -40 (underconfident)   │
│                                     │
│ 💡 You knew more than you thought!  │
│                                     │
│ [Detailed Explanation]              │
└─────────────────────────────────────┘

Step 6: Process Reflection
┌─────────────────────────────────────┐
│ How did you answer this?            │
│                                     │
│ ● I knew it from memory             │
│ ○ I recognized it in options        │
│ ○ I made an educated guess          │
│ ○ I guessed randomly                │
│                                     │
│          [Next Question]             │
└─────────────────────────────────────┘

Time per question: ~20-25 seconds
```

### 9.3 Progress Dashboard

```
┌────────────────────────────────────────────────┐
│  📊 Your Learning Progress                     │
│                                                │
│  Cryptography Fundamentals                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                │
│  ✓ L1 Remember    [████████████] 92%  Mastered│
│  ✓ L2 Understand  [██████████░░] 86%  Profic. │
│  ⚡ L3 Apply       [████████░░░░] 64%  Develop.│
│     Progress: +8% this week                    │
│     Unlock: 1% away! (~3 questions)            │
│  🔒 L4 Analyze    [██░░░░░░░░░░] 15%  Locked  │
│  🔒 L5 Evaluate   [░░░░░░░░░░░░]  0%  Locked  │
│  🔒 L6 Create     [░░░░░░░░░░░░]  0%  Locked  │
│                                                │
│  Foundation Health                             │
│  L1: Stable (avg stability: 65 days) ✓        │
│  L2: Stable (avg stability: 42 days) ✓        │
│                                                │
│  IRT Ability Estimates                         │
│  L1: θ=1.8 (Advanced)                          │
│  L2: θ=1.5 (Advanced)                          │
│  L3: θ=0.5 (Intermediate)                      │
│                                                │
│  Metacognitive Health                          │
│  Calibration: +5 (Excellent!) ✓               │
│  Trend: Improving                              │
│                                                │
│  Next Session (30 questions):                  │
│  • 3 Foundation reviews                        │
│  • 20 Apply practice                           │
│  • 5 Bridges to Analyze                        │
│  • 2 Challenge questions                       │
│                                                │
│        [Start Session]                         │
└────────────────────────────────────────────────┘
```

---

## Phase 10: System Coordination

### 10.1 After-Question Update Pipeline

After user completes question:

```
Input collected:
- pre_confidence: 1-5
- typed_answer: text (nullable)
- selected_answer: string
- correct: boolean
- partial_credit: float
- post_process: enum
- time_to_answer: int seconds

Step 1: Calculate derived metrics
- typed_match_score
- calibration_score
- performance_score

Step 2: Update IRT theta
- Get current theta
- Calculate expected performance
- Update theta + confidence_interval

Step 3: Update Bloom's mastery
- Calculate weighted score
- Update rolling average
- Check unlock requirements
- Apply decay to other levels

Step 4: Update/Create FSRS card
- Calculate rating
- Update stability/difficulty
- Calculate next review

Step 5: Update confidence tracking
- Store calibration
- Update rolling averages
- Check Dunning-Kruger patterns

Step 6: Update Bayesian patterns
- Add data point
- Update correlations
- Update time-of-day patterns
- Re-calculate confidences

Step 7: Hierarchical propagation
- Propagate UP (topic → domain → overall)
- Propagate ACROSS (related levels)
- Propagate via CORRELATIONS

Step 8: Check milestones
- Level unlock ready?
- Achievement unlocked?
- Foundation decay?
- Intervention needed?

Step 9: Log response record
- Store complete record
- Update statistics

All in <100ms (user doesn't wait)
```

### 10.2 Session Start Algorithm

```
When user starts session:

Step 1: Load user state
- Bloom's levels
- IRT theta estimates
- FSRS cards due
- Calibration metrics
- Bayesian patterns

Step 2: Check foundation health
- Calculate decay
- Update mastery with decay
- Count low-stability cards
- Flag issues

Step 3: Determine session structure
- Foundation issues? More Phase 1
- Near unlock? More Phase 2
- Excelling? More Phase 4
- Struggling? Lower difficulty

Step 4: Build question pool
- FSRS cards due
- Current-level questions
- Maintenance questions
- Bridge questions
- Stretch questions

Step 5: Score and rank
- Multi-criteria scoring
- Bayesian pattern adjustments
- Add randomization
- Sort by score

Step 6: Select final 30
- Ensure phase proportions
- Ensure content balance
- Avoid repetition
- Ensure variety

Step 7: Pre-compute metadata
- Pre-load content
- Calculate expected performance
- Prepare feedback
- Ready UI

Session ready → Begin!
```

---

## Phase 11: Day 1 vs Day 50 Comparison

### Day 1: Cold Start

```
User: Sarah (new user)

Bloom's Status:
All topics:
- L1: Unlocked, 0% mastery
- L2-L6: Locked, 0% mastery

IRT Ability:
All [topic][level]:
- theta: 0.0 (neutral prior)
- confidence_interval: 1.0 (maximum uncertainty)

Bayesian Patterns:
- No patterns (no data)
- Using population defaults

FSRS:
- No cards yet
- Default parameters

Confidence:
- No calibration data

Question Selection:
- Random L1 questions
- Medium difficulty (d ≈ 0.0)
- Building baseline

Session 1:
- 30 L1 questions (broad sampling)
- Mix of all topics
- Establish baseline
```

### Day 50: Mature System

```
User: Sarah (after 50 days, ~1200 questions)

Bloom's Status:

Networking:
- L1: 87% (Mastered)
- L2: 73% (Proficient)
- L3: 58% (Developing)
- L4: Locked

Encryption:
- L1: 92% (Mastered)
- L2: 88% (Mastered)
- L3: 76% (Proficient)
- L4: 45% (Unlocked!)

Compliance:
- L1: 68% (Proficient)
- L2: 51% (Emerging)
- L3: Locked

Attacks:
- L1: 91% (Mastered)
- L2: 85% (Mastered)
- L3: 72% (Proficient)
- L4: 55% (Unlocked)

IRT Ability Matrix:
           L1    L2    L3    L4
Networking θ=0.5  0.2   0.0  -0.3
Encryption θ=0.8  0.6   0.3   0.1
Compliance θ=-0.2 -0.4 -0.6   N/A
Attacks    θ=0.7  0.7   0.5   0.4

Overall: θ = 0.4 (above average)

Bayesian Patterns:

1. Topic Correlations:
   - Risk Assessment ↔ Control Selection (r=0.90)
   - Linux Commands ↔ Log Analysis (r=0.85)
   - Network Security L3 fail → OSI Model L2 fail (p=0.76)

2. Learning Styles:
   - Visual examples: +22% success
   - Scenario-based: +15% vs memorization
   - Concrete > Abstract

3. Time-of-Day:
   - Morning: 85% retention, +0.5 overconfidence
   - Post-lunch: 72% retention, -0.3 underconfidence
   - Monday: +20% long-term retention

4. Topic Velocity:
   - Encryption: 7.5% mastery/day (fast)
   - Compliance: 2.7% mastery/day (slow)
   - Networking: 4.2% mastery/day (moderate)

Confidence Calibration:
Overall: +0.92 (Excellent!)

By time:
- Morning: +0.5 (overconfident)
- Post-lunch: -0.3 (underconfident)

By topic:
- Encryption: +2 (well-calibrated)
- Physical Security: +12 (overconfident)
- Cloud Security: -8 (underconfident)

By level:
- L1: +2
- L2: -3
- L3: +8 (getting overconfident)
- L4: +15 (Dunning-Kruger emerging!)

Trend: Improving! (was +18, now +0.92)

FSRS Optimization:
347 cards created
Personalized parameters fitted

Interval patterns:
- L1: 1→3→9→27 days (faster than default)
- L2: 2→5→12→30 days
- L3+: 1→4→10→25 days

Time adjustments:
- Morning: +9% intervals (better retention)
- Evening: -8% intervals (worse retention)

Cards by stability:
- <7 days: 67 (19%)
- 7-30 days: 152 (44%)
- 30-60 days: 89 (26%)
- >60 days: 39 (11%)

Due today: 12 cards

Session Plan:
- 2 Foundation reviews (L1-L2)
- 22 Current practice
  * 10 Encryption L4 (Analyze)
  * 8 Networking L3 (push to unlock)
  * 4 Attacks L3 (maintain)
- 3 Maintenance
- 3 Bridge questions

Personalized:
- Morning schedule (best time)
- Visual questions (learning style)
- Confidence adjustment (-0.5 for morning)
- High difficulty for Encryption (θ=0.8)
- Low difficulty for Compliance (θ=-0.2)
```

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- Database schema
- Basic Bloom's tracking
- Simple IRT (single dimension)
- FSRS integration (default params)
- Confidence collection
- Basic question selection

### Phase 2: Progressive Learning (Weeks 5-8)
- Multidimensional IRT
- Bloom's unlock gates
- Skill decay modeling
- Foundation checks
- Generation effect (typing)
- Enhanced selection

### Phase 3: Metacognition (Weeks 9-12)
- Dunning-Kruger detection
- Calibration tracking
- Intervention strategies
- Process reflection
- Behavioral analysis

### Phase 4: Personalization (Weeks 13-16)
- Bayesian pattern detection
- FSRS personalization
- Time-of-day adjustments
- Learning style adaptation
- Topic correlations

### Phase 5: Optimization (Weeks 17-20)
- Hierarchical propagation
- Advanced scoring
- Adaptive sessions
- Performance tuning
- Dashboard visualization

---

## Key Metrics to Track

### Learning Progress
- Bloom's mastery % per topic/level
- IRT theta estimates
- Level unlock milestones
- Time to mastery

### Retention
- FSRS stability averages
- Cards due vs overdue
- Foundation health score
- Review completion rate

### Metacognition
- Confidence calibration score
- Dunning-Kruger incidents
- Calibration improvement trend
- Self-awareness metrics

### Personalization
- Bayesian pattern count
- Pattern confidence scores
- Learning velocity by topic
- Optimal study times

### Engagement
- Session completion rate
- Return rate
- Questions per session
- Plateau duration

---

## Success Criteria

### System Goals
1. ✅ Users progress through Bloom's levels steadily
2. ✅ Foundation remains solid (FSRS stability high)
3. ✅ Confidence calibrates over time (toward ±5)
4. ✅ Bayesian patterns discovered (4+ high-confidence patterns)
5. ✅ Time to mastery predictable and optimized

### User Experience Goals
1. ✅ Clear visibility of progress
2. ✅ Sense of forward momentum
3. ✅ Achievable but challenging questions
4. ✅ No unexpected regressions
5. ✅ Personalized learning path

---

## Conclusion

This implementation plan creates a comprehensive **progressive learning system** that:

- **Structures learning** through Bloom's Taxonomy (Remember → Create)
- **Maintains foundations** through FSRS spaced repetition
- **Matches challenge** through multidimensional IRT
- **Develops metacognition** through confidence tracking
- **Deepens encoding** through generation effect (typing)
- **Personalizes experience** through Bayesian pattern learning

The system evolves from a cold start (Day 1) to a deeply personalized learning engine (Day 50+) that understands each user's unique patterns and optimizes their path from novice to expert.

**Ultimate goal achieved:** Progressive learning with sustained momentum, solid foundations, and measurable advancement toward mastery. 🚀

---

*Built with ❤️ for adaptive learning and mastery*
