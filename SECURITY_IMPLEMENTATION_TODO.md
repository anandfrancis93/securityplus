# Security Implementation TODO

**Status**: ⚠️ **DO NOT DEPLOY YET** - Client code needs updates first

## What's Been Fixed (Committed but Not Deployed)

✅ Firestore rules collection name mismatch
✅ API route authentication (all 7 endpoints)
✅ Input validation with Zod
✅ Server-side authorization checks
✅ Created authenticated API client helper

## ⚠️ CRITICAL: Required Before Deployment

### 1. Update Client-Side API Calls (REQUIRED)

**Current Status**: All API endpoints now require Firebase ID token in Authorization header, but client code still uses unauthenticated `fetch()`.

**Result if deployed now**: All API calls will fail with 401 Unauthorized errors → app will be broken.

**Files That Need Updates**:

#### **components/AppProvider.tsx**

Find and replace all `fetch('/api/...` calls with `authenticatedPost()`:

```typescript
// ADD THIS IMPORT at the top
import { authenticatedPost } from '@/lib/apiClient';

// FIND THIS (line ~86):
const response = await fetch('/api/pregenerate-quiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    completedQuestions: [],
  }),
});

// REPLACE WITH:
const data = await authenticatedPost('/api/pregenerate-quiz', {
  userId,
  completedQuestions: [],
});

// Then remove the manual response.json() parsing since authenticatedPost returns parsed data
// OLD: const data = await response.json();
// NEW: data is already the parsed JSON
```

**All locations in AppProvider.tsx to update:**
1. Line ~86: `checkAndEnsureQuizCache()` - pregenerate-quiz call
2. Line ~373: `triggerPregenerateQuiz()` - pregenerate-quiz call

#### **components/QuizPage.tsx**

Find all question generation API calls and update similarly:

```typescript
// ADD THIS IMPORT at the top
import { authenticatedPost } from '@/lib/apiClient';

// Example: Update generate-first-question call
// FIND:
const response = await fetch('/api/generate-first-question', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ excludeTopics })
});
const data = await response.json();

// REPLACE WITH:
const data = await authenticatedPost('/api/generate-first-question', {
  excludeTopics
});
```

**All locations in QuizPage.tsx to update:**
1. First question generation call
2. Remaining questions generation call
3. Single question generation call (if applicable)

#### **Flashcard Components** (if applicable)

Search for any `fetch('/api/extract-flashcards'` calls and update similarly.

---

### 2. Deploy Firestore Rules IMMEDIATELY

**Even before updating client code**, you should deploy the new Firestore rules:

```bash
firebase deploy --only firestore:rules
```

This will:
- ✅ Protect the `/users/` collection (currently unprotected!)
- ✅ Fix pairing code access rules
- ⚠️ API routes will still be vulnerable (no auth), but at least client-side Firestore access is protected

---

## Medium Priority (Deploy Within 1 Week)

### 3. Add Rate Limiting

**Why**: Without rate limiting, attackers can still drain API credits once they bypass auth.

**Install dependency:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Sign up for Upstash:**
1. Go to https://upstash.com
2. Create a Redis database (free tier available)
3. Get connection credentials
4. Add to `.env`:
   ```
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

**Create rate limiter middleware** (lib/rateLimit.ts):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Expensive operations: 10 requests per minute
export const expensiveRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

// Regular operations: 60 requests per minute
export const regularRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
});
```

**Apply to expensive endpoints:**
```typescript
// In each expensive API route (question generation):
import { expensiveRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit check (before authentication to save resources)
  const identifier = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, limit, reset, remaining } = await expensiveRateLimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        details: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
        limit,
        remaining,
        reset
      },
      { status: 429 }
    );
  }

  // Continue with authentication...
}
```

---

### 4. Strengthen Pairing System

**Current vulnerabilities:**
- 6-character codes (32^6 = 1B combinations, brute-forceable)
- No rate limiting on validation attempts
- 15-minute expiration (too long)

**Fixes needed:**

**lib/pairing.ts:**
```typescript
// 1. Increase code length
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) { // Changed from 6 to 12
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 2. Reduce expiration
export async function createPairingCode(userId: string): Promise<string> {
  const code = generatePairingCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes (was 15)
  // ... rest unchanged
}
```

**Create server-side pairing validation API** (app/api/validate-pairing-code/route.ts):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { regularRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per hour per IP
  const identifier = request.ip ?? 'anonymous';
  const { success } = await regularRateLimit.limit(`pairing:${identifier}`);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many pairing attempts. Try again later.' },
      { status: 429 }
    );
  }

  // Authenticate
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { code } = await request.json();

  // Validate code format
  if (!code || typeof code !== 'string' || code.length !== 12) {
    return NextResponse.json(
      { error: 'Invalid pairing code format' },
      { status: 400 }
    );
  }

  // Check code in Firestore (using Admin SDK to bypass rules)
  const codeRef = adminDb.collection('pairingCodes').doc(code.toUpperCase());
  const codeDoc = await codeRef.get();

  if (!codeDoc.exists) {
    return NextResponse.json(
      { error: 'Invalid or expired code' },
      { status: 404 }
    );
  }

  const data = codeDoc.data()!;

  // Check expiration
  if (data.expiresAt < Date.now()) {
    await codeRef.delete();
    return NextResponse.json(
      { error: 'Code expired' },
      { status: 410 }
    );
  }

  // Delete code (one-time use)
  await codeRef.delete();

  return NextResponse.json({
    success: true,
    userId: data.userId
  });
}
```

---

## Low Priority (Nice to Have)

### 5. Add Security Headers

**next.config.js:**
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};
```

### 6. Add CORS Configuration

**middleware.ts** (create in project root):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean) as string[];

  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### 7. Consider Disabling Anonymous Auth

**lib/firebase.ts:**
```typescript
// Remove or comment out:
// export const initializeAnonymousAuth = ...

// Require Google or Email sign-in only
```

---

## Testing Checklist

Before deploying to production:

- [ ] Test authenticated API calls in development
- [ ] Verify all quiz generation flows work
- [ ] Test flashcard extraction
- [ ] Test pairing system (if keeping it)
- [ ] Test reset progress functionality
- [ ] Monitor Anthropic API usage (should decrease abuse)
- [ ] Check Firebase Auth logs for suspicious activity
- [ ] Verify Firestore rules protect user data

---

## Deployment Order

1. **Phase 1** (Do now, even before client updates):
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Phase 2** (After updating client code):
   - Test locally: `npm run dev`
   - Verify all API calls work
   - Deploy to Vercel: `git push origin main`

3. **Phase 3** (Within 1 week):
   - Add rate limiting
   - Strengthen pairing system
   - Deploy again

4. **Phase 4** (Within 1 month):
   - Add security headers
   - Add CORS
   - Consider disabling anonymous auth

---

## Monitoring After Deployment

Watch for:
- 401 errors in API logs (indicates client code issues)
- 429 errors (rate limiting working)
- Unusual API usage spikes (potential abuse)
- Firebase Auth costs (anonymous user spam)

---

## Questions?

See SECURITY_AUDIT_REPORT.md for:
- Full vulnerability details
- Exploitation techniques
- Complete remediation code
- Compliance considerations
