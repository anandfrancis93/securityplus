import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, importData } = body as { userId: string; importData: any };

    if (!userId || !importData) {
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

    const userRef = adminDb.collection('users').doc(userId);

    // Check if this is new format (with separate mainDocument and quizHistory)
    // or old format (with userData containing quizHistory array)
    let mainDocData: any;
    let quizHistoryData: any[] = [];

    if (importData.mainDocument && importData.quizHistory) {
      // New format: exported via API
      console.log('[IMPORT] New format detected (mainDocument + quizHistory subcollection)');
      mainDocData = importData.mainDocument;
      quizHistoryData = importData.quizHistory;
    } else if (importData.userData) {
      // Old format: exported before subcollection migration
      console.log('[IMPORT] Old format detected (userData with quizHistory array)');
      const userData = importData.userData;

      // Extract quizHistory from userData if it exists
      if (userData.quizHistory && Array.isArray(userData.quizHistory)) {
        quizHistoryData = userData.quizHistory;
        // Remove quizHistory from main doc data
        const { quizHistory, ...restData } = userData;
        mainDocData = restData;
      } else {
        mainDocData = userData;
      }
    } else {
      throw new Error('Invalid import data format');
    }

    // Import main document
    await userRef.set({
      ...mainDocData,
      lastUpdated: Date.now(),
    });

    console.log(`[IMPORT] Main document imported for user ${userId}`);

    // Import quiz history to subcollection
    if (quizHistoryData && quizHistoryData.length > 0) {
      const batch = adminDb.batch();
      const quizHistoryRef = userRef.collection('quizHistory');

      // Clear existing quiz history first
      const existingQuizzes = await quizHistoryRef.get();
      existingQuizzes.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add imported quiz history
      quizHistoryData.forEach(quiz => {
        const quizId = quiz.id || `quiz_${quiz.completedAt || Date.now()}`;
        const quizRef = quizHistoryRef.doc(quizId);
        const { id, ...quizData } = quiz; // Remove id field before storing
        batch.set(quizRef, quizData);
      });

      await batch.commit();
      console.log(`[IMPORT] ${quizHistoryData.length} quizzes imported to subcollection`);
    }

    return NextResponse.json({
      success: true,
      message: 'Progress data imported successfully',
      quizzesImported: quizHistoryData.length,
    });
  } catch (error: any) {
    console.error('Error importing progress data:', error);
    return NextResponse.json(
      {
        error: 'Failed to import progress data',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
