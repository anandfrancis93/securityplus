import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisQuestion } from '@/lib/questionGenerator';

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const { excludeTopics = [], questionNumber = 1 } = await request.json();

    // Define question configurations based on typical distribution
    const questionConfigs = [
      { difficulty: 'easy' as const, type: 'single' as const },      // Q1
      { difficulty: 'easy' as const, type: 'single' as const },      // Q2
      { difficulty: 'easy' as const, type: 'single' as const },      // Q3
      { difficulty: 'medium' as const, type: 'single' as const },    // Q4
      { difficulty: 'medium' as const, type: 'single' as const },    // Q5
      { difficulty: 'medium' as const, type: 'multiple' as const },  // Q6
      { difficulty: 'medium' as const, type: 'multiple' as const },  // Q7
      { difficulty: 'hard' as const, type: 'single' as const },      // Q8
      { difficulty: 'hard' as const, type: 'single' as const },      // Q9
      { difficulty: 'hard' as const, type: 'multiple' as const },    // Q10
    ];

    // Shuffle to randomize order
    const shuffledConfigs = shuffleArray(questionConfigs);

    // Use modulo to cycle through configs if questionNumber > 10
    const configIndex = (questionNumber - 1) % shuffledConfigs.length;
    const config = shuffledConfigs[configIndex];

    console.log(`Generating question ${questionNumber}: ${config.difficulty} ${config.type}-choice`);

    const question = await generateSynthesisQuestion(
      excludeTopics,
      config.difficulty,
      config.type
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
