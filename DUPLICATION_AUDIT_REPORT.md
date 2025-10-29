# Code Duplication Audit Report

## Summary

Found **11 major duplication patterns** across flashcard and quiz pages that should be centralized.

---

## 1. **Auth Redirect Hook** - CRITICAL
**Duplicated in:** ALL authenticated pages (5+ instances)
**Lines of duplicate code:** ~8 lines × 5 = 40 lines
**Pattern:**
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/');
  }
}, [user, authLoading, router]);
```

**Solution:** Create `lib/hooks/useRequireAuth.ts` hook

---

## 2. **Liquid Glass Background Component** - CRITICAL
**Duplicated in:** ALL pages (10+ instances)
**Lines of duplicate code:** ~15 lines × 10 = 150 lines
**Pattern:**
```typescript
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

**Solution:** Create `components/ui/LiquidGlassBackground.tsx` component

---

## 3. **Loading Screen** - HIGH PRIORITY
**Duplicated in:**
- app/cybersecurity/flashcards/create/page.tsx (not found, but pattern seen)
- app/cybersecurity/flashcards/performance/page.tsx (lines 69-114)
- app/cybersecurity/flashcards/search/page.tsx (lines 193-239)
- app/cybersecurity/flashcards/study/page.tsx (lines 136-182)

**Lines of duplicate code:** ~46 lines × 4 = 184 lines
**Pattern:** Liquid glass card with spinning graduation cap icon, "Loading..." text

**Solution:** Create `components/ui/LoadingScreen.tsx` component

---

## 4. **Domain Dropdown** - MEDIUM PRIORITY
**Duplicated in:**
- app/cybersecurity/flashcards/create/page.tsx (lines 241-293)
- app/cybersecurity/flashcards/search/page.tsx (lines 463-573)

**Lines of duplicate code:** ~53 lines × 2 = 106 lines
**Pattern:** Dropdown with 5 Security+ domains

**Solution:** Create `components/ui/DomainDropdown.tsx` component

---

## 5. **Domain Color Mapping** - LOW PRIORITY
**Duplicated in:**
- app/cybersecurity/flashcards/search/page.tsx (lines 14-25)
- Likely other places

**Lines of duplicate code:** ~12 lines
**Pattern:**
```typescript
const DOMAIN_COLORS: { [key: string]: string } = {
  'General Security Concepts': '#9333ea',
  'Threats, Vulnerabilities, and Mitigations': '#ff4500',
  ...
};
```

**Solution:** Create `lib/domainColors.ts` constants file

---

## 6. **Custom Scrollbar CSS** - MEDIUM PRIORITY
**Duplicated in:**
- app/cybersecurity/flashcards/search/page.tsx (lines 638-663)
- app/cybersecurity/flashcards/study/page.tsx (lines 239-257)
- app/cybersecurity/flashcards/performance/page.tsx (lines 147-155, scrollbar not found but likely there)

**Lines of duplicate code:** ~20 lines × 3 = 60 lines
**Pattern:** Webkit scrollbar styling with emerald/violet colors

**Solution:** Create global CSS in `app/globals.css` or `components/ui/GlobalStyles.tsx`

---

## 7. **Tooltip Animation CSS** - MEDIUM PRIORITY
**Duplicated in:**
- app/cybersecurity/flashcards/performance/page.tsx (lines 122-130)
- app/cybersecurity/flashcards/study/page.tsx (lines 229-237)

**Lines of duplicate code:** ~9 lines × 2 = 18 lines
**Pattern:**
```css
@keyframes tooltipFade {
  0% { opacity: 0; }
  26.3% { opacity: 0; }
  30.3% { opacity: 1; }
  96.1% { opacity: 1; }
  100% { opacity: 0; }
}
```

**Solution:** Move to global CSS

---

## 8. **Form Input/Textarea Styling** - LOW PRIORITY
**Duplicated in:** Multiple pages
**Pattern:** Very long className strings for inputs/textareas with liquid glass styling

**Solution:** Create utility function or Tailwind component classes

---

## 9. **Header Wrapper** - LOW PRIORITY
**Duplicated in:** ALL pages
**Lines of duplicate code:** ~3 lines × 10 = 30 lines
**Pattern:**
```typescript
<div className="relative pt-6 pb-4 md:pt-8 md:pb-6">
  <Header />
</div>
```

**Solution:** Include in layout component or create `HeaderWrapper.tsx`

---

## 10. **Liquid Glass Card Container** - MEDIUM PRIORITY
**Duplicated in:** Multiple pages
**Pattern:** Repeated card styling with gradient overlays
```typescript
<div className={`relative ${liquidGlass ? 'bg-white/5 backdrop-blur-2xl rounded-[40px]' : 'bg-slate-800/95 backdrop-blur-xl rounded-3xl'} p-10 md:p-12 border ${liquidGlass ? 'border-white/10' : 'border-slate-700/50'} shadow-2xl overflow-hidden`}>
  {liquidGlass && (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-[40px] opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-[40px] opacity-50" />
    </>
  )}
  {/* Content */}
</div>
```

**Solution:** Create `components/ui/LiquidGlassCard.tsx` component

---

## 11. **Hero Section** - LOW PRIORITY
**Duplicated in:** Most pages
**Pattern:** Large gradient text with subtitle

**Solution:** Create `components/ui/HeroSection.tsx` component

---

## Total Lines of Duplicate Code

| Pattern | Lines | Priority |
|---------|-------|----------|
| Liquid Glass Background | 150 | CRITICAL |
| Loading Screen | 184 | HIGH |
| Domain Dropdown | 106 | MEDIUM |
| Custom Scrollbar CSS | 60 | MEDIUM |
| Liquid Glass Card | ~100 | MEDIUM |
| Auth Redirect | 40 | CRITICAL |
| Header Wrapper | 30 | LOW |
| Tooltip Animation | 18 | MEDIUM |
| Domain Colors | 12 | LOW |

**TOTAL:** ~700 lines of duplicate code that can be centralized

---

## Recommended Implementation Order

1. **Phase 1 (CRITICAL):** Auth redirect hook, Liquid Glass Background
2. **Phase 2 (HIGH):** Loading Screen, Liquid Glass Card
3. **Phase 3 (MEDIUM):** Domain Dropdown, Custom Scrollbar CSS, Tooltip CSS
4. **Phase 4 (LOW):** Domain Colors, Header Wrapper, Hero Section, Form styling
