# AI Learning Platform - Project Memory

## Project Overview

This is an **AI-powered adaptive learning platform** focused on **progressive learning** - steady advancement from novice to expert with solid foundations at each level.

**Current Implementation:** Security+ SY0-701 certification preparation (Cybersecurity is one subject - platform is designed to support any learning domain)

**Core Architecture:** See `@IMPLEMENTATION_PLAN.md` for complete technical specification

---

## System Architecture - Six Integrated Learning Systems

### 1. **Bloom's Taxonomy** (Progressive Learning Framework)
- **6 Levels:** Remember → Understand → Apply → Analyze → Evaluate → Create
- **Mastery-based unlocking:** Must achieve 60-75% mastery before advancing
- **Foundation enforcement:** Lower levels must remain ≥50% while climbing higher
- **Skill decay tracking:** Different half-lives per level (L1=45 days, L6=12 days)

### 2. **FSRS (Free Spaced Repetition Scheduler)**
- **Purpose:** Memory retention, foundation maintenance, prevent regression
- **Personalization:** 17 parameters fitted to each user's forgetting curve after 100+ reviews
- **Time-of-day optimization:** Adjusts intervals based on user's circadian patterns
- **Foundation stability gates:** Check before level unlocks (>40% unstable = require review)

### 3. **IRT (Item Response Theory)** - Multidimensional
- **Ability estimation:** Separate θ (theta) for each [topic][bloom_level] combination
- **Range:** -3 to +3 (realistically -2 to +2 for most users)
- **Hierarchical Bayesian:** theta_topic_bloom ~ Normal(theta_topic + bloom_offset, 0.3)
- **Adaptive difficulty:** Select questions where user has 60-70% success probability
- **Confidence interval:** Decreases as more questions answered (uncertainty → certainty)

### 4. **Dunning-Kruger Effect Detection**
- **Confidence tracking:** 5-point scale (20%, 40%, 60%, 80%, 95%) before seeing options
- **Calibration score:** confidence_percentage - (performance × 100)
- **Excellent calibration:** ±5 points
- **Intervention threshold:** >±25 requires calibration training, >±35 blocks level advancement
- **Time-of-day bias:** Track morning overconfidence, evening underconfidence patterns

### 5. **Generation Effect** (Levels 3-6 only)
- **L1-L2:** MCQ only (speed matters for foundation building)
- **L3 (Apply):** Conditional typing (if confidence ≥80%, require typed answer)
- **L4-L6 (Analyze/Evaluate/Create):** Always require typed answer (can't fake mastery with MCQ)
- **Performance score:** (typed_match × 0.6) + (selected_correct × 0.4)
- **Dual memory tracking:** Recall strength (from typing) vs Recognition strength (from selecting)

### 6. **Bayesian Inference & Pattern Learning**
- **Topic correlations:** "Failing Risk Assessment predicts failing Control Selection" (r=0.90)
- **Learning styles:** Visual vs text, scenario vs memorization success rates
- **Time-of-day patterns:** Morning performance, evening retention, optimal study times
- **Prerequisite chains:** "Failing Network Security L3 → OSI Model L2 gap" (p=0.76)
- **Learning velocity:** Mastery gain per day varies by topic (7.5%/day vs 2.7%/day)

---

## Core Development Principles

### DRY (Don't Repeat Yourself)
- **Single Source of Truth:** Each function/logic exists in ONE place only
- **Reusable components:** Extract shared UI patterns into reusable components
- **Shared utilities:** Common calculations (IRT updates, FSRS scheduling, mastery) in centralized services
- **Example:** Quiz end logic in ONE function, called by all exit points (not duplicated)

### Consistent Behavior
- **All "End Quiz" buttons work exactly the same** - they call the same function
- **All FSRS rating calculations use the same algorithm** - no variation by context
- **All IRT updates follow the same formula** - theta_new = theta_old + learning_rate × (performance - expected)
- **All Bloom's mastery calculations use identical weights** - bloom_multiplier × calibration_modifier × recency_weight

### Maintainability
- **One place to update:** Bug fix in shared function fixes all call sites
- **Clear separation:** Business logic in `/services`, UI in `/components`, types in `/types`
- **Type safety:** TypeScript strict mode - no `any` types without explicit justification
- **Documentation:** Complex algorithms (IRT, FSRS) must have inline comments with formulas

### Testability
- **Pure functions preferred:** Input → Output (no side effects when possible)
- **Dependency injection:** Pass dependencies as parameters (easier to mock)
- **One function to test:** Shared utilities get comprehensive tests once, benefits everywhere
- **Critical paths:** IRT calculations, FSRS scheduling, Bloom's unlock logic require unit tests

---

## Technology Stack

### Framework & Core
- **Next.js 14+** with App Router (NOT Pages Router)
- **React 18+** with Server Components where appropriate
- **TypeScript** in strict mode
- **Tailwind CSS** for styling (neumorphic dark theme: #0f0f0f background)

### Database & ORM
- **Supabase** (PostgreSQL)
- **Prisma** for all database access (type-safe queries)
- **Never use raw SQL** - always use Prisma client

### State Management
- **React Context** for global state (user session, theme)
- **Local state (useState)** for component-specific state
- **NO Redux/MobX** - keep it simple with React's built-in tools

### AI & Question Generation
- **OpenAI GPT-4** for question generation
- **Claude API** for question validation and difficulty estimation
- **Gemini** for multi-modal content (images, diagrams)

### Key Libraries
- **ts-fsrs** - FSRS spaced repetition algorithm implementation
- **date-fns** - Date manipulation (NOT moment.js)
- **zod** - Runtime type validation for API inputs
- **recharts** - Charts and visualizations (performance graphs, calibration curves)

---

## File Organization & Structure

```
/app                      - Next.js App Router pages
  /api                    - API routes
  /cybersecurity          - Subject-specific routes
  layout.tsx              - Root layout with metadata

/components               - React components
  Header.tsx              - App header (navigation)
  LoginPage.tsx           - Landing page
  QuestionCard.tsx        - Question display with multi-step workflow
  PerformancePage.tsx     - Analytics dashboard
  ExplanationSection.tsx  - Post-answer feedback

/lib                      - Utility functions
  /irt                    - IRT calculations
  /fsrs                   - FSRS scheduling logic
  /blooms                 - Bloom's mastery calculations
  /bayesian               - Pattern learning algorithms

/services                 - Business logic services
  questionGenerator.ts    - AI question generation
  abilityEstimator.ts     - IRT ability updates
  spaceRepetition.ts      - FSRS card management
  confidenceTracker.ts    - Dunning-Kruger detection

/types                    - TypeScript type definitions
  user.ts                 - User, Session types
  question.ts             - Question, Response types
  learning.ts             - IRT, FSRS, Bloom's types

/public                   - Static assets
  manifest.json           - PWA configuration
  icon.svg                - App icon (AI logo with neural network)

/docs                     - Documentation
  IMPLEMENTATION_PLAN.md  - Complete system architecture
  README.md               - Project overview
```

---

## Database Schema Conventions

### Naming
- **Tables:** `snake_case` plural (e.g., `user_bloom_mastery`, `user_irt_ability`)
- **Columns:** `snake_case` (e.g., `mastery_percentage`, `confidence_interval`)
- **Foreign keys:** `{table}_id` (e.g., `user_id`, `question_id`)
- **Timestamps:** Always `timestamp with time zone` in UTC
- **Booleans:** Prefix with `is_` or `has_` (e.g., `unlocked`, `is_correct`)

### Indexes
- **All foreign keys MUST have indexes** (performance critical)
- **Composite indexes for common queries:** `(user_id, topic_id, bloom_level)`
- **Partial indexes for active data:** `WHERE next_review <= NOW()` for FSRS cards

### Data Integrity
- **Never expose internal IDs in URLs** - use session for user context
- **All user data is user-scoped** - every query filters by `user_id`
- **Cascading deletes configured** - deleting user removes all their data
- **No null foreign keys** - use proper relationships or separate tables

### Multi-Dimensional Tracking
- **user_bloom_mastery:** [user_id, topic_id, bloom_level] - one row per combination
- **user_irt_ability:** [user_id, topic_id, bloom_level] - tracks theta separately
- **user_fsrs_cards:** [user_id, question_id] - one card per question per user
- **user_confidence_data:** [user_id, question_id, attempt_timestamp] - tracks all attempts

---

## Code Style & Conventions

### TypeScript
```typescript
// ✅ Good - Explicit types, descriptive names
interface UserBloomMastery {
  userId: string;
  topicId: string;
  bloomLevel: 1 | 2 | 3 | 4 | 5 | 6;
  masteryPercentage: number; // 0-100
  questionsAnswered: number;
  lastPracticed: Date;
  unlocked: boolean;
}

function calculateMastery(responses: QuestionResponse[]): number {
  // Implementation
}

// ❌ Bad - any types, vague names
function calc(data: any): any {
  // Don't do this
}
```

### React Components
```typescript
// ✅ Good - Props interface, TypeScript, clear structure
interface QuestionCardProps {
  question: Question;
  bloomLevel: BloomLevel;
  onAnswer: (response: QuestionResponse) => void;
}

export default function QuestionCard({ question, bloomLevel, onAnswer }: QuestionCardProps) {
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  // Component logic
}

// ❌ Bad - No types, unclear props
export default function Card(props) {
  // Don't do this
}
```

### Error Handling
```typescript
// ✅ Good - Type-safe error handling
try {
  const theta = calculateIRTUpdate(currentTheta, difficulty, performance);
  if (!isFinite(theta) || theta < -3 || theta > 3) {
    throw new Error(`Invalid theta calculated: ${theta}`);
  }
  return theta;
} catch (error) {
  console.error('IRT calculation failed:', error);
  // Fallback to current theta (don't update)
  return currentTheta;
}

// ❌ Bad - Silent failures
try {
  const theta = calc(data);
  return theta;
} catch {
  return 0; // Lost context, unclear fallback
}
```

---

## Security Requirements

### Input Validation
- **ALWAYS validate on server-side** - never trust client
- **Use Zod schemas** for API input validation
- **Sanitize user input** before database insertion (Prisma handles this, but be aware)
- **Rate limiting:** 60 requests/minute per user for question generation

### Authentication & Authorization
- **Session-based auth** via Supabase Auth
- **All API routes check authentication** - no public endpoints for user data
- **User isolation:** Queries MUST filter by authenticated user's ID
- **Never expose other users' data** - even in error messages

### Data Privacy
- **No PII in logs** - user_id OK, email/name not OK
- **Confidence data is sensitive** - treat calibration scores as private
- **Question responses are private** - no leaderboards without explicit opt-in
- **FSRS parameters are personal** - don't share between users

### API Key Management
- **Never commit API keys** - use environment variables
- **`.env.local` in `.gitignore`** - already configured
- **Rotate keys quarterly** - OpenAI, Claude, Gemini keys
- **Different keys per environment** - dev, staging, prod

---

## Question Generation Guidelines

### Core Intent Tagging
Every question MUST have:
- **core_intent_topic:** Single topic this question primarily tests (e.g., "Cryptography")
- **bloom_level:** 1-6 (Remember through Create)
- **irt_difficulty:** Float (-3 to +3, typically 0.0 to 2.0)
- **prerequisite_topics:** Array of topics user must know (0-3 topics)

### Bloom's Level Criteria
- **L1 (Remember):** "What is X?" - Direct recall of facts
- **L2 (Understand):** "Why does X work?" - Explain concepts
- **L3 (Apply):** "When should you use X?" - Apply knowledge to scenarios
- **L4 (Analyze):** "Compare X and Y" - Break down and analyze
- **L5 (Evaluate):** "Which is better: X or Y?" - Judge and justify
- **L6 (Create):** "Design a solution using X" - Synthesize new solutions

### Question Quality Standards
- **Clear and unambiguous** - no trick questions
- **Realistic scenarios** - Apply+ levels use real-world contexts
- **Plausible distractors** - Wrong answers should be tempting but clearly wrong
- **No "all of the above"** - forces guessing, not knowledge
- **Consistent difficulty** - IRT difficulty should match actual difficulty

### Multi-Select Questions
- **2-4 correct answers** from 5-6 total options
- **Include "(Select all that apply)"** in question stem
- **Partial credit formula:** (correct_selected / total_correct) - (incorrect_selected × 0.5)
- **Minimum score: 0** - can't go negative

---

## UI/UX Guidelines

### Neumorphic Dark Theme
- **Background:** `#0f0f0f` (very dark gray, not pure black)
- **Shadows:**
  - Raised: `12px 12px 24px #050505, -12px -12px 24px #191919`
  - Inset: `inset 8px 8px 16px #050505, inset -8px -8px 16px #191919`
- **Primary color:** Purple gradient `#a78bfa` → `#8b5cf6`
- **Text:** `#e5e5e5` (light gray) for body, `#ffffff` for headings
- **Borders:** `1px solid rgba(139, 92, 246, 0.2)` (subtle purple glow)

### Responsive Design
- **Mobile-first approach** - design for phone, enhance for desktop
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Touch targets:** Minimum 44×44px for buttons/interactive elements
- **Font sizes:** Minimum 16px body text (prevents zoom on iOS)

### Accessibility
- **Semantic HTML** - use `<button>`, `<nav>`, `<main>`, not just `<div>`
- **Keyboard navigation** - all interactive elements accessible via Tab
- **ARIA labels** - for icon buttons and complex interactions
- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus indicators:** Visible focus rings (don't remove outline)

### Loading States
- **Skeleton screens** for content loading (not spinners)
- **Optimistic updates** where safe (e.g., local state before server confirmation)
- **Error states** with clear messages and retry options
- **Empty states** with guidance ("No questions yet - start a session!")

---

## Performance Optimization

### React Optimization
- **Server Components by default** - only use Client Components when needed (useState, useEffect)
- **Memoization sparingly** - only for expensive calculations, not premature optimization
- **Lazy loading** for heavy components (charts, performance graphs)
- **Code splitting** by route - Next.js handles this automatically

### Database Optimization
- **Limit result sets** - never fetch all questions, paginate or limit
- **Select only needed columns** - `select: { id: true, text: true }` not `select: *`
- **Indexes on query paths** - all `WHERE` clauses should use indexed columns
- **Connection pooling** - Prisma handles this, but monitor connection count

### API Response Size
- **Paginate large datasets** - max 50 items per response
- **Compress responses** - Next.js handles gzip automatically
- **Minimize JSON** - only send fields needed by client
- **Cache when possible** - question metadata can be cached (ISR)

---

## Testing Strategy

### Critical Paths Requiring Tests
1. **IRT theta calculations** - Must match mathematical formula exactly
2. **FSRS scheduling algorithm** - Must match ts-fsrs reference implementation
3. **Bloom's mastery calculation** - Weighted scoring must be accurate
4. **Confidence calibration** - Score calculation must be correct
5. **Level unlock logic** - All gates must be verified
6. **Question generation** - Must meet quality standards (Bloom's level, difficulty)

### Test Organization
```typescript
// /lib/irt/__tests__/calculateTheta.test.ts
describe('calculateTheta', () => {
  it('increases theta when performance exceeds expectation', () => {
    const result = calculateTheta({
      currentTheta: 0.0,
      difficulty: 1.0,
      performance: 1.0, // Correct answer
    });
    expect(result).toBeGreaterThan(0.0);
  });

  it('clamps theta to valid range [-3, 3]', () => {
    const result = calculateTheta({
      currentTheta: 2.9,
      difficulty: -2.0,
      performance: 1.0,
    });
    expect(result).toBeLessThanOrEqual(3.0);
  });
});
```

### Integration Tests
- **Level unlock flow** - Create user, answer questions, verify unlock at 65% mastery
- **FSRS review scheduling** - Answer card, verify next_review calculated correctly
- **Session workflow** - Complete 30-question session, verify all updates occurred

---

## Git & Version Control

### Commit Message Format
```
<type>: <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring (no behavior change)
- `perf:` Performance improvement
- `test:` Adding tests
- `docs:` Documentation only
- `chore:` Tooling, dependencies, config

### Branch Strategy
- **main** - Production-ready code, always deployable
- **develop** - Integration branch for features
- **feature/xxx** - Individual features
- **fix/xxx** - Bug fixes

### What NOT to Commit
- `.env.local` - Local environment variables (already in .gitignore)
- `node_modules/` - Dependencies (already in .gitignore)
- `.next/` - Build output (already in .gitignore)
- Personal API keys or credentials
- Large data files (use LFS or external storage)

---

## Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # Server-side only, never expose

# AI APIs
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000" # For absolute URLs
```

---

## Deployment & CI/CD

### Vercel Deployment
- **Auto-deploy from main branch** - Every push to main triggers deployment
- **Preview deployments** - Every PR gets preview URL
- **Environment variables** - Set in Vercel dashboard (NOT in repo)
- **Build command:** `npm run build`
- **Output directory:** `.next`

### Environment-Specific Config
- **Development:** `npm run dev` (localhost:3000)
- **Preview:** Vercel preview deployments (PR-specific URLs)
- **Production:** vercel.app domain or custom domain

### Database Migrations
- **Run migrations:** `npx prisma migrate deploy` (production)
- **Generate client:** `npx prisma generate` (after schema changes)
- **Seed data:** `npx prisma db seed` (initial setup only)

---

## Common Workflows

### Adding a New Bloom's Level Feature
1. Update types in `/types/learning.ts`
2. Update database schema (Prisma schema)
3. Run migration: `npx prisma migrate dev`
4. Update mastery calculation in `/lib/blooms/calculateMastery.ts`
5. Update unlock logic in `/lib/blooms/checkUnlock.ts`
6. Update UI in relevant components
7. Add tests for new logic
8. Update documentation (this file + IMPLEMENTATION_PLAN.md)

### Adding a New Question Topic
1. Add topic to question metadata schema
2. Generate 50+ questions via AI (distributed across Bloom's levels)
3. Validate question quality (IRT difficulty, Bloom's level accuracy)
4. Tag with core_intent and prerequisites
5. Import to database via seed script
6. Add topic to content balance algorithm
7. Update UI topic selector

### Debugging IRT Issues
1. Check user's theta history: `user_irt_ability.theta_history`
2. Verify question difficulty is in valid range (-3 to 3)
3. Check performance score calculation includes typed_match (L3+)
4. Verify learning_rate is decreasing over time (0.3 / (1 + q_answered/10))
5. Look for theta updates >0.5 in single question (too large, likely bug)
6. Confirm hierarchical propagation isn't creating feedback loops

### Investigating Calibration Issues
1. Check calibration_score calculation: `confidence_% - (performance × 100)`
2. Verify time-of-day pattern isn't too extreme (>±1.0 suggests data issue)
3. Look at confidence distribution (should span all 5 levels, not just 1-2)
4. Check for "always confident" or "always guessing" patterns (red flag)
5. Compare calibration across Bloom's levels (overconfidence typically at L4+)

---

## Known Limitations & Future Enhancements

### Current Limitations
- **Single subject:** Only Cybersecurity (Security+) implemented, but architecture supports multi-subject
- **English only:** No i18n/localization yet
- **Solo learning:** No collaborative features (study groups, peer review)
- **Limited question types:** MCQ and typed answers only (no drag-drop, simulations)

### Roadmap (Not Implemented Yet)
- **Multi-subject support:** Add Physics, Math, History, etc. (architecture ready)
- **Peer comparison:** Anonymized percentile rankings (opt-in)
- **Study streaks & gamification:** Achievements, badges, XP (careful not to overshadow learning)
- **Spaced repetition reminders:** Push notifications when reviews due
- **AI tutor chat:** Context-aware Q&A based on user's knowledge gaps
- **Export progress:** PDF reports, CSV data export for personal records

---

## Important Files to Reference

### Core Documentation
- `@IMPLEMENTATION_PLAN.md` - Complete system architecture (database schema, algorithms, workflows)
- `@README.md` - Project overview, getting started, feature list

### Key Components
- `@components/QuestionCard.tsx` - Multi-step question workflow (confidence → typing → selection → reflection)
- `@components/PerformancePage.tsx` - Analytics dashboard (IRT graphs, calibration, mastery tracking)
- `@services/questionGenerator.ts` - AI question generation with Bloom's level validation

### Algorithm Implementations (when built)
- `@lib/irt/calculateTheta.ts` - IRT ability updates
- `@lib/fsrs/scheduleReview.ts` - FSRS next review calculation
- `@lib/blooms/calculateMastery.ts` - Bloom's mastery percentage
- `@lib/bayesian/detectPatterns.ts` - Pattern learning algorithms

---

## Debug Checklist

When something isn't working:

### Question Display Issues
- [ ] Check question has valid bloom_level (1-6)
- [ ] Verify options array has 4 items (or 5-6 for multi-select)
- [ ] Confirm correct_answer matches one of the options
- [ ] Check for special characters breaking rendering (quotes, HTML)

### FSRS Scheduling Issues
- [ ] Verify card stability > 0 (0 or negative = bug)
- [ ] Check next_review is in future (not past)
- [ ] Confirm rating is valid enum (Again, Hard, Good, Easy)
- [ ] Look for stability > 365 days (likely calculation error)

### IRT Calculation Issues
- [ ] Theta in valid range [-3, 3]
- [ ] Difficulty in valid range (typically -2 to 2)
- [ ] Performance score is 0-1 (not percentage)
- [ ] Learning rate is 0-0.3 (not >1.0)

### Calibration Issues
- [ ] Confidence is 20, 40, 60, 80, or 95 (not 1-5)
- [ ] Performance is 0-100 (not 0-1)
- [ ] Calibration allows negative (underconfidence is negative)
- [ ] Check time-of-day bias isn't over-correcting

---

## Contact & Resources

### Team Communication
- **GitHub Issues:** Bug reports, feature requests
- **Pull Requests:** Code reviews, discussion
- **Project Board:** Task tracking, sprint planning

### External Resources
- **FSRS Algorithm:** https://github.com/open-spaced-repetition/fsrs4anki/wiki
- **IRT Theory:** https://en.wikipedia.org/wiki/Item_response_theory
- **Bloom's Taxonomy:** https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/
- **Dunning-Kruger Effect:** https://en.wikipedia.org/wiki/Dunning%E2%80%93Kruger_effect

---

## Final Reminders

### Before Every Commit
✅ Run TypeScript check: `npm run type-check`
✅ Run linter: `npm run lint`
✅ Test locally: `npm run dev` and verify changes
✅ Write descriptive commit message

### Before Every PR
✅ Rebase on latest main: `git rebase main`
✅ Run tests: `npm run test`
✅ Update documentation if needed
✅ Self-review code (look for console.logs, commented code, TODOs)

### Code Review Checklist
✅ Does it follow DRY principle? (No duplicate logic)
✅ Is it type-safe? (No `any` types)
✅ Is it accessible? (Keyboard navigation, ARIA labels)
✅ Is it performant? (No unnecessary re-renders, efficient queries)
✅ Is it secure? (Input validation, no exposed secrets)
✅ Is it tested? (Critical paths have tests)

---

**This is a living document. Update it as the project evolves.**

*Last updated: 2025-11-01*
