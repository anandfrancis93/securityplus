# Code Refactoring Guide

## Overview

This guide shows how to refactor the remaining pages to use the new centralized components created in commit `141b610`.

**Status:** Performance page refactored ✅
**Remaining:** 8 flashcard/quiz pages need refactoring

---

## New Components Available

### 1. `useRequireAuth` Hook
**Location:** `lib/hooks/useRequireAuth.ts`
**Replaces:** Auth redirect useEffect

**Before:**
```tsx
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/');
  }
}, [user, authLoading, router]);
```

**After:**
```tsx
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

// In component:
useRequireAuth(user, authLoading);
```

---

### 2. `AdaptiveBackground` Component
**Location:** `components/ui/LiquidGlassBackground.tsx`
**Replaces:** Background div with animated gradients

**Before:**
```tsx
<div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
  {liquidGlass && (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )}
  {/* Content */}
</div>
```

**After:**
```tsx
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';

<AdaptiveBackground
  liquidGlass={liquidGlass}
  colors={{
    top: 'bg-cyan-500/10',      // Optional: customize colors
    bottom: 'bg-violet-500/10',
    center: 'bg-emerald-500/5',
  }}
>
  {/* Content */}
</AdaptiveBackground>
```

---

### 3. `LoadingScreen` Component
**Location:** `components/ui/LoadingScreen.tsx`
**Replaces:** Loading state with spinning graduation cap

**Before:**
```tsx
if (loading) {
  return (
    <div className={`flex items-center justify-center min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
      {/* 40+ lines of animated loading UI */}
    </div>
  );
}
```

**After:**
```tsx
import { LoadingScreen } from '@/components/ui/LoadingScreen';

if (loading) {
  return <LoadingScreen liquidGlass={liquidGlass} message="Loading..." />;
}
```

---

### 4. `LiquidGlassCard` Component
**Location:** `components/ui/LiquidGlassCard.tsx`
**Replaces:** Card containers with gradient overlays

**Before:**
```tsx
<div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-10 md:p-12 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} shadow-2xl overflow-hidden`}>
  {liquidGlass && (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-[40px] opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
    </>
  )}
  <div className="relative">
    {/* Content */}
  </div>
</div>
```

**After:**
```tsx
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

<LiquidGlassCard
  liquidGlass={liquidGlass}
  padding="p-8"  // Optional: customize padding
  showGradients={true}  // Optional: show/hide gradients
  gradientColors={{  // Optional: customize colors
    primary: 'from-cyan-500/10',
    secondary: 'from-white/10',
  }}
>
  {/* Content */}
</LiquidGlassCard>
```

---

### 5. `DomainDropdown` Component
**Location:** `components/ui/DomainDropdown.tsx`
**Replaces:** Security+ domain dropdown

**Before:**
```tsx
const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
const domainDropdownRef = useRef<HTMLDivElement>(null);

// 50+ lines of dropdown JSX and click-outside logic
```

**After:**
```tsx
import { DomainDropdown } from '@/components/ui/DomainDropdown';

const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

<DomainDropdown
  value={manualDomain}
  onChange={setManualDomain}
  liquidGlass={liquidGlass}
  disabled={generating}
  isOpen={domainDropdownOpen}
  setIsOpen={setDomainDropdownOpen}
/>
```

---

### 6. Domain Colors Constants
**Location:** `lib/constants/domainColors.ts`
**Replaces:** Hardcoded domain color objects

**Before:**
```tsx
const DOMAIN_COLORS: { [key: string]: string } = {
  'General Security Concepts': '#9333ea',
  // ... 4 more domains
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || '#22c55e';
}
```

**After:**
```tsx
import { DOMAIN_COLORS, getDomainColor, SECURITY_DOMAINS } from '@/lib/constants/domainColors';

// Use directly:
const color = getDomainColor(domain);
```

---

### 7. Global CSS (Already Applied)
**Location:** `app/globals.css`
**Added:** Scrollbar styles, tooltip animations, no-scrollbar utility

**Remove from individual files:**
```tsx
// DELETE these inline <style> tags:
<style jsx global>{`
  @keyframes tooltipFade { ... }
  .flashcard-scroll::-webkit-scrollbar { ... }
  .no-scrollbar::-webkit-scrollbar { display: none; }
`}</style>
```

**These are now globally available.**

---

## Pages That Need Refactoring

### Priority Order

1. **app/cybersecurity/flashcards/create/page.tsx** ✅ Has all patterns
   - Auth redirect → useRequireAuth
   - Background → AdaptiveBackground
   - Domain dropdown → DomainDropdown
   - no-scrollbar CSS → Already global

2. **app/cybersecurity/flashcards/search/page.tsx** ✅ Has all patterns
   - Auth redirect → useRequireAuth
   - Loading screen → LoadingScreen
   - Background → AdaptiveBackground
   - Domain dropdown → DomainDropdown (in edit modal)
   - Scrollbar CSS → Already global

3. **app/cybersecurity/flashcards/study/page.tsx** ✅ Has most patterns
   - Auth redirect → useRequireAuth
   - Loading screen → LoadingScreen
   - Background → AdaptiveBackground
   - Tooltip/scrollbar CSS → Already global

4. **Remaining flashcard pages** (similar patterns)

---

## Step-by-Step Refactoring Process

### Step 1: Add Imports
```tsx
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { DomainDropdown } from '@/components/ui/DomainDropdown'; // If needed
import { getDomainColor } from '@/lib/constants/domainColors'; // If needed
```

### Step 2: Replace Auth Redirect
Find:
```tsx
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/');
  }
}, [user, authLoading, router]);
```

Replace with:
```tsx
useRequireAuth(user, authLoading);
```

### Step 3: Replace Loading Screen
Find:
```tsx
if (loading) {
  return (
    <div className={`flex items-center justify-center min-h-screen ...`}>
      {/* Long loading UI */}
    </div>
  );
}
```

Replace with:
```tsx
if (loading) {
  return <LoadingScreen liquidGlass={liquidGlass} message="Loading..." />;
}
```

### Step 4: Replace Background
Find the outermost return div with background and gradients.

Replace with `<AdaptiveBackground>` wrapping all content.

### Step 5: Remove Inline CSS
Delete any `<style jsx global>` tags for scrollbar/tooltip animations.

### Step 6: Test
```bash
npm run build  # Verify no errors
npm run dev    # Test the page works
```

---

## Example: Complete Refactoring

### Before (create/page.tsx excerpt)
```tsx
export default function CreateFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();
  const router = useRouter();

  // AUTH REDIRECT - 8 lines
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // DOMAIN DROPDOWN - 50+ lines
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const domainDropdownRef = useRef<HTMLDivElement>(null);
  // ... more state and effects

  return (
    <>
      {/* NO-SCROLLBAR CSS - 8 lines */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* BACKGROUND - 15 lines */}
      <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
        {liquidGlass && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            {/* ... 2 more gradients */}
          </div>
        )}

        {/* DOMAIN DROPDOWN - 53 lines */}
        <div className="relative" ref={domainDropdownRef}>
          <button ... >
            {/* ... */}
          </button>
          {domainDropdownOpen && (
            <div ...>
              {/* ... */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### After (create/page.tsx excerpt)
```tsx
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';
import { DomainDropdown } from '@/components/ui/DomainDropdown';

export default function CreateFlashcards() {
  const { userId, user, loading: authLoading, liquidGlass } = useApp();

  // AUTH REDIRECT - 1 line
  useRequireAuth(user, authLoading);

  // DOMAIN DROPDOWN - 1 line state
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  return (
    <AdaptiveBackground liquidGlass={liquidGlass}>
      {/* Header */}
      <div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
        <Header />
      </div>

      {/* Domain Dropdown - 8 lines */}
      <DomainDropdown
        value={manualDomain}
        onChange={setManualDomain}
        liquidGlass={liquidGlass}
        disabled={generating}
        isOpen={domainDropdownOpen}
        setIsOpen={setDomainDropdownOpen}
      />
    </AdaptiveBackground>
  );
}
```

**Result:** ~76 lines eliminated, code is cleaner and more maintainable.

---

## Common Pitfalls

### 1. Forgetting to Import
```tsx
// ERROR: useRequireAuth is not defined
useRequireAuth(user, authLoading);

// FIX: Add import
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
```

### 2. Wrong Component Closing Tag
```tsx
// ERROR: Closing </div> instead of </AdaptiveBackground>
<AdaptiveBackground liquidGlass={liquidGlass}>
  {/* content */}
</div>

// FIX: Match the opening tag
<AdaptiveBackground liquidGlass={liquidGlass}>
  {/* content */}
</AdaptiveBackground>
```

### 3. Not Removing Old Code
```tsx
// ERROR: Both old and new code present
<AdaptiveBackground liquidGlass={liquidGlass}>
  <div className={`min-h-screen text-white relative overflow-hidden ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
    {/* This is redundant! */}
  </div>
</AdaptiveBackground>

// FIX: Remove the inner div entirely
<AdaptiveBackground liquidGlass={liquidGlass}>
  {/* content */}
</AdaptiveBackground>
```

---

## Progress Tracking

- [x] Performance page (example) - Commit 141b610
- [x] Create flashcards page - Commit 76325ca (~76 lines eliminated)
- [x] Search flashcards page - Commit 76325ca (~180 lines eliminated)
- [x] Study flashcards page - Commit 76325ca (~90 lines eliminated)
- [x] FlashcardsPage component - Commit 5d84d1f (~65 lines eliminated)
- [x] QuizPage component - Commit 5d84d1f (~30 lines eliminated)

**Status:** ✅ All major pages refactored successfully!

---

## Benefits Achieved

After refactoring 6 pages/components (performance, create, search, study, FlashcardsPage, QuizPage):
- **~473 lines of duplicate code eliminated** (actual: -401 lines in 76325ca, -72 lines in 5d84d1f)
- **Single source of truth for UI patterns**
- **Consistent styling across all pages**
- **Easier to maintain and update**
- **Smaller bundle size**
- **Better developer experience**
- **All pages use centralized components** (useRequireAuth, LoadingScreen, AdaptiveBackground)

---

## Questions?

See the example refactoring in:
- **commit:** `141b610`
- **file:** `app/cybersecurity/flashcards/performance/page.tsx`

Compare before/after in git diff to see the transformation.
