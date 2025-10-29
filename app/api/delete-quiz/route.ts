import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { estimateAbility, estimateAbilityWithError, calculateIRTScore } from '@/lib/irt';
import { UserProgress } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, quizId } = body;

    if (!userId || !quizId) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'userId and quizId are required' },
        { status: 400 }
      );
    }

    // SECURITY: Authenticate and authorize request
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Get user document
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete quiz from subcollection
    const quizRef = userRef.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    await quizRef.delete();
    console.log(`[DELETE QUIZ] Deleted quiz ${quizId} from subcollection`);

    // Load all remaining quizzes from subcollection
    const quizzesSnapshot = await userRef.collection('quizzes').orderBy('startedAt', 'desc').get();
    const quizHistory: any[] = [];
    quizzesSnapshot.forEach(doc => {
      quizHistory.push(doc.data());
    });

    // Check if this was the last quiz - if so, reset all progress like the reset button does
    if (quizHistory.length === 0) {
      console.log(`[DELETE QUIZ] Last quiz deleted - clearing all progress data`);

      // Clear all progress data (same as reset progress button)
      // Note: quizHistory is not stored in main document anymore (it's in subcollection)
      await userRef.update({
        answeredQuestions: [],
        correctAnswers: 0,
        totalQuestions: 0,
        totalPoints: 0,
        maxPossiblePoints: 0,
        estimatedAbility: 0,
        abilityStandardError: Infinity,
        predictedScore: 0,
        topicPerformance: {}, // Clear topic tracking data
        quizMetadata: null, // Clear quiz metadata
        cachedQuiz: null, // Clear any cached quiz
        lastUpdated: Date.now(),
      });

      console.log(`[DELETE QUIZ] All progress cleared for user ${userId}`);

      return NextResponse.json({
        success: true,
        remainingQuizzes: 0,
        totalQuestions: 0,
        estimatedAbility: 0,
        predictedScore: 0,
        progressCleared: true
      });
    }

    // Recalculate all metrics based on remaining quizzes
    const allAttempts = quizHistory.flatMap((quiz: any) => quiz.questions || []);
    const totalQuestions = allAttempts.length;

    // Recalculate IRT metrics if there are remaining questions
    let estimatedAbility = 0;
    let abilityStandardError = Infinity;
    let predictedScore = 0;

    if (totalQuestions > 0) {
      const abilityResult = estimateAbilityWithError(allAttempts);
      estimatedAbility = abilityResult.theta;
      abilityStandardError = abilityResult.standardError;

      // Calculate predicted score using IRT
      const tempProgress: UserProgress = {
        userId,
        quizHistory,
        answeredQuestions: [],
        correctAnswers: 0,
        totalQuestions,
        totalPoints: 0,
        maxPossiblePoints: 0,
        estimatedAbility,
        abilityStandardError,
        lastUpdated: Date.now(),
      };

      predictedScore = calculateIRTScore(tempProgress);
    }

    // Get answered questions (question IDs)
    const answeredQuestions = allAttempts.map((attempt: any) =>
      attempt.questionId
    ).filter(Boolean);

    // Recalculate all score metrics
    const correctAnswers = allAttempts.filter((attempt: any) => attempt.isCorrect).length;
    const totalPoints = allAttempts.reduce((sum: number, attempt: any) => sum + (attempt.pointsEarned || 0), 0);
    const maxPossiblePoints = allAttempts.reduce((sum: number, attempt: any) => sum + (attempt.maxPoints || 100), 0);

    // Update user document with recalculated metrics
    // Note: quizHistory is not stored in main document (it's in subcollection)
    await userRef.update({
      totalQuestions,
      correctAnswers,
      totalPoints,
      maxPossiblePoints,
      estimatedAbility,
      abilityStandardError,
      predictedScore,
      answeredQuestions,
      lastUpdated: Date.now(),
    });

    console.log(`[DELETE QUIZ] Deleted quiz ${quizId} for user ${userId}`);
    console.log(`[DELETE QUIZ] Remaining quizzes: ${quizHistory.length}, Total questions: ${totalQuestions}`);

    return NextResponse.json({
      success: true,
      remainingQuizzes: quizHistory.length,
      totalQuestions,
      estimatedAbility,
      predictedScore
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to delete quiz:', error);

    // Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error?.message
      : 'An error occurred while deleting the quiz';

    return NextResponse.json(
      {
        error: 'Failed to delete quiz',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
