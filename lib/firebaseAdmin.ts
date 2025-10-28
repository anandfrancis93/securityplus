import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Check if running in production (Vercel) or development
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use service account key from environment variable
      console.log('[Firebase Admin] Initializing with FIREBASE_SERVICE_ACCOUNT_KEY');
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized successfully with service account key');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Alternative: Use individual environment variables
      console.log('[Firebase Admin] Initializing with individual environment variables');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized successfully with individual env vars');
    } else {
      // Development: Try to use application default credentials
      console.warn('[Firebase Admin] WARNING: Using application default credentials (development mode)');
      console.warn('[Firebase Admin] This will NOT work in production! Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');

      // In production, this will fail, so throw an error
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error(
          'Firebase Admin credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY or individual Firebase environment variables in Vercel.'
        );
      }

      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized with application default credentials');
    }

    console.log('[Firebase Admin] ✓ Ready');
  } catch (error) {
    console.error('[Firebase Admin] ✗ Initialization error:', error);
    throw error; // Re-throw to prevent API routes from running without auth
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();

export default admin;
