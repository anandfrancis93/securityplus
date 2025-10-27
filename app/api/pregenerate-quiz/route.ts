import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { UserProgress, CachedQuiz } from '@/lib/types';
import { pregenerateQuiz, initializeQuizMetadata, updateMetadataAfterQuiz } from '@/lib/quizPregeneration';

export async function POST(request: NextRequest) {
  try {
    const { userId, completedQuestions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
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

    // Initialize quiz metadata if it doesn't exist
    if (!userProgress.quizMetadata) {
      console.log('Initializing quiz metadata for new user');
      userProgress.quizMetadata = initializeQuizMetadata();
    }

    // If completedQuestions provided, update metadata first
    if (completedQuestions && Array.isArray(completedQuestions)) {
      console.log(`Updating metadata with ${completedQuestions.length} completed questions`);
      userProgress.quizMetadata = updateMetadataAfterQuiz(
        userProgress.quizMetadata,
        completedQuestions
      );
    }

    // Pre-generate the next quiz
    console.log('Generating next quiz...');
    const startTime = Date.now();
    const cachedQuiz: CachedQuiz = await pregenerateQuiz(userProgress);
    const generationTime = Date.now() - startTime;

    console.log(`Quiz generated successfully in ${generationTime}ms with ${cachedQuiz.questions.length} questions`);

    // Save cached quiz and updated metadata to Firebase
    await userRef.update({
      cachedQuiz: cachedQuiz,
      quizMetadata: userProgress.quizMetadata,
    });

    console.log('Cached quiz saved to Firebase');

    return NextResponse.json({
      success: true,
      message: 'Quiz pre-generated successfully',
      questionsCount: cachedQuiz.questions.length,
      generationTimeMs: generationTime,
      phase: userProgress.quizMetadata.allTopicsCoveredOnce ? 2 : 1,
      totalQuizzesCompleted: userProgress.quizMetadata.totalQuizzesCompleted,
    });
  } catch (error: any) {
    console.error('Error pre-generating quiz:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // Check for specific Anthropic API errors
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
