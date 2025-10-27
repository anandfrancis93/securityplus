import { NextRequest, NextResponse } from 'next/server';
import { generateProgressiveQuestions } from '@/lib/questionGenerator';
import { authenticateRequest } from '@/lib/apiAuth';
import { GenerateQuestionsSchema, safeValidateRequestBody } from '@/lib/apiValidation';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate request (prevent anonymous abuse)
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
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

    const { count = 10, excludeTopics = [] } = validation.data;

    const questions = await generateProgressiveQuestions(count, excludeTopics);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('[ERROR] Failed to generate questions:', error);

    const errorMessage = process.env.NODE_ENV === 'development'
      ? error?.message
      : 'An error occurred while generating questions';

    return NextResponse.json(
      { error: 'Failed to generate questions', details: errorMessage },
      { status: 500 }
    );
  }
}
