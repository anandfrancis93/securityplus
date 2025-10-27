import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { VerifyAnswerSchema, safeValidateRequestBody } from '@/lib/apiValidation';
import {
  getQuestionFromSession,
  isQuestionAnswered,
  markQuestionAnswered,
} from '@/lib/quizStateManager';

export const dynamic = 'force-dynamic';

/**
 * Verify user's answer to a quiz question
 * SECURITY: Server-side verification prevents answer manipulation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // SECURITY: Validate input
    const validation = safeValidateRequestBody(VerifyAnswerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { userId, quizSessionId, questionId, userAnswer, questionNumber } = validation.data;

    // SECURITY: Authenticate and authorize request
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // SECURITY: Check if question has already been answered (prevent replay attacks)
    const alreadyAnswered = await isQuestionAnswered(userId, quizSessionId, questionId);
    if (alreadyAnswered) {
      return NextResponse.json(
        {
          error: 'Question already answered',
          details: 'This question has already been submitted. Replay attacks are not allowed.',
        },
        { status: 409 }
      );
    }

    // Get question from server-side storage (includes correct answer)
    const question = await getQuestionFromSession(userId, quizSessionId, questionId);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found', details: 'Quiz session or question does not exist' },
        { status: 404 }
      );
    }

    // Verify answer
    let isCorrect: boolean;
    let pointsEarned: number;

    if (question.questionType === 'multiple') {
      // Multiple-response question
      const correctAnswers = question.correctAnswer as number[];
      const userAnswers = userAnswer as number[];

      // Check if arrays are equal (same length and same elements)
      const correctSet = new Set(correctAnswers);
      const userSet = new Set(userAnswers);

      isCorrect =
        correctAnswers.length === userAnswers.length &&
        userAnswers.every(ans => correctSet.has(ans));

      // Calculate partial credit for multiple-response
      if (isCorrect) {
        // Full credit
        pointsEarned = question.maxPoints || 10;
      } else {
        // Partial credit based on intersection
        const correctCount = userAnswers.filter(ans => correctSet.has(ans)).length;
        const incorrectCount = userAnswers.filter(ans => !correctSet.has(ans)).length;
        const missedCount = correctAnswers.length - correctCount;

        // Award points: (correct - incorrect - missed) / total * maxPoints
        // Minimum 0 points
        const ratio = Math.max(
          0,
          (correctCount - incorrectCount - missedCount) / correctAnswers.length
        );
        pointsEarned = Math.round(ratio * (question.maxPoints || 10));
      }
    } else {
      // Single-choice question
      const correctAnswer = question.correctAnswer as number;
      const userAnswerSingle = userAnswer as number;

      isCorrect = correctAnswer === userAnswerSingle;

      // Calculate IRT-based points
      if (isCorrect) {
        pointsEarned = question.maxPoints || 10;
      } else {
        pointsEarned = 0;
      }
    }

    // Mark question as answered to prevent replay attacks
    await markQuestionAnswered(userId, quizSessionId, questionId);

    console.log(
      `Answer verified: user=${userId}, question=${questionId}, correct=${isCorrect}, points=${pointsEarned}/${question.maxPoints}`
    );

    // SECURITY: Return verification result WITHOUT correct answer
    return NextResponse.json({
      isCorrect,
      pointsEarned,
      maxPoints: question.maxPoints || 10,
      // Only include explanation if answer was correct (don't help cheaters)
      explanation: isCorrect ? question.explanation : undefined,
      // Return sanitized question data for display
      questionData: {
        id: question.id,
        topics: question.topics,
        difficulty: question.difficulty,
        questionType: question.questionType,
        irtDifficulty: question.irtDifficulty,
        irtDiscrimination: question.irtDiscrimination,
      },
    });
  } catch (error: any) {
    console.error('Error verifying answer:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error?.message
        : 'An error occurred while verifying the answer';

    return NextResponse.json(
      { error: 'Failed to verify answer', details: errorMessage },
      { status: 500 }
    );
  }
}
