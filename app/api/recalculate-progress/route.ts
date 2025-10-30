import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { estimateAbilityWithError } from '@/lib/irt';
import { updateMetadataAfterQuiz, ensureMetadataInitialized } from '@/lib/fsrsMetadataUpdate';

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

    // Fetch all quiz history from subcollection
    const quizHistorySnapshot = await userRef
      .collection('quizHistory')
      .orderBy('completedAt', 'asc')
      .get();

    const quizHistory = quizHistorySnapshot.docs.map(doc => doc.data());

    console.log(`[RECALCULATE] Found ${quizHistory.length} quizzes to process`);

    if (quizHistory.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No quiz history to recalculate',
      });
    }

    // Collect all question attempts
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
      // First ensure metadata is initialized
      await ensureMetadataInitialized(userId);

      // Process each quiz in chronological order to rebuild FSRS state
      for (const quiz of quizHistory) {
        await updateMetadataAfterQuiz(userId, quiz.questions || []);
      }

      console.log(`[RECALCULATE] FSRS metadata recalculated from ${quizHistory.length} quizzes`);
    } catch (error) {
      console.error(`[RECALCULATE] Error updating FSRS metadata:`, error);
      // Don't fail the whole operation if FSRS update fails
    }

    console.log(`[RECALCULATE] Recalculation complete for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Performance data recalculated successfully',
      stats: {
        totalQuestions,
        correctAnswers,
        estimatedAbility: theta,
        abilityStandardError: standardError,
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
