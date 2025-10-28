# FSRS Implementation Status

## ✅ Completed (Part 1)

### 1. **FSRS Package Installation**
- Installed `fsrs` npm package (FSRSv4 algorithm)
- Package.json updated with dependency

### 2. **Type Definitions Updated** (`lib/types.ts`)
Added FSRS fields to:

**TopicPerformance:**
```typescript
stability?: number;          // FSRS memory stability (days)
difficulty?: number;         // FSRS difficulty (0-10)
nextReviewQuiz?: number;     // Quiz number when due
lastReviewQuiz?: number;     // Quiz number when last tested
reps?: number;               // Number of reviews
lapses?: number;             // Times forgotten
state?: number;              // FSRS State (0-3)
lastReviewDate?: number;     // Timestamp
isStruggling?: boolean;      // accuracy < 60%
```

**QuestionHistory:**
```typescript
stability?: number;
difficulty?: number;
elapsedDays?: number;
scheduledDays?: number;
reps?: number;
lapses?: number;
state?: number;
lastRating?: number;         // 1=Again, 2=Hard, 3=Good, 4=Easy
nextReviewDate?: number;
nextReviewQuiz?: number;
```

**QuizGenerationMetadata:**
```typescript
currentPhase?: 1 | 2 | 3;              // Learning phase
phase1CompletedAt?: number;             // Quiz number
phase2CompletedAt?: number;             // Quiz number
fsrsParameters?: number[];              // User-specific params
lastParameterUpdate?: number;           // Timestamp
```

### 3. **FSRS Wrapper Module Created** (`lib/fsrsQuiz.ts`)

**Key Functions:**
- `createFSRSScheduler(params?)` - Initialize FSRS with custom or default parameters
- `quizPerformanceToRating(isCorrect)` - Convert quiz result to FSRS rating (1-4)
- `processQuestionReview()` - Update question history with FSRS scheduling
- `processTopicReview()` - Update topic performance with FSRS scheduling
- `getQuestionsDueForReview()` - Get questions ready for review
- `getTopicsDueForReview()` - Get topics ready for review
- `scheduledDaysToQuizOffset()` - Convert FSRS days to quiz intervals
- `quizOffsetToElapsedDays()` - Convert quiz intervals to days

**FSRS Rating System:**
- Wrong answer → Rating.Again (1) → Review next quiz
- Correct answer → Rating.Good (3) → Interval increases (2→4→8→15 quizzes)

**Quiz-to-Days Conversion:**
- Assumes 3.5 quizzes per week (1 quiz every 2 days)
- Customizable per user based on actual quiz frequency

### 4. **Topic Selection with FSRS** (`lib/topicSelectionFSRS.ts`)

**Three-Phase System:**

**Phase 1: Initial Coverage**
- Prioritizes uncovered topics (timesCovered === 0)
- Domain-balanced selection
- 100% new questions
- Transitions when all topics covered once

**Phase 2: Focus on Weak Areas**
- 50% struggling topics (accuracy < 60%)
- 30% learning topics (accuracy 60-79%)
- 20% mastered topics (accuracy ≥ 80%)
- FSRS intervals: 1-15 quizzes based on performance
- Transitions when 70% mastered or 50 quizzes completed

**Phase 3: Maintenance & Mastery**
- 20% struggling topics (if any slip)
- 30% due mastered topics
- 50% random variety
- FSRS intervals: up to 20 quizzes
- Long-term retention focus

**Key Functions:**
- `selectTopicsWithFSRS()` - Main topic selection
- `determineCurrentPhase()` - Auto-detect learning phase
- `selectPhase1Topics()` - Uncovered topic selection
- `selectPhase2Topics()` - Performance-based selection
- `selectPhase3Topics()` - Maintenance selection
- `checkPhaseTransition()` - Detect phase completion

### 5. **Question Generation API Updated** (`app/api/generate-single-question/route.ts`)

**Changes:**
- Retrieves user progress and quiz metadata
- Uses `selectTopicsWithFSRS()` for authenticated users
- Falls back to random selection if FSRS fails or user not authenticated
- Logs current phase and selected topics
- Graceful degradation for errors

**Flow:**
1. Get user progress from Firestore
2. Initialize metadata if not exists
3. Determine current phase
4. Select topics using FSRS
5. Generate question with selected topics
6. Apply similarity checking
7. Save to quiz session

---

## 🚧 In Progress / Remaining (Part 2)

### 6. **Question Repetition System** (Next Task)

**What's Needed:**
- Modify quiz generation to include repeated questions
- Phase 2: 70% new, 30% repeated
- Phase 3: 50% new, 30% repeated, 20% struggling
- Fetch questions from history based on FSRS schedule
- Mix new and repeated questions, then shuffle

**Files to Create/Modify:**
- New file: `lib/questionRepetition.ts`
- Modify: `app/api/generate-single-question/route.ts` (add repetition logic)
- May need: Storage system for full questions (currently only metadata stored)

**Challenges:**
- Need to store full questions with correct answers securely
- Must reconstruct questions from history or regenerate similar ones
- Balance between exact repetition vs. similar question on same concept

### 7. **Metadata Tracking After Quiz Completion** (Pending)

**What's Needed:**
- Update `QuestionHistory` with FSRS data after each question
- Update `TopicPerformance` with FSRS data
- Track phase transitions
- Periodically optimize FSRS parameters based on user history

**Files to Create/Modify:**
- New file: `lib/fsrsMetadataUpdate.ts`
- Modify: Quiz submission endpoint
- Modify: `lib/db.ts` (updateUserProgress with FSRS data)

**Data to Track:**
- Per question: rating, new stability, difficulty, next review date/quiz
- Per topic: accuracy, stability, next review quiz, struggling/mastered status
- Per user: current phase, phase transition dates, custom FSRS parameters

### 8. **Migration Logic for Existing Users** (Pending)

**What's Needed:**
- Initialize FSRS fields for existing users
- Calculate initial phase based on current progress
- Set initial FSRS parameters to defaults
- Populate topic coverage from quiz history
- Calculate initial topic performance metrics

**Files to Create/Modify:**
- New file: `lib/fsrsMigration.ts`
- Script: One-time migration script for existing users
- Or: Runtime migration on first quiz after update

**Migration Tasks:**
- Check if user has `fsrsParameters` field
- If not, initialize all FSRS fields
- Parse existing quiz history
- Calculate topic coverage and performance
- Determine appropriate starting phase
- Set `currentPhase` and initial intervals

### 9. **Testing & Verification** (Pending)

**What to Test:**
- Phase 1: All topics get covered
- Phase 2: Struggling topics appear more frequently
- Phase 3: Long intervals for mastered topics
- FSRS intervals adjust based on performance
- Phase transitions happen correctly
- Migration works for existing users
- Performance (no slowdowns)

**Test Scenarios:**
1. New user: Should start Phase 1, cover all topics
2. Existing user: Should migrate correctly to appropriate phase
3. Wrong answers: Should decrease intervals (appear sooner)
4. Correct answers: Should increase intervals (appear later)
5. Phase transitions: Should detect and log transitions

---

## Implementation Priority

### High Priority (Complete before deploying):
1. ✅ Core FSRS infrastructure (DONE)
2. ⏳ Metadata tracking after quiz completion
3. ⏳ Migration logic for existing users
4. ⏳ Basic testing

### Medium Priority (Can deploy without, add later):
5. Question repetition system (complex, needs storage solution)
6. FSRS parameter optimization (automatic tuning)
7. Advanced analytics and reporting

### Low Priority (Nice to have):
8. Quiz frequency tracking per user
9. Custom interval preferences
10. Export/import FSRS data

---

## Current System Status

**What Works Now:**
✅ New questions use FSRS topic selection
✅ Topics prioritized based on performance
✅ Phase detection works automatically
✅ Uncovered topics get priority in Phase 1
✅ Struggling topics get priority in Phase 2/3

**What's Missing:**
❌ Repeated questions not implemented yet
❌ FSRS metadata not updated after quiz
❌ Existing users not migrated
❌ No testing done yet

---

## Next Steps (Recommended Order)

1. **Metadata Tracking** (Critical)
   - Without this, FSRS data never updates
   - Topics won't progress through phases
   - Implement in quiz submission endpoint

2. **Migration Logic** (Critical)
   - Existing users won't benefit without migration
   - Run once on deployment or per-user on first quiz
   - Initialize FSRS fields from existing data

3. **Testing** (Critical)
   - Verify phase detection works
   - Verify topic selection works
   - Check for errors in production

4. **Question Repetition** (Enhancement)
   - Can be added later after core system stable
   - Requires design decision on question storage
   - Complex but high-value feature

---

## Deployment Checklist

Before deploying to production:

- [ ] Test with at least 3 sample users (new, existing low, existing high)
- [ ] Verify no errors in FSRS topic selection
- [ ] Confirm fallback to random works if FSRS fails
- [ ] Test migration script on copy of production data
- [ ] Add monitoring/logging for phase transitions
- [ ] Document new fields in Firestore schema
- [ ] Update API documentation
- [ ] Create rollback plan if issues arise

---

**Last Updated**: 2025-01-28
**Status**: Part 1 Complete (50% of core implementation)
**Next Task**: Metadata tracking after quiz completion
