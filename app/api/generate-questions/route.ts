import { NextRequest, NextResponse } from 'next/server';
import { generateProgressiveQuestions } from '@/lib/questionGenerator';

export async function POST(request: NextRequest) {
  try {
    const { count = 10, excludeTopics = [] } = await request.json();

    const questions = await generateProgressiveQuestions(count, excludeTopics);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
