import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebaseAdmin';

/**
 * Authentication helper for API routes
 * Verifies Firebase ID token and returns authenticated user ID
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  // Extract Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        details: 'Missing or invalid Authorization header. Expected: Bearer <token>'
      },
      { status: 401 }
    );
  }

  const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify Firebase ID token using Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      userId: decodedToken.uid
    };
  } catch (error: any) {
    console.error('[AUTH] Token verification failed:', error);

    // Distinguish between different error types
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        {
          error: 'Token expired',
          details: 'Your session has expired. Please sign in again.'
        },
        { status: 401 }
      );
    }

    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        {
          error: 'Invalid token format',
          details: 'The authentication token is malformed.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: 'Invalid authentication token. Please sign in again.'
      },
      { status: 401 }
    );
  }
}

/**
 * Validate that the userId in request body matches authenticated user
 * Prevents users from accessing other users' data
 */
export function validateUserIdMatch(
  authenticatedUserId: string,
  requestUserId: string | undefined
): NextResponse | null {
  if (!requestUserId) {
    return NextResponse.json(
      {
        error: 'Missing userId',
        details: 'Request body must include userId field'
      },
      { status: 400 }
    );
  }

  if (requestUserId !== authenticatedUserId) {
    console.error('[AUTH] userId mismatch:', {
      authenticated: authenticatedUserId,
      requested: requestUserId
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        details: 'You can only access your own data'
      },
      { status: 403 }
    );
  }

  return null; // Validation passed
}

/**
 * Combined authentication and authorization check
 * Returns authenticated userId or error response
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  requestBody: any
): Promise<{ userId: string } | NextResponse> {
  // Step 1: Authenticate the request
  const authResult = await authenticateRequest(request);

  // If authentication failed, return error response
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Step 2: Validate userId matches (if userId provided in body)
  if (requestBody.userId) {
    const validationError = validateUserIdMatch(
      authResult.userId,
      requestBody.userId
    );

    if (validationError) {
      return validationError;
    }
  }

  // Both checks passed
  return { userId: authResult.userId };
}
