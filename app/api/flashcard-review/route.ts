import { NextRequest, NextResponse } from 'next/server';
import { calculateNextReview } from '@/lib/fsrsFlashcard';
import { FlashcardReview } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { previousReview, difficulty, flashcardId, userId } = body;

    console.log('[API] Flashcard review request:', {
      flashcardId,
      userId,
      difficulty,
      hasPreviousReview: !!previousReview
    });

    if (!flashcardId || !userId || !difficulty) {
      console.error('[API] Missing required fields:', { flashcardId, userId, difficulty });
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

    console.log('[API] Calculated review:', newReview);

    return NextResponse.json(newReview);
  } catch (error) {
    console.error('[API] Error calculating flashcard review:', error);
    return NextResponse.json(
      { error: 'Failed to calculate review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
