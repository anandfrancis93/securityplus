import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { estimateAbilityWithError, calculatePartialCredit } from '@/lib/irt';
import { updateMetadataAfterQuiz, ensureMetadataInitialized, syncTopicPerformanceToUserProgress } from '@/lib/fsrsMetadataUpdate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log(`[RECALCULATE] Starting recalculation for user ${userId}`);

    const userRef = adminDb.collection('users').doc(userId);

    // Fetch all quiz history from subcollection (using 'quizzes' to match lib/db.ts)
    const quizHistorySnapshot = await userRef
      .collection('quizzes')
      .orderBy('startedAt', 'asc')
      .get();

    let quizHistory = quizHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    console.log(`[RECALCULATE] Found ${quizHistory.length} quizzes to process`);

    if (quizHistory.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No quiz history to recalculate',
      });
    }

    // Recalculate partial credit scores for all multiple-response questions
    let recalculatedCount = 0;
    const batch = adminDb.batch();

    for (const quiz of quizHistory) {
      let quizUpdated = false;
      let newTotalPoints = 0;
      let newMaxPoints = 0;

      const updatedQuestions = (quiz.questions || []).map((attempt: any) => {
        const question = attempt.question;

        // Recalculate partial credit for multiple-response questions that aren't fully correct
        if (question.questionType === 'multiple' && !attempt.isCorrect && Array.isArray(attempt.userAnswer)) {
          const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
          const userAnswers = attempt.userAnswer;
          const totalOptions = question.options?.length || 4;

          // Recalculate using correct formula
          const newPointsEarned = calculatePartialCredit(
            userAnswers,
            correctAnswers,
            totalOptions,
            attempt.maxPoints || question.maxPoints || 10
          );

          if (newPointsEarned !== attempt.pointsEarned) {
            console.log(`[RECALCULATE] Quiz ${quiz.id}, Question ${question.id}: ${attempt.pointsEarned} → ${newPointsEarned} points`);
            quizUpdated = true;
            recalculatedCount++;

            newTotalPoints += newPointsEarned;
            newMaxPoints += attempt.maxPoints;

            return {
              ...attempt,
              pointsEarned: newPointsEarned
            };
          }
        }

        newTotalPoints += attempt.pointsEarned || 0;
        newMaxPoints += attempt.maxPoints || 0;
        return attempt;
      });

      if (quizUpdated) {
        // Update the quiz document in the batch
        const quizRef = userRef.collection('quizzes').doc(quiz.id);
        batch.update(quizRef, {
          questions: updatedQuestions,
          totalPoints: newTotalPoints,
          maxPoints: newMaxPoints
        });

        // Update the quiz in our local array for subsequent calculations
        const quizIndex = quizHistory.findIndex(q => q.id === quiz.id);
        if (quizIndex !== -1) {
          quizHistory[quizIndex] = {
            ...quiz,
            questions: updatedQuestions,
            totalPoints: newTotalPoints,
            maxPoints: newMaxPoints
          };
        }
      }
    }

    // Commit all quiz updates
    if (recalculatedCount > 0) {
      await batch.commit();
      console.log(`[RECALCULATE] Updated ${recalculatedCount} partial credit scores across ${quizHistory.length} quizzes`);
    } else {
      console.log(`[RECALCULATE] No partial credit scores needed recalculation`);
    }

    // Collect all question attempts (with updated scores)
    const allAttempts = quizHistory.flatMap(quiz => quiz.questions || []);

    // Calculate IRT ability from all attempts
    const { theta, standardError } = estimateAbilityWithError(allAttempts);

    // Calculate basic stats
    const totalQuestions = allAttempts.length;
    const correctAnswers = allAttempts.filter(q => q.isCorrect).length;
    const totalPoints = allAttempts.reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
    const maxPossiblePoints = allAttempts.reduce((sum, q) => sum + (q.maxPoints || 0), 0);

    // Collect unique topics
    const allTopics = new Set<string>();
    allAttempts.forEach(attempt => {
      if (attempt.question?.topics) {
        attempt.question.topics.forEach((topic: string) => allTopics.add(topic));
      }
    });

    // Update main document with recalculated stats
    await userRef.update({
      estimatedAbility: theta,
      abilityStandardError: standardError,
      totalQuestions,
      correctAnswers,
      totalPoints,
      maxPossiblePoints,
      totalTopicsCovered: allTopics.size,
      lastUpdated: Date.now(),
    });

    console.log(`[RECALCULATE] Updated main document with recalculated stats`);

    // Recalculate FSRS metadata by processing quizzes in order
    try {
      // Get current user document to get any existing metadata
      const currentUserDoc = await userRef.get();
      const currentUserData = currentUserDoc.data() as any;

      // Initialize metadata from scratch (or use existing as base)
      let metadata = ensureMetadataInitialized(currentUserData || null);

      // Reset counters since we're recalculating from scratch
      metadata.totalQuizzesCompleted = 0;

      // Reset topic coverage data but keep the topic entries
      // (topicCoverage is initialized by ensureMetadataInitialized with all known topics)
      Object.keys(metadata.topicCoverage).forEach(topicName => {
        metadata.topicCoverage[topicName] = {
          ...metadata.topicCoverage[topicName],
          firstCoveredQuiz: null,
          timesCovered: 0,
          lastCoveredQuiz: null,
        };
      });

      metadata.topicPerformance = {};
      metadata.questionHistory = {};

      // Process each quiz in chronological order to rebuild FSRS state
      for (const quiz of quizHistory) {
        metadata = updateMetadataAfterQuiz(metadata, quiz.questions || []);
      }

      // Sync topic performance to the main document
      const topicPerformance = syncTopicPerformanceToUserProgress(metadata);

      // Save the recalculated metadata and topic performance back to the user document
      await userRef.update({
        quizMetadata: metadata,
        topicPerformance: topicPerformance,
      });

      console.log(`[RECALCULATE] FSRS metadata recalculated from ${quizHistory.length} quizzes`);
    } catch (error) {
      console.error(`[RECALCULATE] Error updating FSRS metadata:`, error);
      // Don't fail the whole operation if FSRS update fails
    }

    console.log(`[RECALCULATE] Recalculation complete for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: recalculatedCount > 0
        ? `Performance data recalculated successfully. Updated ${recalculatedCount} partial credit scores.`
        : 'Performance data recalculated successfully. No partial credit updates needed.',
      stats: {
        totalQuestions,
        correctAnswers,
        estimatedAbility: theta,
        abilityStandardError: standardError,
        partialCreditsUpdated: recalculatedCount,
      },
    });
  } catch (error: any) {
    console.error('Error recalculating progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate progress',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
