import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { UserProgress } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, progressData } = body as { userId: string; progressData: UserProgress };

    if (!userId || !progressData) {
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

    // Import progress data to Firebase
    const userRef = adminDb.collection('users').doc(userId);

    // Get existing document to preserve fields not in the import
    const existingDoc = await userRef.get();
    const existingData = existingDoc.data() || {};

    // Merge imported data with existing, giving priority to imported data
    const mergedData = {
      ...existingData,
      ...progressData,
      lastUpdated: Date.now(),
    };

    await userRef.set(mergedData);

    console.log(`Progress data imported successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Progress data imported successfully',
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
