# Coding Guidelines

## Purpose

This guide prevents code duplication and ensures consistency across the codebase. **Always follow this workflow before implementing any feature.**

---

## 🚨 Golden Rule: Search Before You Code

**Before writing ANY code, ask yourself:**
> "Does this pattern exist elsewhere in the codebase?"

If the answer is "maybe" or "I don't know" → **SEARCH FIRST**

---

## Pre-Implementation Checklist

### Step 1: Identify the Pattern Type

Common patterns that should **NEVER** be duplicated:

- ✅ **Auth/Login redirects** - Use `useRequireAuth` hook
- ✅ **Loading screens** - Use `LoadingScreen` component
- ✅ **Backgrounds with gradients** - Use `AdaptiveBackground` component
- ✅ **Card containers** - Use `LiquidGlassCard` component
- ✅ **Security+ domain dropdowns** - Use `DomainDropdown` component
- ✅ **Domain color mappings** - Import from `lib/constants/domainColors.ts`
- ✅ **Modal dialogs** - Check `components/ui/` first
- ✅ **Form validation** - Check `lib/validation/` or existing forms
- ✅ **Error handling** - Check existing error patterns
- ✅ **Toast/Alert notifications** - Check existing notification patterns

### Step 2: Search Existing Implementations

**Use these commands to find existing code:**

```bash
# Search for auth redirects
grep -r "useRequireAuth\|router.push.*\/" --include="*.tsx" --include="*.ts"

# Search for loading screens
grep -r "LoadingScreen\|loading.*graduation\|animate-spin" --include="*.tsx"

# Search for backgrounds
grep -r "AdaptiveBackground\|bg-gradient-to-br.*from-black" --include="*.tsx"

# Search for dropdowns
grep -r "DomainDropdown\|Security\+.*domain" --include="*.tsx"

# Search for domain colors
grep -r "DOMAIN_COLORS\|getDomainColor" --include="*.ts" --include="*.tsx"

# General pattern search (replace PATTERN)
grep -r "PATTERN" --include="*.tsx" --include="*.ts"
```

**Or use the Explore agent for broader searches:**
- "How do other pages handle authentication?"
- "Show me all loading screen implementations"
- "Find all modal/dialog implementations"

### Step 3: Check Component Library

**Before implementing UI components, check these locations:**

```
components/ui/
├── AdaptiveBackground (LiquidGlassBackground.tsx)
├── LoadingScreen.tsx
├── LiquidGlassCard.tsx
├── DomainDropdown.tsx
└── [Check for others]

lib/hooks/
├── useRequireAuth.ts
└── [Check for others]

lib/constants/
├── domainColors.ts
└── [Check for others]
```

**Read the [Component Library Documentation](./COMPONENT_LIBRARY.md) for full list.**

### Step 4: Decision Tree

```
Found existing implementation?
├─ YES → Reuse it
│   ├─ Is it a component? → Import and use
│   ├─ Is it a hook? → Import and call
│   └─ Is it a constant? → Import from constants
│
└─ NO → Consider creating shared version
    ├─ Will this be used in 2+ places? → Create shared component/hook
    ├─ Is it page-specific logic? → Implement inline (document why)
    └─ Unsure? → Ask the user or propose centralization
```

---

## Implementation Guidelines

### 1. When to Create Shared Components

**Create a shared component if:**
- Pattern appears in 2+ places
- Pattern will likely be reused (auth, loading, modals, etc.)
- Component has no page-specific business logic
- Component represents a reusable UI pattern

**Location:**
- UI components → `components/ui/ComponentName.tsx`
- Business logic hooks → `lib/hooks/useHookName.ts`
- Constants/configs → `lib/constants/constantName.ts`
- Utilities → `lib/utils/utilityName.ts`

### 2. Naming Conventions

**Components:**
```tsx
// PascalCase for components
<LoadingScreen />
<AdaptiveBackground />
<LiquidGlassCard />
```

**Hooks:**
```tsx
// camelCase starting with "use"
useRequireAuth(user, authLoading)
useLocalStorage(key, defaultValue)
```

**Constants:**
```tsx
// SCREAMING_SNAKE_CASE for constants
DOMAIN_COLORS
SECURITY_DOMAINS
MAX_FILE_SIZE
```

**Utilities:**
```tsx
// camelCase for functions
getDomainColor(domain)
formatDate(date)
validateEmail(email)
```

### 3. Documentation Requirements

**Every shared component MUST have:**

```tsx
/**
 * Brief description of what this component does
 *
 * @param prop1 - Description
 * @param prop2 - Description
 * @returns Description of what it renders
 *
 * @example
 * <ComponentName prop1="value" prop2={true} />
 */
```

**Every hook MUST have:**

```tsx
/**
 * Brief description of what this hook does
 *
 * @param param1 - Description
 * @param param2 - Description
 * @returns Description of return value
 *
 * @example
 * const value = useHookName(param1, param2);
 */
```

### 4. When to Refactor Existing Duplicates

If you find duplicate code during implementation:

1. **Stop immediately**
2. **Propose refactoring plan to user:**
   - "I found this pattern in 3 places"
   - "Should I create a shared component first?"
   - "Or should I add it to the existing duplication and refactor later?"
3. **Wait for user decision**
4. **Document the duplication** in TODO or issue if not refactoring now

---

## Common Patterns Reference

### Authentication Redirect

**❌ DON'T:**
```tsx
const router = useRouter();
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/');
  }
}, [user, authLoading, router]);
```

**✅ DO:**
```tsx
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

useRequireAuth(user, authLoading);
```

### Loading Screen

**❌ DON'T:**
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* 40+ lines of loading UI */}
    </div>
  );
}
```

**✅ DO:**
```tsx
import { LoadingScreen } from '@/components/ui/LoadingScreen';

if (loading) {
  return <LoadingScreen liquidGlass={liquidGlass} message="Loading..." />;
}
```

### Background with Gradients

**❌ DON'T:**
```tsx
<div className={`min-h-screen ${liquidGlass ? 'bg-gradient-to-br from-black via-zinc-950 to-black' : 'bg-black'}`}>
  {liquidGlass && (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      {/* More gradients... */}
    </div>
  )}
  {/* Content */}
</div>
```

**✅ DO:**
```tsx
import { AdaptiveBackground } from '@/components/ui/LiquidGlassBackground';

<AdaptiveBackground liquidGlass={liquidGlass}>
  {/* Content */}
</AdaptiveBackground>
```

### Domain Dropdown

**❌ DON'T:**
```tsx
const [dropdownOpen, setDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
// ... 100+ lines of dropdown code
```

**✅ DO:**
```tsx
import { DomainDropdown } from '@/components/ui/DomainDropdown';

const [dropdownOpen, setDropdownOpen] = useState(false);

<DomainDropdown
  value={domain}
  onChange={setDomain}
  liquidGlass={liquidGlass}
  isOpen={dropdownOpen}
  setIsOpen={setDropdownOpen}
/>
```

### Domain Colors

**❌ DON'T:**
```tsx
const DOMAIN_COLORS: { [key: string]: string } = {
  'General Security Concepts': '#9333ea',
  // ... more domains
};
```

**✅ DO:**
```tsx
import { DOMAIN_COLORS, getDomainColor } from '@/lib/constants/domainColors';

const color = getDomainColor(domain);
```

---

## Code Review Checklist

Before submitting a PR or committing, verify:

- [ ] No duplicate code added
- [ ] Searched for existing implementations
- [ ] Reused shared components/hooks where applicable
- [ ] Created shared component if pattern appears 2+ times
- [ ] Added JSDoc comments to shared code
- [ ] Updated COMPONENT_LIBRARY.md if new shared component created
- [ ] Tested build with `npm run build`
- [ ] No console errors or warnings

---

## For Future AI Sessions

**If you're Claude or another AI assistant working on this codebase:**

1. **Read this guide first** before implementing anything
2. **Read [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** to see available components
3. **Use Grep or Explore agent** to search before coding
4. **Propose centralization** when you see duplication potential
5. **Ask the user** if unsure whether to reuse or create new

**Remember:** The user experienced frustration from duplicated code. Preventing duplication is a **top priority**.

---

## Questions?

- See [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for available components
- See [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) for refactoring examples
- See individual component files for usage examples

**When in doubt, search first, then ask.**
