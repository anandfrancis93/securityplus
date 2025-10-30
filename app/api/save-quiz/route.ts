import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { InProgressQuiz } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, quizState } = body as { userId: string; quizState: InProgressQuiz };

    if (!userId || !quizState) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Save quiz state to Firebase
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      inProgressQuiz: quizState,
    });

    console.log(`Quiz saved to Firebase for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Quiz saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to save quiz',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
