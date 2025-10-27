import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionWithTopics, selectQuestionType } from '@/lib/questionGenerator';
import { selectQuestionCategory, selectTopicsForQuestion } from '@/lib/quizPregeneration';
import { authenticateRequest } from '@/lib/apiAuth';
import { GenerateSingleQuestionSchema, safeValidateRequestBody } from '@/lib/apiValidation';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = safeValidateRequestBody(GenerateSingleQuestionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const {
      excludeTopics = [],
      questionNumber = 1,
    } = validation.data;

    // Select question type (single or multiple choice)
    const questionType = selectQuestionType();

    // Select question category (single-domain-single-topic, single-domain-multiple-topics, multiple-domains-multiple-topics)
    // Difficulty is automatically derived from category
    const questionCategory = selectQuestionCategory();

    // Select topics from our cleaned list based on category
    const selectedTopics = selectTopicsForQuestion(questionCategory, []);

    console.log(`Generating question ${questionNumber}: ${questionCategory} ${questionType}-choice, Topics: ${selectedTopics.join(', ')}`);

    const question = await generateQuestionWithTopics(
      selectedTopics,
      questionCategory,
      questionType
    );

    console.log(`Question ${questionNumber} generated successfully: ${question.difficulty} difficulty`);

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
