# Spaced Repetition System for Quiz Questions

## Overview

This document outlines the enhanced spaced repetition system for quiz questions that prioritizes:
1. **Phase 1**: Cover all uncovered topics across all 5 domains (0 times covered)
2. **Phase 2**: Focus on struggling topics with spaced repetition intervals
3. **Phase 3**: Review mastered topics at optimal intervals to maintain retention

## Current Status vs. Proposed

### Currently Implemented (Partial):
- ✅ Data structures for tracking (QuestionHistory, TopicCoverageStatus)
- ✅ Phase 1/Phase 2 logic in `quizPregeneration.ts`
- ✅ Topic coverage tracking
- ❌ NOT actively used by `generate-single-question` API
- ❌ No performance-based topic prioritization
- ❌ Simple 3-quiz cooldown (not true spaced repetition)

### Proposed Enhancement:
- ✅ Integrate with live question generation
- ✅ Track performance per topic (accuracy, mastery)
- ✅ SM-2 inspired intervals for repeating questions
- ✅ Three-phase system with smooth transitions

## Three-Phase System

### Phase 1: Initial Coverage (Cover All Topics Once)
**Goal**: Expose user to every topic across all 5 domains at least once

**Logic**:
1. Get list of all uncovered topics (timesCovered === 0)
2. Group by domain to ensure balanced coverage
3. Select topics randomly within uncovered pool
4. Prioritize domains with most uncovered topics

**Question Generation**:
- 100% new questions
- Categories: 70% single-topic, 25% multi-topic same domain, 5% cross-domain
- Topics selected from uncovered pool with domain balancing

**Completion Criteria**:
- All topics in `topicCoverage` have timesCovered >= 1
- Set `allTopicsCoveredOnce = true`

---

### Phase 2: Focus on Weak Areas
**Goal**: Reinforce struggling topics with spaced repetition

**Logic**:
1. Calculate performance for each topic:
   ```typescript
   accuracy = correctAnswers / questionsAnswered
   isStruggling = accuracy < 60% && questionsAnswered >= 2
   isMastered = accuracy >= 80% && questionsAnswered >= 3
   ```

2. Prioritize struggling topics for new questions
3. Re-ask questions from struggling topics at calculated intervals

**Question Mix**:
- **60% New questions** (struggle topics prioritized)
  - 50% from topics with accuracy < 60%
  - 50% from topics with accuracy 60-79%
- **30% Repeated questions** (from history)
  - Prioritize questions user got wrong
  - Must respect cooldown intervals
- **10% Mastered review** (maintenance)
  - From topics with accuracy >= 80%

**Interval Calculation** (SM-2 inspired):
```typescript
interface TopicInterval {
  consecutiveCorrect: number;  // Streak of correct answers
  interval: number;             // Quizzes until next review
  lastTested: number;           // Quiz number when last tested
}

function calculateNextInterval(topic: TopicInterval, wasCorrect: boolean): number {
  if (!wasCorrect) {
    // Reset streak, review soon
    topic.consecutiveCorrect = 0;
    return 1; // Next quiz
  }

  // Increase interval based on streak
  topic.consecutiveCorrect++;

  switch (topic.consecutiveCorrect) {
    case 1: return 2;  // 2 quizzes later
    case 2: return 4;  // 4 quizzes later
    case 3: return 8;  // 8 quizzes later
    default: return Math.min(15, topic.consecutiveCorrect * 3);  // Cap at 15
  }
}
```

**Completion Criteria**:
- All topics have accuracy >= 60%
- OR user has completed 50 quizzes (whichever comes first)
- Transition to Phase 3

---

### Phase 3: Maintenance & Mastery
**Goal**: Maintain mastery of all topics with minimal repetition

**Logic**:
1. Most topics are mastered (accuracy >= 80%)
2. Occasional reviews prevent forgetting
3. Still address any topics that slip below mastery

**Question Mix**:
- **50% New questions** (variety and depth)
  - Random topics across all domains
  - Introduce more synthesis and cross-domain questions
- **30% Repeated questions** (spaced intervals)
  - From questions answered correctly long ago
  - Longer intervals (5-15 quizzes)
- **20% Struggle maintenance** (if any)
  - Any topic that drops below 60% accuracy
  - Shorter intervals (1-3 quizzes)

**Interval Calculation**:
- Same as Phase 2 but with longer maximum intervals (up to 20 quizzes)
- Mastered topics reviewed every 10-15 quizzes
- Struggling topics (if any) reviewed every 1-3 quizzes

---

## Data Structure Enhancements

### Add to `TopicPerformance`:
```typescript
export interface TopicPerformance {
  topicName: string;
  domain: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  lastTested: number;

  // NEW: Spaced repetition fields
  consecutiveCorrect: number;  // Current streak
  nextReviewQuiz: number;      // Quiz number when due for review
  interval: number;            // Current interval (in quizzes)
  isMastered: boolean;         // accuracy >= 80% && questionsAnswered >= 3
  isStruggling: boolean;       // accuracy < 60% && questionsAnswered >= 2
}
```

### Add to `QuestionHistory`:
```typescript
export interface QuestionHistory {
  questionId: string;
  metadata?: { primaryTopic: string; scenario: string; keyConcept: string };
  firstAskedQuiz: number;
  lastAskedQuiz: number;
  timesAsked: number;
  correctHistory: boolean[];
  lastAskedDate: number;

  // NEW: Spaced repetition fields
  nextReviewQuiz: number;      // When this question is due for review
  consecutiveCorrect: number;  // Streak since last wrong answer
  interval: number;            // Current interval (in quizzes)
  difficulty: 'easy' | 'medium' | 'hard';  // Question difficulty
}
```

### Add to `QuizGenerationMetadata`:
```typescript
export interface QuizGenerationMetadata {
  totalQuizzesCompleted: number;
  allTopicsCoveredOnce: boolean;

  // NEW: Phase tracking
  currentPhase: 1 | 2 | 3;
  phase1CompletedAt?: number;  // Quiz number
  phase2CompletedAt?: number;  // Quiz number

  questionHistory: { [questionId: string]: QuestionHistory };
  topicCoverage: { [topicName: string]: TopicCoverageStatus };

  // NEW: Performance tracking
  topicPerformance: { [topicName: string]: TopicPerformance };
}
```

---

## Implementation Steps

### Step 1: Update Type Definitions
- Add new fields to `TopicPerformance`
- Add new fields to `QuestionHistory`
- Add `currentPhase` and phase completion tracking to `QuizGenerationMetadata`

### Step 2: Create Enhanced Topic Selection Logic
File: `lib/topicSelectionSpacedRepetition.ts`

```typescript
/**
 * Select topics based on current phase and performance
 */
export function selectTopicsWithSpacedRepetition(
  metadata: QuizGenerationMetadata,
  questionCategory: QuestionCategory,
  count: number
): string[] {
  const currentQuiz = metadata.totalQuizzesCompleted + 1;

  if (metadata.currentPhase === 1) {
    return selectPhase1Topics(metadata, questionCategory, count);
  } else if (metadata.currentPhase === 2) {
    return selectPhase2Topics(metadata, questionCategory, count);
  } else {
    return selectPhase3Topics(metadata, questionCategory, count);
  }
}

/**
 * Phase 1: Select from uncovered topics with domain balancing
 */
function selectPhase1Topics(
  metadata: QuizGenerationMetadata,
  category: QuestionCategory,
  count: number
): string[] {
  const uncovered = getUncoveredTopics(metadata);

  // Group by domain
  const byDomain = groupTopicsByDomain(uncovered, metadata);

  // Balance across domains (prioritize domains with most uncovered)
  return selectBalancedTopics(byDomain, category, count);
}

/**
 * Phase 2: Prioritize struggling topics
 */
function selectPhase2Topics(
  metadata: QuizGenerationMetadata,
  category: QuestionCategory,
  count: number
): string[] {
  const currentQuiz = metadata.totalQuizzesCompleted + 1;

  // Get topics due for review
  const dueTopics = Object.values(metadata.topicPerformance)
    .filter(tp => tp.nextReviewQuiz <= currentQuiz)
    .sort((a, b) => {
      // Prioritize: struggling > learning > mastered
      if (a.isStruggling && !b.isStruggling) return -1;
      if (!a.isStruggling && b.isStruggling) return 1;

      // Then by how overdue they are
      return a.nextReviewQuiz - b.nextReviewQuiz;
    });

  const selected: string[] = [];

  // Select from due topics
  for (const topic of dueTopics.slice(0, count)) {
    selected.push(topic.topicName);
  }

  // Fill remaining with random topics (if needed)
  while (selected.length < count) {
    const allTopics = Object.keys(metadata.topicPerformance);
    const random = allTopics[Math.floor(Math.random() * allTopics.length)];
    if (!selected.includes(random)) {
      selected.push(random);
    }
  }

  return selected;
}

/**
 * Phase 3: Maintenance with long intervals
 */
function selectPhase3Topics(
  metadata: QuizGenerationMetadata,
  category: QuestionCategory,
  count: number
): string[] {
  // Similar to Phase 2 but with more randomness
  // 50% due topics, 50% random for variety
  // ... implementation
}
```

### Step 3: Update Question Generation API
File: `app/api/generate-single-question/route.ts`

Replace current random topic selection with:
```typescript
import { selectTopicsWithSpacedRepetition } from '@/lib/topicSelectionSpacedRepetition';

// Get user's quiz metadata
const metadata = userProgress.quizMetadata || initializeQuizMetadata();

// Select topics using spaced repetition
const selectedTopics = selectTopicsWithSpacedRepetition(
  metadata,
  questionCategory,
  questionCategory === 'single-domain-single-topic' ? 1 :
  questionCategory === 'single-domain-multiple-topics' ? 3 : 2
);
```

### Step 4: Update Metadata After Each Question
When a question is answered, update:
1. Topic performance (accuracy, streak, next review)
2. Question history (times asked, correct history, next review)
3. Phase progression (check if phase should advance)

### Step 5: Add Question Repetition Logic
File: `lib/questionRepetition.ts`

```typescript
/**
 * Get questions due for repetition based on spaced intervals
 */
export function getQuestionsForRepetition(
  metadata: QuizGenerationMetadata,
  count: number
): string[] {
  const currentQuiz = metadata.totalQuizzesCompleted + 1;

  // Get questions due for review
  const dueQuestions = Object.values(metadata.questionHistory)
    .filter(qh => qh.nextReviewQuiz <= currentQuiz)
    .sort((a, b) => {
      // Prioritize wrong answers
      const aWrong = !a.correctHistory[a.correctHistory.length - 1];
      const bWrong = !b.correctHistory[b.correctHistory.length - 1];

      if (aWrong && !bWrong) return -1;
      if (!aWrong && bWrong) return 1;

      // Then by how overdue
      return a.nextReviewQuiz - b.nextReviewQuiz;
    })
    .slice(0, count)
    .map(qh => qh.questionId);

  return dueQuestions;
}
```

### Step 6: Integrate into Quiz Generation
Modify quiz generation to:
1. Check current phase
2. Determine new vs. repeated question ratio
3. Generate new questions using spaced repetition topic selection
4. Fetch repeated questions from history
5. Mix and shuffle

---

## Testing & Monitoring

### Metrics to Track:
1. **Phase progression**: How many quizzes to complete Phase 1
2. **Topic mastery**: Percentage of topics mastered over time
3. **Retention rate**: Accuracy on repeated questions (should be high)
4. **Coverage balance**: Ensure all domains are covered evenly

### Logging:
```typescript
console.log(`[SPACED REP] Phase ${phase}, Quiz ${quizNum}`);
console.log(`[SPACED REP] Uncovered: ${uncoveredCount}, Struggling: ${strugglingCount}, Mastered: ${masteredCount}`);
console.log(`[SPACED REP] Question mix: ${newCount} new, ${repeatCount} repeated`);
console.log(`[SPACED REP] Topics selected: ${topics.join(', ')}`);
```

---

## Benefits

1. **Complete Coverage**: Every topic guaranteed to be seen at least once
2. **Focused Practice**: More time on weak areas, less on mastered
3. **Long-term Retention**: Spaced intervals prevent forgetting
4. **Adaptive**: System adjusts to your performance automatically
5. **Efficient**: Don't waste time on topics you've mastered

---

## Migration Plan

### For Existing Users:
1. Initialize metadata with current quiz history
2. Calculate topic performance from past quizzes
3. Determine current phase based on coverage
4. Set appropriate intervals for existing questions

### For New Users:
1. Start in Phase 1
2. Initialize all topics with 0 coverage
3. Begin covering all topics systematically

---

**Last Updated**: 2025-01-28
**Status**: Design Complete - Ready for Implementation
