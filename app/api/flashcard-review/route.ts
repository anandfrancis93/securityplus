import { NextRequest, NextResponse } from 'next/server';
import { calculateNextReview } from '@/lib/fsrsFlashcard';
import { FlashcardReview } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { previousReview, difficulty, flashcardId, userId } = body;

    if (!flashcardId || !userId || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newReview = calculateNextReview(
      previousReview as FlashcardReview | null,
      difficulty as 'again' | 'hard' | 'good' | 'easy',
      flashcardId,
      userId
    );

    return NextResponse.json(newReview);
  } catch (error) {
    console.error('Error calculating flashcard review:', error);
    return NextResponse.json(
      { error: 'Failed to calculate review' },
      { status: 500 }
    );
  }
}
