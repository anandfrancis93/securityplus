import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { UserProgress, CachedQuiz, Question } from '@/lib/types';
import { pregenerateQuiz, initializeQuizMetadata } from '@/lib/quizPregeneration';
import { ensureMetadataInitialized, updateMetadataAfterQuiz } from '@/lib/fsrsMetadataUpdate';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { PregenerateQuizSchema, safeValidateRequestBody } from '@/lib/apiValidation';
import { createQuizSession, sanitizeQuestionsForClient } from '@/lib/quizStateManager';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // SECURITY: Validate input
    const validation = safeValidateRequestBody(PregenerateQuizSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { userId, completedQuestions } = validation.data;

    // SECURITY: Authenticate and authorize request
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    console.log(`Pre-generating quiz for user: ${userId}`);

    // Fetch user progress from Firebase
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userProgress = userDoc.data() as UserProgress;

    // Initialize/ensure quiz metadata with FSRS support
    console.log('Ensuring FSRS metadata is initialized');
    userProgress.quizMetadata = ensureMetadataInitialized(userProgress);

    // If completedQuestions provided, update metadata with FSRS tracking
    if (completedQuestions && Array.isArray(completedQuestions)) {
      console.log(`Updating FSRS metadata with ${completedQuestions.length} completed questions`);
      userProgress.quizMetadata = updateMetadataAfterQuiz(
        userProgress.quizMetadata,
        completedQuestions
      );

      // Note: topicPerformance is stored in quizMetadata.topicPerformance
      // We don't sync it to the flat topicPerformance field to avoid Firestore field path issues
    }

    // Pre-generate the next quiz
    console.log('Generating next quiz...');
    const startTime = Date.now();
    const cachedQuiz: CachedQuiz = await pregenerateQuiz(userProgress);
    const generationTime = Date.now() - startTime;

    console.log(`Quiz generated successfully in ${generationTime}ms with ${cachedQuiz.questions.length} questions`);

    // SECURITY: Create server-side quiz session with full questions (including correct answers)
    // Note: cachedQuiz.questions are full Question[] from pregenerateQuiz, cast to handle type
    const fullQuestions = cachedQuiz.questions as Question[];
    const quizSessionId = await createQuizSession(userId, fullQuestions);
    console.log(`Created quiz session ${quizSessionId} with ${fullQuestions.length} questions`);

    // SECURITY: Sanitize questions for client (remove correct answers)
    const sanitizedQuestions = sanitizeQuestionsForClient(fullQuestions);

    // Save cached quiz with sanitized questions and quiz session ID
    const secureCache = {
      ...cachedQuiz,
      questions: sanitizedQuestions, // Questions WITHOUT correct answers
      quizSessionId, // Reference to server-side quiz session
    };

    // Save cached quiz and quiz metadata
    // Note: topicPerformance is already stored in quizMetadata.topicPerformance
    // We don't save it as a flat field to avoid Firestore field path issues with topic names containing special characters
    await userRef.update({
      cachedQuiz: secureCache,
      quizMetadata: userProgress.quizMetadata,
    });

    console.log('Cached quiz saved to Firebase (without correct answers)');

    return NextResponse.json({
      success: true,
      message: 'Quiz pre-generated successfully',
      questionsCount: cachedQuiz.questions.length,
      generationTimeMs: generationTime,
      phase: userProgress.quizMetadata.allTopicsCoveredOnce ? 2 : 1,
      totalQuizzesCompleted: userProgress.quizMetadata.totalQuizzesCompleted,
      quizSessionId, // Return session ID to client
    });
  } catch (error: any) {
    console.error('Error pre-generating quiz:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // Check for specific Google AI API errors
    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: 'Too many requests to the AI service. Please wait a moment and try again.'
        },
        { status: 429 }
      );
    }

    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: 'API authentication error. Please contact support.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to pre-generate quiz',
        details: error?.message || 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
