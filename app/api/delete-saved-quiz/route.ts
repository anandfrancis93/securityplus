import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { FieldValue } from 'firebase-admin/firestore';

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

    // Delete saved quiz from Firebase
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      inProgressQuiz: FieldValue.delete(),
    });

    console.log(`Saved quiz deleted from Firebase for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Saved quiz deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting saved quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete saved quiz',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
