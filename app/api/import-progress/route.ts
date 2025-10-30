import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, importData, mergeData = false } = body as {
      userId: string;
      importData: any;
      mergeData?: boolean;
    };

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

    console.log(`[IMPORT] Starting import in ${mergeData ? 'MERGE' : 'REPLACE'} mode`);

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
    if (mergeData) {
      // MERGE mode: Update existing document, preserving non-imported fields
      const existingDoc = await userRef.get();
      const existingData = existingDoc.data() || {};

      // For merge, we need to be smart about numerical fields
      // We'll keep the imported stats as they represent a complete state
      await userRef.set({
        ...existingData,
        ...mainDocData,
        lastUpdated: Date.now(),
      });

      console.log(`[IMPORT] Main document merged for user ${userId}`);
    } else {
      // REPLACE mode: Overwrite with imported data
      await userRef.set({
        ...mainDocData,
        lastUpdated: Date.now(),
      });

      console.log(`[IMPORT] Main document replaced for user ${userId}`);
    }

    // Import quiz history to subcollection (using 'quizzes' to match lib/db.ts)
    if (quizHistoryData && quizHistoryData.length > 0) {
      const batch = adminDb.batch();
      const quizHistoryRef = userRef.collection('quizzes');

      if (!mergeData) {
        // REPLACE mode: Clear existing quiz history first
        const existingQuizzes = await quizHistoryRef.get();
        existingQuizzes.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        console.log(`[IMPORT] Cleared ${existingQuizzes.docs.length} existing quizzes for replacement`);
      } else {
        // MERGE mode: Keep existing quizzes, only add new ones or update if they already exist
        console.log(`[IMPORT] Merging quizzes with existing data`);
      }

      // Add imported quiz history
      quizHistoryData.forEach(quiz => {
        const quizId = quiz.id || `quiz_${quiz.startedAt || quiz.completedAt || Date.now()}`;
        const quizRef = quizHistoryRef.doc(quizId);
        // Keep the id field in the document data for consistency
        const quizData = { ...quiz, id: quizId };

        if (mergeData) {
          // In merge mode, use set with merge option to preserve existing data
          batch.set(quizRef, quizData, { merge: true });
        } else {
          // In replace mode, overwrite completely
          batch.set(quizRef, quizData);
        }
      });

      await batch.commit();
      console.log(`[IMPORT] ${quizHistoryData.length} quizzes ${mergeData ? 'merged into' : 'replaced in'} subcollection`);
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
