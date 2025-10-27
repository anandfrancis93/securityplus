import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisQuestion } from '@/lib/questionGenerator';
import { authenticateRequest } from '@/lib/apiAuth';
import { GenerateQuestionsSchema, safeValidateRequestBody } from '@/lib/apiValidation';

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
    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = safeValidateRequestBody(GenerateQuestionsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { excludeTopics = [] } = validation.data;

    // Define question types (difficulty is derived from category)
    const questionTypes: Array<'single' | 'multiple'> = [
      'single',
      'single',
      'single',
      'single',
      'single',
      'multiple',
      'multiple',
    ];

    // Pick a random type for the first question
    const shuffledTypes = shuffleArray(questionTypes);
    const questionType = shuffledTypes[0];

    console.log('Generating first question...');
    const question = await generateSynthesisQuestion(
      excludeTopics,
      questionType
    );
    console.log('First question generated successfully');

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error generating first question:', error);
    return NextResponse.json(
      { error: 'Failed to generate first question' },
      { status: 500 }
    );
  }
}
