# DRY Audit Report - AI Learning Platform

**Date:** 2025-11-01
**Auditor:** Claude Code
**Scope:** Full codebase audit for DRY violations

---

## Executive Summary

A comprehensive audit identified **significant code duplication** across the codebase. The findings reveal opportunities to eliminate **1,500-2,000 lines of duplicate code** by creating a proper design system and extracting shared utilities.

### Key Findings

- ✅ **Good:** Calculation logic (IRT, FSRS) already centralized
- ❌ **Critical:** Neumorphic design patterns duplicated in 15+ files
- ❌ **Critical:** Color constants appear 1,000+ times (not centralized)
- ❌ **High:** Authentication checks duplicated in 14+ files (hook exists but unused)
- ❌ **High:** Quiz lifecycle logic duplicated in 2 major files
- ⚠️ **Medium:** Modal and empty state patterns repeated 4+ times

---

## 1. HIGH SEVERITY VIOLATIONS

### 1.1 Authentication Logic Duplication ❌

**Impact:** 14+ files, ~70 lines of duplicate code

**Current State:**
```typescript
// This pattern appears in 14+ page components:
useEffect(() => {
  if (!loading && !user) {
    router.push('/');
  }
}, [user, loading, router]);
```

**Files Affected:**
- `components/QuizPage.tsx` (lines 32-36)
- `components/HomePage.tsx` (lines 14-18)
- `components/CybersecurityPage.tsx` (lines 17-21)
- `components/FlashcardsPage.tsx` (line 21)
- Plus 10+ other page components

**Solution Exists:** `lib/hooks/useRequireAuth.ts` already implements this correctly

**Action Required:**
```typescript
// ✅ Replace all inline auth checks with:
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

export default function MyPage() {
  useRequireAuth(); // That's it!
  // Rest of component...
}
```

**Effort:** 30 minutes (find/replace across 14 files)
**Priority:** HIGH - Security-critical code should have single source

---

### 1.2 Neumorphic Design System Missing ❌

**Impact:** 15+ files, ~800 lines of duplicate styles

#### Colors: 1,000+ Duplicate Values

**Current State:**
```typescript
// Appears 100+ times across 23 files:
background: '#0f0f0f'
color: '#e5e5e5'

// Brand colors appear 258 times across 22 files:
color: '#8b5cf6'  // Purple
color: '#10b981'  // Green
color: '#f59e0b'  // Amber
```

**Files Most Affected:**
- `components/QuizPage.tsx` - 50+ color values
- `components/HomePage.tsx` - 30+ color values
- `components/PerformancePage.tsx` - 40+ color values
- All other page/component files

**Action Required:**

**Step 1:** Create `lib/constants/colors.ts`
```typescript
export const COLORS = {
  background: {
    primary: '#0f0f0f',
    dark: '#050505',
    light: '#191919',
  },
  text: {
    primary: '#e5e5e5',
    secondary: '#a8a8a8',
    tertiary: '#666666',
  },
  brand: {
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
  },
};
```

**Step 2:** Create `lib/constants/shadows.ts`
```typescript
export const SHADOWS = {
  neu: {
    raised: '12px 12px 24px #050505, -12px -12px 24px #191919',
    hover: '6px 6px 12px #050505, -6px -6px 12px #191919',
    inset: 'inset 4px 4px 8px #050505, inset -4px -4px 8px #191919',
  },
};
```

**Effort:** 2 hours (create constants, update all files)
**Priority:** HIGH - Foundation of design system

---

#### Neumorphic Card Pattern: 50+ Duplications

**Current State:**
```typescript
// This exact pattern appears in 15+ files:
<div style={{
  background: '#0f0f0f',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
}}>
  {/* Content */}
</div>
```

**Files Most Affected:**
- `components/QuizPage.tsx` - 8+ instances
- `components/HomePage.tsx` - 6+ instances
- `components/FlashcardsPage.tsx` - 5+ instances
- Plus 12+ other files

**Action Required:**

**Step 1:** Create `components/ui/NeuCard.tsx`
```typescript
interface NeuCardProps {
  children: React.ReactNode;
  variant?: 'raised' | 'inset' | 'flat';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function NeuCard({
  children,
  variant = 'raised',
  padding = 'md',
  className,
  onClick
}: NeuCardProps) {
  return (
    <div
      className={`neu-card neu-card-${variant} neu-card-padding-${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**Step 2:** Create `components/ui/NeuButton.tsx`
```typescript
interface NeuButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function NeuButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button'
}: NeuButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neu-button neu-button-${variant} neu-button-${size}`}
    >
      {children}
    </button>
  );
}
```

**Step 3:** Replace all inline card/button styles with components

**Effort:** 4 hours (create components + CSS, replace 50+ instances)
**Priority:** HIGH - Eliminates majority of style duplication

---

### 1.3 Quiz Lifecycle Logic Duplication ❌

**Impact:** 2 files, ~200 lines of duplicate logic

**Current State:**

**File 1:** `components/QuizPage.tsx` (lines 444-500)
```typescript
const handleEndQuiz = async () => {
  // 1. Capture quiz stats
  const quizResults = {
    totalQuestions: currentQuiz.questions.length,
    correctAnswers: currentQuiz.questions.filter(q => q.selectedAnswer === q.correctAnswer).length,
    // ... more stats
  };

  // 2. Collect unused pre-generated questions
  const unusedQuestions = currentQuiz.questions
    .filter(q => !q.answered)
    .map(q => ({ /* question data */ }));

  // 3. Call endQuiz endpoint
  await authenticatedPost('/api/endQuiz', { /* ... */ });

  // 4. Clear localStorage
  localStorage.removeItem('quizInProgress');

  // 5. Delete saved quiz
  await authenticatedPost('/api/deleteSavedQuiz', { /* ... */ });

  // 6. Show celebration or navigate
  if (accuracy >= 70) {
    setCelebrationVisible(true);
  } else {
    router.push('/cybersecurity');
  }
};
```

**File 2:** `components/AppProvider.tsx` (lines 339-433)
```typescript
// Nearly identical logic with minor variations
const handleQuizEnd = async () => {
  // Same 6 steps with slightly different variable names
  // Same localStorage cleanup
  // Same API calls
  // Same navigation logic
};
```

**Action Required:**

**Step 1:** Create `lib/quizLifecycle.ts`
```typescript
export interface QuizCompletionOptions {
  currentQuiz: QuizState;
  userId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export async function completeQuiz(options: QuizCompletionOptions) {
  const { currentQuiz, userId, onSuccess, onError } = options;

  try {
    // 1. Capture stats
    const stats = captureQuizStats(currentQuiz);

    // 2. Collect unused questions
    const unusedQuestions = collectUnusedQuestions(currentQuiz);

    // 3. Call endQuiz API
    await endQuizOnServer(currentQuiz.id, stats, unusedQuestions);

    // 4. Clear localStorage
    clearQuizState();

    // 5. Delete saved quiz
    await deleteSavedQuiz(currentQuiz.id, userId);

    // 6. Return results for navigation/celebration
    onSuccess?.();
    return { stats, shouldCelebrate: stats.accuracy >= 70 };
  } catch (error) {
    onError?.(error as Error);
    throw error;
  }
}

function captureQuizStats(quiz: QuizState) {
  // Single source of truth for stat calculation
}

function collectUnusedQuestions(quiz: QuizState) {
  // Single source of truth for unused question logic
}
```

**Step 2:** Replace both implementations

```typescript
// In QuizPage.tsx:
const handleEndQuiz = async () => {
  const result = await completeQuiz({
    currentQuiz,
    userId: user.id,
    onSuccess: () => {
      if (result.shouldCelebrate) {
        setCelebrationVisible(true);
      } else {
        router.push('/cybersecurity');
      }
    },
  });
};

// In AppProvider.tsx:
const handleQuizEnd = async () => {
  await completeQuiz({
    currentQuiz,
    userId: user.id,
    onSuccess: () => router.push('/cybersecurity'),
  });
};
```

**Effort:** 3 hours (extract logic, test both call sites)
**Priority:** HIGH - Complex business logic should have single source

---

### 1.4 localStorage Management Scattered ❌

**Impact:** 2 files, ~50 lines of duplicate code

**Current State:**
```typescript
// Pattern repeated in QuizPage.tsx and AppProvider.tsx:

// Save quiz
localStorage.setItem('quizInProgress', JSON.stringify(quizState));

// Load quiz with validation
const savedQuiz = localStorage.getItem('quizInProgress');
if (savedQuiz) {
  const parsed = JSON.parse(savedQuiz);
  // Validation: check expiry, check user, etc.
  if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
    // Use quiz
  }
}

// Clear quiz
localStorage.removeItem('quizInProgress');
```

**Action Required:**

**Create `lib/storage.ts`**
```typescript
export const STORAGE_KEYS = {
  QUIZ_IN_PROGRESS: 'quizInProgress',
  LIQUID_GLASS: 'liquidGlass',
  USER_PREFERENCES: 'userPreferences',
} as const;

export const EXPIRY_MS = {
  QUIZ: 60 * 60 * 1000, // 1 hour
  CACHE: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export interface SavedQuizState {
  quiz: QuizState;
  timestamp: number;
  userId: string;
}

export function saveQuizState(quiz: QuizState, userId: string): void {
  try {
    const data: SavedQuizState = {
      quiz,
      timestamp: Date.now(),
      userId,
    };
    localStorage.setItem(STORAGE_KEYS.QUIZ_IN_PROGRESS, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save quiz state:', error);
  }
}

export function loadQuizState(userId: string): QuizState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_IN_PROGRESS);
    if (!saved) return null;

    const data: SavedQuizState = JSON.parse(saved);

    // Validation: Expiry check
    if (Date.now() - data.timestamp > EXPIRY_MS.QUIZ) {
      clearQuizState();
      return null;
    }

    // Validation: User check
    if (data.userId !== userId) {
      return null;
    }

    return data.quiz;
  } catch (error) {
    console.error('Failed to load quiz state:', error);
    return null;
  }
}

export function clearQuizState(): void {
  localStorage.removeItem(STORAGE_KEYS.QUIZ_IN_PROGRESS);
}

export function getPreference<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setPreference<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save preference:', error);
  }
}
```

**Effort:** 1.5 hours (create utility, replace all localStorage calls)
**Priority:** HIGH - Prevents localStorage bugs and inconsistencies

---

## 2. MEDIUM SEVERITY VIOLATIONS

### 2.1 Loading Screen Duplication ⚠️

**Impact:** 1 file, 172 lines of duplicate code

**Current State:**
- `components/ui/LoadingScreen.tsx` - Centralized component (GOOD)
- `components/QuizPage.tsx` (lines 548-720) - Custom implementation with 172 lines of duplicate JSX

**QuizPage.tsx has custom loading screen:**
```typescript
// 172 lines of custom loading UI that duplicates LoadingScreen.tsx
return (
  <div style={{ /* 20+ style declarations */ }}>
    <div style={{ /* icon container */ }}>
      <div style={{ /* animated icon */ }}>✨</div>
    </div>
    <h2 style={{ /* heading styles */ }}>Generating your first question...</h2>
    <p style={{ /* subtext styles */ }}>This will take about 10 seconds</p>
    {/* More duplicate UI */}
  </div>
);
```

**Action Required:**
```typescript
// Replace 172 lines with:
import LoadingScreen from '@/components/ui/LoadingScreen';

if (generatingFirstQuestion) {
  return (
    <LoadingScreen
      message="Generating your first question..."
      submessage="This will take about 10 seconds"
    />
  );
}
```

**Effort:** 15 minutes
**Priority:** MEDIUM - Significant code reduction

---

### 2.2 Modal Pattern Duplication ⚠️

**Impact:** 2 modals in QuizPage.tsx, ~140 lines total

**Current State:**
```typescript
// Navigation Warning Modal (lines 960-1034)
<div className="modal-overlay" style={{ /* 10+ styles */ }}>
  <div className="modal-card" style={{ /* 15+ styles */ }}>
    <div className="modal-content">
      <div className="modal-icon">💾</div>
      <h2 className="modal-title">Save Your Progress?</h2>
      <p className="modal-description">...</p>
      <div className="modal-actions">
        <button>Yes, Save</button>
        <button>Discard</button>
      </div>
    </div>
  </div>
</div>

// Celebration Modal (lines 1037-1072) - Similar structure
```

**Action Required:**

**Create `components/ui/NeuModal.tsx`**
```typescript
interface NeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export function NeuModal({
  isOpen,
  onClose,
  icon,
  title,
  description,
  actions
}: NeuModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {icon && <div className="modal-icon">{icon}</div>}
        <h2 className="modal-title">{title}</h2>
        {description && <p className="modal-description">{description}</p>}
        <div className="modal-actions">
          {actions.map((action, i) => (
            <NeuButton
              key={i}
              variant={action.variant}
              onClick={action.onClick}
            >
              {action.label}
            </NeuButton>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Usage:**
```typescript
<NeuModal
  isOpen={showNavigationWarning}
  onClose={() => setShowNavigationWarning(false)}
  icon="💾"
  title="Save Your Progress?"
  description="Would you like to save your quiz progress before leaving?"
  actions={[
    { label: 'Yes, Save', onClick: handleSaveAndExit, variant: 'primary' },
    { label: 'Discard', onClick: handleDiscardAndExit, variant: 'danger' },
  ]}
/>
```

**Effort:** 2 hours (create component + CSS, replace 2 modals)
**Priority:** MEDIUM - Improves consistency

---

### 2.3 Empty State Pattern Duplication ⚠️

**Impact:** 3-4 instances across files

**Current State:**
```typescript
// Error state in QuizPage.tsx (lines 724-920)
<div style={{ /* centering */ }}>
  <div style={{ /* error icon */ }}>⚠️</div>
  <h3 style={{ /* title */ }}>Something Went Wrong</h3>
  <p style={{ /* message */ }}>Error message here</p>
  <button style={{ /* action */ }}>Try Again</button>
</div>

// "All Done" state in FlashcardsPage
// Similar pattern
```

**Action Required:**

**Create `components/ui/EmptyState.tsx`**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  variant?: 'error' | 'success' | 'empty' | 'info';
}

export function EmptyState({
  icon,
  title,
  message,
  actions,
  variant = 'info'
}: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state-${variant}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {actions && (
        <div className="empty-state-actions">
          {actions.map((action, i) => (
            <NeuButton key={i} variant={action.variant} onClick={action.onClick}>
              {action.label}
            </NeuButton>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Effort:** 1.5 hours
**Priority:** MEDIUM - Consistent UX for edge cases

---

### 2.4 API Error Handling ⚠️

**Impact:** 9 files using `authenticatedPost()`

**Current State:**
```typescript
// Pattern repeated across 9 files:
try {
  const data = await authenticatedPost('/api/...', body);
  // Success handling
} catch (error) {
  console.error('Error:', error);
  alert('Failed to ...');  // Different messages in each file
}
```

**Action Required:**

**Enhance `lib/apiClient.ts`**
```typescript
export async function authenticatedPost<T>(
  url: string,
  body: any,
  options?: {
    errorMessage?: string;
    silent?: boolean;
    onError?: (error: Error) => void;
  }
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const errorMsg = options?.errorMessage || 'Request failed';

    if (!options?.silent) {
      console.error(`${errorMsg}:`, error);
      // Could add toast notification here instead of alert
    }

    if (options?.onError) {
      options.onError(error as Error);
    }

    throw error;
  }
}
```

**Usage:**
```typescript
// Instead of try/catch everywhere:
await authenticatedPost('/api/endQuiz', data, {
  errorMessage: 'Failed to end quiz',
  onError: (error) => {
    // Custom error handling if needed
  }
});
```

**Effort:** 1 hour
**Priority:** MEDIUM - Better error UX

---

## 3. LOW SEVERITY OBSERVATIONS

### 3.1 Date.now() Usage ✅

**Impact:** 101 occurrences across 26 files

**Current State:** Acceptable - mostly correct usage for timestamps

**Optional Enhancement:**
```typescript
// lib/utils/time.ts
export const getCurrentTimestamp = () => Date.now();
export const isExpired = (timestamp: number, expiryMs: number) =>
  Date.now() - timestamp > expiryMs;
```

**Effort:** 30 minutes
**Priority:** LOW - Optional improvement

---

### 3.2 Math Utilities ✅

**Current State:** GOOD - Calculation logic already centralized in:
- `lib/irt.ts` - IRT calculations
- `lib/confidenceIntervals.ts` - Statistical calculations
- `lib/fsrsQuiz.ts` / `lib/fsrsFlashcard.ts` - FSRS algorithms

**Optional Enhancement:**
```typescript
// lib/utils/math.ts
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const percentToScore = (percent: number, scale: number = 100) =>
  (percent / 100) * scale;
```

**Effort:** 30 minutes
**Priority:** LOW - Optional convenience

---

## 4. ACTION PLAN

### Phase 1: Critical Foundations (Week 1)

**Day 1-2: Design System Constants**
- [ ] Create `lib/constants/colors.ts` (30 min)
- [ ] Create `lib/constants/shadows.ts` (30 min)
- [ ] Create `lib/constants/timing.ts` (20 min)
- [ ] Create `lib/constants/quiz.ts` (20 min)
- [ ] Update all files to import constants (3 hours)

**Day 3-4: Core UI Components**
- [ ] Create `components/ui/NeuCard.tsx` + CSS (2 hours)
- [ ] Create `components/ui/NeuButton.tsx` + CSS (2 hours)
- [ ] Replace inline card styles in 5 priority files (2 hours)

**Day 5: Authentication Cleanup**
- [ ] Replace 14+ inline auth checks with `useRequireAuth` (30 min)
- [ ] Test all protected pages (30 min)

---

### Phase 2: Business Logic Extraction (Week 2)

**Day 1-2: Quiz Lifecycle**
- [ ] Create `lib/quizLifecycle.ts` (3 hours)
- [ ] Replace logic in `QuizPage.tsx` (1 hour)
- [ ] Replace logic in `AppProvider.tsx` (1 hour)
- [ ] Test both quiz end flows (1 hour)

**Day 3: localStorage Utility**
- [ ] Create `lib/storage.ts` (1.5 hours)
- [ ] Replace all localStorage calls (1 hour)
- [ ] Test quiz save/restore (30 min)

**Day 4-5: Modal & Empty States**
- [ ] Create `components/ui/NeuModal.tsx` (2 hours)
- [ ] Create `components/ui/EmptyState.tsx` (1.5 hours)
- [ ] Replace modals in QuizPage.tsx (1 hour)
- [ ] Replace error states (1 hour)

---

### Phase 3: Finish Remaining Components (Week 3)

**Day 1-2: Complete Card Replacements**
- [ ] Replace cards in remaining 10 files (4 hours)
- [ ] Test responsive behavior (2 hours)

**Day 3: API Error Handling**
- [ ] Enhance `lib/apiClient.ts` (1 hour)
- [ ] Update all API call sites (1 hour)

**Day 4-5: Testing & Documentation**
- [ ] Regression test all pages (3 hours)
- [ ] Update component documentation (2 hours)
- [ ] Update CLAUDE.md with new patterns (1 hour)

---

## 5. ESTIMATED IMPACT

### Code Reduction
- **~1,500-2,000 lines eliminated**
- Style duplication: ~800 lines
- Logic duplication: ~400 lines
- Component duplication: ~500 lines
- Constants: ~300 lines (replaced with imports)

### Maintainability Improvements
- ✅ Change brand color once → updates 1,000+ places
- ✅ Update shadow style once → updates 50+ cards
- ✅ Fix auth bug once → fixes 14+ pages
- ✅ Improve quiz end logic once → fixes 2 implementations
- ✅ Add error handling once → improves 9 API calls

### Testing Benefits
- ✅ Test `NeuCard` once instead of 50+ inline styles
- ✅ Test `useRequireAuth` once instead of 14+ checks
- ✅ Test `completeQuiz()` once instead of 2+ implementations
- ✅ Test localStorage once instead of scattered calls

### Performance Benefits
- ✅ Smaller bundle size (less duplicate code)
- ✅ Better tree-shaking (shared components)
- ✅ Consistent rendering (no style recalculation)

---

## 6. FILES TO CREATE

### UI Components (4 files)
1. `components/ui/NeuCard.tsx`
2. `components/ui/NeuButton.tsx`
3. `components/ui/NeuModal.tsx`
4. `components/ui/EmptyState.tsx`

### Constants (4 files)
5. `lib/constants/colors.ts`
6. `lib/constants/shadows.ts`
7. `lib/constants/timing.ts`
8. `lib/constants/quiz.ts`

### Utilities (2 files)
9. `lib/quizLifecycle.ts`
10. `lib/storage.ts`

### CSS (2 files)
11. `components/ui/neu-components.css` (shared styles)
12. `components/ui/modals.css` (modal-specific)

**Total:** 12 new files

---

## 7. FILES TO UPDATE

### High Priority (15 files)
- All files with inline auth checks (14 files)
- `components/QuizPage.tsx` (replace loading, modals, cards)
- `components/AppProvider.tsx` (use quiz lifecycle)
- `lib/apiClient.ts` (enhance error handling)

### Medium Priority (20 files)
- All files using inline neumorphic styles
- All files with hardcoded colors
- Replace with UI components and constants

### Low Priority (10 files)
- Files using Date.now() directly
- Files with magic numbers
- Optional utility usage

**Total:** 45+ files to update

---

## 8. SUCCESS CRITERIA

### Before Refactor
- ❌ 1,000+ hardcoded color values
- ❌ 50+ duplicate card styles
- ❌ 14+ duplicate auth checks
- ❌ 2+ duplicate quiz end implementations
- ❌ Scattered localStorage calls
- ❌ Inconsistent error handling

### After Refactor
- ✅ 1 color palette (imported everywhere)
- ✅ 1 card component (used everywhere)
- ✅ 1 auth hook (used everywhere)
- ✅ 1 quiz lifecycle function
- ✅ 1 localStorage utility
- ✅ Consistent error handling

### Metrics
- **Lines of Code:** Reduced by 1,500-2,000
- **Maintainability:** Single source of truth for all patterns
- **Testability:** 12 new testable units instead of 100+ inline implementations
- **Consistency:** Uniform UX across all pages

---

## 9. RISK ASSESSMENT

### Low Risk ✅
- Creating new constants (no breaking changes)
- Creating new UI components (additive)
- Enhancing apiClient (backward compatible)

### Medium Risk ⚠️
- Replacing authentication checks (must test all routes)
- Replacing quiz lifecycle (complex logic, must test thoroughly)
- Replacing localStorage calls (storage format changes)

### Mitigation
- ✅ Incremental rollout (one file at a time)
- ✅ Keep old code temporarily (comment out, don't delete)
- ✅ Regression test after each major change
- ✅ User acceptance testing on staging
- ✅ Rollback plan (git branches)

---

## 10. TIMELINE

**Total Effort:** ~40-50 hours (1.5-2 weeks for 1 developer)

### Week 1: Foundations (20 hours)
- Design system constants
- Core UI components (NeuCard, NeuButton)
- Authentication cleanup

### Week 2: Business Logic (15 hours)
- Quiz lifecycle extraction
- localStorage utility
- Modals & empty states

### Week 3: Polish (10 hours)
- Complete component replacements
- API error handling
- Testing & documentation

---

## 11. CONCLUSION

This audit reveals significant opportunities to improve code quality through proper application of DRY principles. The proposed changes will:

1. **Eliminate 1,500-2,000 lines of duplicate code**
2. **Establish single sources of truth** for design, logic, and utilities
3. **Improve maintainability** through centralized patterns
4. **Enhance consistency** across the entire application
5. **Reduce bugs** by eliminating duplicate implementations

The refactor is **high-value, medium-risk, and achievable in 2-3 weeks** with proper planning and incremental execution.

---

**Next Steps:**
1. Review and approve this plan
2. Create feature branch: `refactor/dry-cleanup`
3. Start with Phase 1 (design system constants)
4. Proceed incrementally with testing at each step

---

*Audit completed on 2025-11-01 by Claude Code*
