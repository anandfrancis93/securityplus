import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Load quiz state from Firebase
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const inProgressQuiz = userData?.inProgressQuiz || null;

    console.log(`Quiz loaded from Firebase for user ${userId}:`, inProgressQuiz ? 'Found' : 'None');

    return NextResponse.json({
      success: true,
      quizState: inProgressQuiz,
    });
  } catch (error: any) {
    console.error('Error loading quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to load quiz',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
