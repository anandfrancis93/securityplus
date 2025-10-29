/**
 * FSRS Metadata Update Logic
 *
 * Updates quiz metadata and topic performance after each quiz completion
 * Handles FSRS scheduling, phase transitions, and performance tracking
 */

import {
  QuizGenerationMetadata,
  TopicPerformance,
  QuestionAttempt,
  UserProgress,
  TopicCoverageStatus
} from './types';
import { createFSRSScheduler, processTopicReview } from './fsrsQuiz';
import { checkPhaseTransition } from './topicSelectionFSRS';
import { ALL_SECURITY_PLUS_TOPICS } from './topicData';

/**
 * Initialize topic performance for a topic
 */
function initializeTopicPerformance(topicName: string, domain: string): TopicPerformance {
  return {
    topicName,
    domain,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalPoints: 0,
    maxPoints: 0,
    accuracy: 0,
    lastTested: Date.now(),
    isMastered: false,
    // FSRS fields initialized
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    nextReviewQuiz: 0,
    lastReviewQuiz: 0,
    reps: 0,
    lapses: 0,
    state: 0, // New
    lastReviewDate: Date.now(),
    isStruggling: false,
  };
}

/**
 * Initialize quiz metadata if it doesn't exist
 */
export function ensureMetadataInitialized(
  userProgress: UserProgress | null
): QuizGenerationMetadata {
  // Get existing metadata or create new
  const metadata = userProgress?.quizMetadata || {
    totalQuizzesCompleted: userProgress?.quizHistory?.length || 0,
    allTopicsCoveredOnce: false,
    questionHistory: {},
    topicCoverage: {},
    topicPerformance: {},
    currentPhase: 1,
    fsrsParameters: undefined,
    lastParameterUpdate: Date.now(),
  };

  // Ensure required objects exist
  if (!metadata.topicCoverage) {
    metadata.topicCoverage = {};
  }
  if (!metadata.topicPerformance) {
    metadata.topicPerformance = {};
  }
  if (!metadata.questionHistory) {
    metadata.questionHistory = {};
  }

  // Ensure ALL topics from ALL_SECURITY_PLUS_TOPICS are initialized
  // This handles cases where new topics are added or user has old metadata
  Object.entries(ALL_SECURITY_PLUS_TOPICS).forEach(([domain, topics]) => {
    topics.forEach(topicName => {
      // Add missing topic coverage
      if (!metadata.topicCoverage[topicName]) {
        metadata.topicCoverage[topicName] = {
          topicName,
          domain,
          firstCoveredQuiz: null,
          timesCovered: 0,
          lastCoveredQuiz: null,
        };
      }

      // Add missing topic performance
      if (!metadata.topicPerformance![topicName]) {
        // Try to get from old UserProgress.topicPerformance if exists
        const existingPerf = userProgress?.topicPerformance?.[topicName];
        if (existingPerf) {
          metadata.topicPerformance![topicName] = {
            ...existingPerf,
            // Ensure FSRS fields exist
            stability: existingPerf.stability || 0,
            difficulty: existingPerf.difficulty || 0,
            reps: existingPerf.reps || 0,
            lapses: existingPerf.lapses || 0,
            state: existingPerf.state || 0,
            isStruggling: existingPerf.accuracy < 60 && existingPerf.questionsAnswered >= 2,
          };
        } else {
          metadata.topicPerformance![topicName] = initializeTopicPerformance(topicName, domain);
        }
      }
    });
  });

  return metadata;
}

/**
 * Update metadata after quiz completion
 */
export function updateMetadataAfterQuiz(
  metadata: QuizGenerationMetadata,
  questionAttempts: QuestionAttempt[]
): QuizGenerationMetadata {
  const updatedMetadata = { ...metadata };
  const currentQuizNumber = updatedMetadata.totalQuizzesCompleted + 1;
  const fsrsScheduler = createFSRSScheduler(updatedMetadata.fsrsParameters);

  console.log(`[FSRS Update] Processing quiz ${currentQuizNumber} with ${questionAttempts.length} questions`);

  // Ensure topicPerformance exists
  if (!updatedMetadata.topicPerformance) {
    updatedMetadata.topicPerformance = {};
  }

  // Update for each question attempt
  questionAttempts.forEach((attempt) => {
    const { question, isCorrect, pointsEarned, maxPoints } = attempt;

    // Update each topic in the question
    if (question.topics && question.topics.length > 0) {
      question.topics.forEach((topicName) => {
        // Skip invalid topics (null, undefined, empty strings)
        if (!topicName || typeof topicName !== 'string') {
          console.warn(`[FSRS Update] Skipping invalid topic: ${topicName}`);
          return;
        }

        // Skip topics not in our predefined list (should never happen with validation)
        if (!updatedMetadata.topicCoverage[topicName]) {
          console.warn(`[FSRS Update] Skipping unknown topic not in predefined list: ${topicName}`);
          return;
        }

        // Update topic coverage
        const coverage = updatedMetadata.topicCoverage[topicName];
        if (coverage.firstCoveredQuiz === null) {
          coverage.firstCoveredQuiz = currentQuizNumber;
          console.log(`[FSRS Update] First coverage of topic: ${topicName}`);
        }
        coverage.timesCovered += 1;
        coverage.lastCoveredQuiz = currentQuizNumber;

        // Update topic performance
        if (!updatedMetadata.topicPerformance![topicName]) {
          // Initialize if doesn't exist
          const domain = updatedMetadata.topicCoverage[topicName].domain;
          updatedMetadata.topicPerformance![topicName] = initializeTopicPerformance(topicName, domain);
        }

        const topicPerf = updatedMetadata.topicPerformance![topicName];

        // Update basic stats
        topicPerf.questionsAnswered += 1;
        if (isCorrect) {
          topicPerf.correctAnswers += 1;
        }
        topicPerf.totalPoints += pointsEarned;
        topicPerf.maxPoints += maxPoints;
        topicPerf.accuracy = (topicPerf.correctAnswers / topicPerf.questionsAnswered) * 100;
        topicPerf.lastTested = Date.now();

        // Update mastery and struggling status
        topicPerf.isMastered = topicPerf.accuracy >= 80 && topicPerf.questionsAnswered >= 3;
        topicPerf.isStruggling = topicPerf.accuracy < 60 && topicPerf.questionsAnswered >= 2;

        // Update FSRS scheduling for this topic
        const fsrsResult = processTopicReview(
          fsrsScheduler,
          topicPerf,
          isCorrect,
          currentQuizNumber
        );

        // Update topic with FSRS data
        updatedMetadata.topicPerformance![topicName] = fsrsResult.updatedTopic;

        console.log(`[FSRS Update] ${topicName}: ${isCorrect ? 'Correct' : 'Wrong'}, Accuracy: ${topicPerf.accuracy.toFixed(1)}%, Next review: Quiz ${fsrsResult.nextReviewQuiz}, Stability: ${fsrsResult.card.stability.toFixed(1)} days`);
      });
    }

    // Update question history
    if (question.id) {
      if (!updatedMetadata.questionHistory[question.id]) {
        updatedMetadata.questionHistory[question.id] = {
          questionId: question.id,
          metadata: question.metadata,
          firstAskedQuiz: currentQuizNumber,
          lastAskedQuiz: currentQuizNumber,
          timesAsked: 1,
          correctHistory: [isCorrect],
          lastAskedDate: Date.now(),
          // FSRS fields will be added if we implement question repetition
        };
      } else {
        const history = updatedMetadata.questionHistory[question.id];
        history.lastAskedQuiz = currentQuizNumber;
        history.timesAsked += 1;
        history.correctHistory.push(isCorrect);
        history.lastAskedDate = Date.now();
      }
    }
  });

  // Increment quiz counter
  updatedMetadata.totalQuizzesCompleted = currentQuizNumber;

  // Check if all topics covered (Phase 1 completion)
  const allTopicsCovered = Object.values(updatedMetadata.topicCoverage).every(
    (topic) => topic.timesCovered > 0
  );

  if (allTopicsCovered && !updatedMetadata.allTopicsCoveredOnce) {
    updatedMetadata.allTopicsCoveredOnce = true;
    updatedMetadata.phase1CompletedAt = currentQuizNumber;
    console.log(`🎉 [FSRS Update] Phase 1 Complete at Quiz ${currentQuizNumber}! All topics covered.`);
  }

  // Check for phase transitions
  const transition = checkPhaseTransition(updatedMetadata);
  if (transition.shouldTransition && transition.newPhase) {
    const oldPhase = updatedMetadata.currentPhase;
    updatedMetadata.currentPhase = transition.newPhase;

    if (transition.newPhase === 2) {
      updatedMetadata.phase1CompletedAt = currentQuizNumber;
    } else if (transition.newPhase === 3) {
      updatedMetadata.phase2CompletedAt = currentQuizNumber;
    }

    console.log(`🎓 [FSRS Update] Phase Transition: ${oldPhase} → ${transition.newPhase}`);
    console.log(`   ${transition.message}`);
  }

  // Log summary
  const uncoveredCount = Object.values(updatedMetadata.topicCoverage).filter(t => t.timesCovered === 0).length;
  const strugglingCount = Object.values(updatedMetadata.topicPerformance!).filter(t => t.isStruggling).length;
  const masteredCount = Object.values(updatedMetadata.topicPerformance!).filter(t => t.isMastered).length;

  console.log(`[FSRS Update] Quiz ${currentQuizNumber} Summary:`);
  console.log(`  - Phase: ${updatedMetadata.currentPhase}`);
  console.log(`  - Uncovered topics: ${uncoveredCount}`);
  console.log(`  - Struggling topics: ${strugglingCount}`);
  console.log(`  - Mastered topics: ${masteredCount}`);

  return updatedMetadata;
}

/**
 * Sync topic performance to UserProgress.topicPerformance
 * This keeps the user's overall performance in sync with quiz metadata
 */
export function syncTopicPerformanceToUserProgress(
  metadata: QuizGenerationMetadata
): { [topicName: string]: TopicPerformance } {
  return metadata.topicPerformance || {};
}
