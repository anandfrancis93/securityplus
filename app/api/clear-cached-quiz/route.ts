import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Clear cached quiz from Firebase
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      cachedQuiz: null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing cached quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear cached quiz',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
