import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { VerifyAnswerSchema, safeValidateRequestBody } from '@/lib/apiValidation';
import { calculatePartialCredit } from '@/lib/irt';
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

      // Calculate partial credit for multiple-response using IRT function
      if (isCorrect) {
        // Full credit
        pointsEarned = question.maxPoints || 10;
      } else {
        // Use the centralized partial credit calculation from lib/irt.ts
        pointsEarned = calculatePartialCredit(
          userAnswers,
          correctAnswers,
          question.options.length, // Total number of options
          question.maxPoints || 10
        );
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

    // Return verification result WITH correct answer and full explanation
    // User has already submitted their answer, so they should see the correct answer and learn
    return NextResponse.json({
      isCorrect,
      pointsEarned,
      maxPoints: question.maxPoints || 10,
      // Return correct answer so UI can highlight correct/incorrect options
      correctAnswer: question.correctAnswer,
      // Return full explanation for learning (whether correct or incorrect)
      explanation: question.explanation,
      // Return incorrect explanations so "Why Other Answers Are Incorrect" section can be shown
      incorrectExplanations: question.incorrectExplanations,
      // Return question text and options for display
      question: question.question,
      options: question.options,
      // Return sanitized question data for display
      questionData: {
        id: question.id,
        topics: question.topics,
        difficulty: question.difficulty,
        questionType: question.questionType,
        irtDifficulty: question.irtDifficulty,
        irtDiscrimination: question.irtDiscrimination,
        questionCategory: question.questionCategory,
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
