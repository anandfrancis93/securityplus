import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAndAuthorize } from '@/lib/apiAuth';
import { ClearCachedQuizSchema, safeValidateRequestBody } from '@/lib/apiValidation';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // SECURITY: Validate input
    const validation = safeValidateRequestBody(ClearCachedQuizSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // SECURITY: Authenticate and authorize request
    const authResult = await authenticateAndAuthorize(request, { userId });
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Clear cached quiz from subcollection
    const cachedQuizRef = adminDb.collection('users').doc(userId).collection('cached_quiz').doc('current');
    await cachedQuizRef.delete();

    // Update user document to indicate no cached quiz
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      hasCachedQuiz: false,
      cachedQuizUpdatedAt: null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ERROR] Failed to clear cached quiz:', error);

    // Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error?.message
      : 'An error occurred while clearing the quiz cache';

    return NextResponse.json(
      {
        error: 'Failed to clear cached quiz',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
