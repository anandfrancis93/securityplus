# Component Library

**Quick Reference Guide for All Shared Components, Hooks, and Utilities**

**Purpose:** This document lists all reusable code in the codebase. **Always check here before implementing new features.**

---

## 📦 UI Components

### Location: `components/ui/`

#### 1. AdaptiveBackground

**File:** `components/ui/LiquidGlassBackground.tsx`

**Purpose:** Full-screen background with animated gradient orbs. Adapts to liquid glass or solid black theme.

**Usage:**
```tsx
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';

<AdaptiveBackground
  liquidGlass={liquidGlass}
  colors={{
    top: 'bg-cyan-500/10',      // Optional
    bottom: 'bg-violet-500/10', // Optional
    center: 'bg-emerald-500/5', // Optional
  }}
>
  {/* Your page content */}
</AdaptiveBackground>
```

**Props:**
- `liquidGlass: boolean` - Enable liquid glass theme
- `colors?: object` - Optional custom gradient colors
- `children: ReactNode` - Page content

**Replaces:** Background divs with `min-h-screen`, gradient classes, and animated orbs

---

#### 2. LoadingScreen

**File:** `components/ui/LoadingScreen.tsx`

**Purpose:** Full-screen loading state with animated graduation cap icon.

**Usage:**
```tsx
import { LoadingScreen } from '@/components/ui/LoadingScreen';

if (loading) {
  return <LoadingScreen liquidGlass={liquidGlass} message="Loading..." />;
}
```

**Props:**
- `liquidGlass: boolean` - Enable liquid glass theme
- `message?: string` - Loading message (default: "Loading...")

**Replaces:** Loading state divs with spinners/animations

---

#### 3. LiquidGlassCard

**File:** `components/ui/LiquidGlassCard.tsx`

**Purpose:** Card container with liquid glass effect, gradients, and adaptive styling.

**Usage:**
```tsx
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

<LiquidGlassCard
  liquidGlass={liquidGlass}
  padding="p-8"              // Optional, default: "p-10 md:p-12"
  showGradients={true}       // Optional, default: true
  gradientColors={{          // Optional
    primary: 'from-cyan-500/10',
    secondary: 'from-white/10',
  }}
>
  {/* Card content */}
</LiquidGlassCard>
```

**Props:**
- `liquidGlass: boolean` - Enable liquid glass theme
- `padding?: string` - Custom padding classes
- `showGradients?: boolean` - Show/hide gradient overlays
- `gradientColors?: object` - Custom gradient colors
- `children: ReactNode` - Card content

**Replaces:** Card divs with backdrop-blur, borders, and gradient overlays

---

#### 4. DomainDropdown

**File:** `components/ui/DomainDropdown.tsx`

**Purpose:** Security+ domain selector dropdown with all 5 domains.

**Usage:**
```tsx
import { DomainDropdown } from '@/components/ui/DomainDropdown';

const [domain, setDomain] = useState('General Security Concepts');
const [isOpen, setIsOpen] = useState(false);

<DomainDropdown
  value={domain}
  onChange={setDomain}
  liquidGlass={liquidGlass}
  disabled={false}           // Optional
  isOpen={isOpen}
  setIsOpen={setIsOpen}
/>
```

**Props:**
- `value: string` - Selected domain
- `onChange: (domain: string) => void` - Change handler
- `liquidGlass: boolean` - Enable liquid glass theme
- `disabled?: boolean` - Disable dropdown
- `isOpen: boolean` - Dropdown open state
- `setIsOpen: (open: boolean) => void` - State setter

**Replaces:** Custom dropdown implementations with Security+ domains

---

## 🎣 Custom Hooks

### Location: `lib/hooks/`

#### 1. useRequireAuth

**File:** `lib/hooks/useRequireAuth.ts`

**Purpose:** Redirect unauthenticated users to login page.

**Usage:**
```tsx
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

export default function ProtectedPage() {
  const { user, loading } = useApp();

  useRequireAuth(user, loading);

  // Rest of component
}
```

**Parameters:**
- `user: User | null` - Current user from auth
- `authLoading: boolean` - Auth loading state

**Replaces:** Auth redirect useEffect with router.push

---

## 🎨 Constants

### Location: `lib/constants/`

#### Domain Colors

**File:** `lib/constants/domainColors.ts`

**Purpose:** Security+ domain names, colors, and color helper function.

**Usage:**
```tsx
import {
  SECURITY_DOMAINS,    // Array of all 5 domains
  DOMAIN_COLORS,       // Object mapping domain -> color
  getDomainColor       // Helper function
} from '@/lib/constants/domainColors';

// Get color for a domain
const color = getDomainColor('General Security Concepts'); // '#9333ea'

// Map over all domains
SECURITY_DOMAINS.map(domain => (
  <div key={domain} style={{ color: getDomainColor(domain) }}>
    {domain}
  </div>
))
```

**Exports:**
- `SECURITY_DOMAINS: string[]` - Array of 5 Security+ domains
- `DOMAIN_COLORS: { [key: string]: string }` - Domain to hex color mapping
- `getDomainColor(domain: string): string` - Get color for domain (with fallback)

**Replaces:** Hardcoded domain arrays and color objects

---

## 🛠️ Common Utilities

### Location: `lib/`

#### Image Upload

**File:** `lib/imageUpload.ts`

**Purpose:** Upload images to Firebase Storage, validate image files.

**Usage:**
```tsx
import { uploadFlashcardImage, validateImageFile } from '@/lib/imageUpload';

// Validate before upload
const validation = validateImageFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}

// Upload to Firebase Storage
const imageUrl = await uploadFlashcardImage(userId, flashcardId, file);
```

**Functions:**
- `validateImageFile(file: File): { valid: boolean; error?: string }` - Validate image type and size
- `uploadFlashcardImage(userId: string, flashcardId: string, file: File): Promise<string>` - Upload and return URL

**Max size:** 5MB
**Allowed types:** JPG, PNG, GIF, WebP

---

#### API Authentication

**File:** `lib/apiAuth.ts`

**Purpose:** Verify Firebase ID tokens in API routes.

**Usage:**
```tsx
import { verifyAuthToken } from '@/lib/apiAuth';

export async function POST(request: Request) {
  const authResult = await verifyAuthToken(request);

  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    );
  }

  // Use authResult.userId
}
```

**Functions:**
- `verifyAuthToken(request: Request): Promise<AuthResult>` - Verify token, return userId or error

---

#### API Validation

**File:** `lib/apiValidation.ts`

**Purpose:** Validate request bodies in API routes.

**Usage:**
```tsx
import { validateRequestBody } from '@/lib/apiValidation';

export async function POST(request: Request) {
  const validation = await validateRequestBody(request, ['userId', 'quizId']);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { userId, quizId } = validation.body;
}
```

**Functions:**
- `validateRequestBody(request: Request, requiredFields: string[]): Promise<ValidationResult>` - Validate required fields

---

## 🗄️ Database Functions

### Flashcard Database

**File:** `lib/flashcardDb.ts`

**Purpose:** CRUD operations for flashcards in Firestore.

**Key Functions:**
- `getUserFlashcards(userId: string): Promise<Flashcard[]>` - Get all user flashcards
- `saveFlashcards(userId: string, flashcards: Partial<Flashcard>[], source: string): Promise<void>` - Save flashcards
- `deleteFlashcard(userId: string, flashcardId: string): Promise<void>` - Delete flashcard
- `updateFlashcard(userId: string, flashcardId: string, updates: Partial<Flashcard>): Promise<void>` - Update flashcard

---

### Quiz Database

**File:** `lib/db.ts`

**Purpose:** CRUD operations for quizzes in Firestore.

**Key Functions:**
- `getQuizById(userId: string, quizId: string): Promise<Quiz | null>` - Get quiz by ID
- `getUserQuizzes(userId: string): Promise<Quiz[]>` - Get all user quizzes
- `saveQuiz(userId: string, quiz: Partial<Quiz>): Promise<string>` - Save quiz, return ID
- `deleteQuiz(userId: string, quizId: string): Promise<void>` - Delete quiz
- `updateQuiz(userId: string, quizId: string, updates: Partial<Quiz>): Promise<void>` - Update quiz

---

## 🧠 Business Logic

### FSRS (Spaced Repetition)

**Files:**
- `lib/fsrsFlashcard.ts` - FSRS for flashcards
- `lib/fsrsQuiz.ts` - FSRS for quizzes
- `lib/spacedRepetition.ts` - Core FSRS algorithm

**Purpose:** Spaced repetition scheduling for flashcards and quizzes.

**Common Functions:**
- `calculateNextReview(...)` - Calculate next review date based on performance
- `updateFsrsState(...)` - Update FSRS metadata
- `getDueCards(...)` - Get cards due for review

---

### IRT (Item Response Theory)

**File:** `lib/irt.ts`

**Purpose:** Estimate user ability (theta) using IRT model.

**Key Functions:**
- `estimateTheta(responses: Response[], items: Item[]): number` - Calculate ability score
- `estimateItemParameters(...)` - Calculate question difficulty/discrimination

---

### Quiz State Manager

**File:** `lib/quizStateManager.ts`

**Purpose:** Manage quiz session state (current question, score, etc.).

**Usage:** Import and use for complex quiz state management.

---

### Question Generator

**File:** `lib/questionGenerator.ts`

**Purpose:** Generate quiz questions using AI.

**Key Functions:**
- `generateQuestions(...)` - Generate questions for topics
- `validateQuestions(...)` - Validate question format

---

### Topic Selection (FSRS-based)

**File:** `lib/topicSelectionFSRS.ts`

**Purpose:** Select quiz topics based on FSRS due dates.

**Key Functions:**
- `selectTopicsForQuiz(...)` - Choose topics for quiz based on due dates

---

## 📋 Type Definitions

**File:** `lib/types.ts`

**Purpose:** Shared TypeScript types and interfaces.

**Key Types:**
- `Flashcard` - Flashcard data structure
- `Quiz` - Quiz data structure
- `Question` - Quiz question structure
- `User` - User data structure
- `FsrsState` - FSRS metadata structure
- `IrtState` - IRT metadata structure

**Always import types from here for consistency.**

---

## 🎯 How to Use This Library

### Before Implementing a Feature:

1. **Check this document** - Does the component/utility exist?
2. **Search the codebase** - Use grep/Glob to find implementations
3. **Reuse or create shared** - Don't duplicate code

### When Adding New Shared Code:

1. **Create the component/hook/utility**
2. **Add it to the appropriate location** (components/ui/, lib/hooks/, lib/constants/, etc.)
3. **Document it in this file** with usage examples
4. **Update CODING_GUIDELINES.md** if it's a common pattern

### Quick Search Commands:

```bash
# Find all component usages
grep -r "ComponentName" --include="*.tsx"

# Find all hook usages
grep -r "useHookName" --include="*.tsx" --include="*.ts"

# Find all constant usages
grep -r "CONSTANT_NAME" --include="*.tsx" --include="*.ts"
```

---

## 🚀 Adding New Components

When you create a new shared component:

1. **Add JSDoc comments** with description, params, example
2. **Add it to this document** with full usage example
3. **Update the appropriate section** (UI Components, Hooks, etc.)
4. **Test in 2+ places** to ensure it's truly reusable

**Template for new entries:**

```markdown
#### Component Name

**File:** `path/to/file.ts`

**Purpose:** Brief description of what it does.

**Usage:**
```tsx
import { ComponentName } from '@/path/to/file';

// Usage example
<ComponentName prop={value} />
```

**Props/Parameters:**
- `prop1: type` - Description
- `prop2: type` - Description

**Replaces:** What old pattern this replaces
```

---

## ✅ Checklist for Using Shared Code

- [ ] Checked this document for existing implementation
- [ ] Searched codebase with grep/Glob
- [ ] Imported from correct location
- [ ] Used correct prop types
- [ ] Tested in development
- [ ] No duplicate code created

---

## 📚 Related Documentation

- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - How to prevent duplication
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - How to refactor duplicate code
- [README.md](./README.md) - Project overview and setup

---

**Remember: If you're not sure whether something exists, check here first, then search, then ask.**
