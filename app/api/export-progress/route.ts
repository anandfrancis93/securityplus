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

    // Get main user document
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Get quiz history from subcollection (using 'quizzes' to match lib/db.ts)
    const quizHistorySnapshot = await userRef
      .collection('quizzes')
      .orderBy('startedAt', 'desc')
      .get();

    const quizHistory = quizHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create export data with both main document and subcollection
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      mainDocument: userData,
      quizHistory: quizHistory,
    };

    console.log(`Progress data exported for user ${userId}, ${quizHistory.length} quizzes`);

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error('Error exporting progress data:', error);
    return NextResponse.json(
      {
        error: 'Failed to export progress data',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
