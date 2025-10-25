import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisQuestion, selectAdaptiveDifficulty, selectQuestionType } from '@/lib/questionGenerator';

export async function POST(request: NextRequest) {
  try {
    const {
      excludeTopics = [],
      questionNumber = 1,
      currentAbility = 0, // Current ability level for adaptive selection
      useAdaptive = false // Whether to use adaptive difficulty selection
    } = await request.json();

    let difficulty: 'easy' | 'medium' | 'hard';
    let questionType: 'single' | 'multiple';

    if (useAdaptive && questionNumber > 1) {
      // Pseudo-Adaptive: Select difficulty based on current ability
      difficulty = selectAdaptiveDifficulty(currentAbility);
      questionType = selectQuestionType();
      console.log(`Adaptive selection for Q${questionNumber}: ability=${currentAbility.toFixed(2)}, difficulty=${difficulty}, type=${questionType}`);
    } else {
      // Fixed distribution for first question or non-adaptive mode
      const questionConfigs = [
        { difficulty: 'easy' as const, type: 'single' as const },
        { difficulty: 'easy' as const, type: 'single' as const },
        { difficulty: 'easy' as const, type: 'single' as const },
        { difficulty: 'medium' as const, type: 'single' as const },
        { difficulty: 'medium' as const, type: 'single' as const },
        { difficulty: 'medium' as const, type: 'multiple' as const },
        { difficulty: 'medium' as const, type: 'multiple' as const },
        { difficulty: 'hard' as const, type: 'single' as const },
        { difficulty: 'hard' as const, type: 'single' as const },
        { difficulty: 'hard' as const, type: 'multiple' as const },
      ];

      const configIndex = (questionNumber - 1) % questionConfigs.length;
      const config = questionConfigs[configIndex];
      difficulty = config.difficulty;
      questionType = config.type;
    }

    console.log(`Generating question ${questionNumber}: ${difficulty} ${questionType}-choice`);

    const question = await generateSynthesisQuestion(
      excludeTopics,
      difficulty,
      questionType
    );

    console.log(`Question ${questionNumber} generated successfully`);

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error(`Error generating question:`, error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      status: error?.status,
      type: error?.type
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

    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return NextResponse.json(
        {
          error: 'Network error',
          details: 'Unable to connect to AI service. Please check your connection and try again.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate question',
        details: error?.message || 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
