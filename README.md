# Security+ SY0-701 Learning Platform

An AI-powered web application for CompTIA Security+ SY0-701 certification exam preparation featuring intelligent adaptive testing with FSRS-based topic scheduling, comprehensive performance analytics with confidence intervals, and flashcard study system with spaced repetition.

## Features

### Quiz Mode with Adaptive Testing & FSRS Scheduling

- **AI-Generated Synthesis Questions**: Creates complex questions combining multiple security concepts using xAI Grok (grok-4-fast-reasoning for generation, grok-4-fast-non-reasoning for topic identification)
- **FSRS-Powered Topic Selection**: Uses Free Spaced Repetition Scheduler algorithm to determine which topics appear in your quiz based on:
  - Topic stability and difficulty
  - Time since last review
  - Your performance history on each topic
  - Three adaptive phases (Coverage → Practice → Mastery)
- **AI-Based Topic Identification**: Uses vision-based semantic understanding to accurately identify which topics each question tests (no false positives from distractors)
- **Deterministic Difficulty Classification**: Questions are automatically classified based on topic/domain complexity:
  - **EASY (100 points)**: Single domain, single topic questions
  - **MEDIUM (175 points)**: Single domain, multiple topics questions
  - **HARD (325 points)**: Multiple domains, multiple topics questions
- **Anti-Telltale Quality Controls**: Advanced quality measures prevent obvious answer giveaways:
  - Length variation across all options (prevents length-based guessing)
  - Plausible distractors from same domain (prevents obvious elimination)
  - Keyword avoidance (prevents simple matching strategies)
  - Balanced technical depth (all options equally professional)
  - Subtle incorrectness (wrong answers are "close but not quite right")
- **Instant Start with On-Demand Generation**: First question appears in ~10 seconds, remaining questions generate automatically in the background
- **Progressive Loading**: Zero wait time between questions - next question is always ready when you click "Next"
- **Multiple-Response Questions**: Includes "select all that apply" questions with partial credit support
- **Item Response Theory (IRT) Scoring**: Advanced psychometric scoring system that weighs questions by difficulty
- **Confidence Intervals**: Statistical confidence intervals shown for ability estimates and predicted scores
- **Partial Credit System**: Earn proportional points for partially correct answers on multiple-response questions
- **Intelligent Score Prediction**: IRT-based ability estimation predicts your exam score (100-900 scale)
- **Cross-Device Resume**: Quiz state saved to cloud, resume on any device
- **Local Storage Backup**: Quiz auto-saved to localStorage for reliability

### Performance Analytics & Progress Tracking

- **6 Interactive Performance Graphs**:
  1. **Ability Level Over Time**: Track your IRT ability (θ) progression with confidence intervals
  2. **Predicted Score Over Time**: Monitor your exam readiness with 750 passing threshold and confidence bands
  3. **Accuracy by Difficulty**: See performance breakdown across easy/medium/hard questions
  4. **Performance by Domain**: Track coverage and accuracy across all 5 SY0-701 domains
  5. **Individual Domain Performance**: Collapsible detailed view for each domain
  6. **Topic Coverage by Domain**: Shows all topics organized by their domains
- **IRT Performance Insights**: Dynamic, specific insights generated from your IRT performance data considering:
  - Overall ability level and confidence
  - Performance by question category (single/multi-domain, single/multi-topic)
  - Difficulty-specific performance patterns
  - Statistical significance of patterns
- **Topic Review Schedule**: FSRS-based scheduling showing which topics are due for review:
  - Overdue topics (need immediate review)
  - Due now (scheduled for current quiz)
  - Due soon (coming up in next few quizzes)
  - Future topics (well-learned, long intervals)
- **Quiz History**: Review all past quizzes with detailed breakdowns
- **Export/Import Progress**: Backup and restore your performance data
  - Export all quiz history and performance metrics to JSON
  - Import with merge or replace options
  - Automatic recalculation of all metrics after import
- **Confidence Intervals**: Wilson score intervals and IRT standard errors for statistical accuracy
- **Cross-Session Topic Tracking**: Comprehensive tracking of performance across all SY0-701 topics with FSRS scheduling

### Flashcard Mode with Spaced Repetition

- **Manual Flashcard Creation**: Create custom flashcards with terms, definitions, and optional context
- **Image Support**: Add images to flashcards with Firebase Storage integration (up to 5MB per image)
- **Image Lightbox**: Click images to view enlarged versions with zoom functionality
- **Spaced Repetition (FSRS Algorithm)**: Intelligent review scheduling using the Free Spaced Repetition Scheduler
  - **Again** (<1 min): Reset card, review immediately
  - **Hard** (~6 hours): Difficult recall, reduced interval
  - **Good** (~10 hours): Normal progression
  - **Easy** (4 days): Perfect recall, increased interval
- **Interactive Flip Cards**: Click to flip between term and definition
- **Search Functionality**: Quickly find flashcards by term, definition, domain, or source file
- **Progress Tracking**: Monitor Learning, Review, and Mastered cards
- **Reset Progress**: Clear all review history while keeping flashcards
- **Manual Creation & Editing**: Create or edit flashcards with custom terms, definitions, context, and images

### User Experience

- **Google Sign-In**: Secure authentication via Google OAuth
- **Anonymous Mode**: Try the app without signing in (data not persisted)
- **Cloud Sync**: All progress and flashcards automatically saved to Firebase (Firestore + Storage)
- **Comprehensive Progress Tracking**: Track answered questions, points earned, ability estimate, predicted exam score, and topic mastery
- **Liquid Glass UI**: Modern, eye-friendly interface with glassmorphism design
- **Smart Question Management**: Never repeats previously answered questions within a quiz session
- **Detailed Explanations**: Learn why correct answers are right and incorrect answers are wrong
- **Question Metadata**: Each question shows domains, topics, difficulty, question type, and points
- **Flexible Quiz Flow**: Save and end quiz anytime, resume later on any device
- **Reset Progress**: Clear quiz progress with localStorage cleanup
- **Quiz Review**: Review completed quizzes with full question details and your answers
- **Delete Quizzes**: Remove individual quizzes from history with automatic stat recalculation

## Tech Stack

- **Frontend**: Next.js 15.5.6 (App Router), React 19, TypeScript, Tailwind CSS
- **Charting**: Recharts 3.3.0 for data visualization
- **AI**:
  - xAI Grok (grok-4-fast-reasoning) - Question generation
  - xAI Grok (grok-4-fast-non-reasoning) - Topic identification
  - OpenAI text-embedding-3-small - Question similarity detection (deduplication)
- **Backend**: Firebase (Firestore Database + Firebase Storage + Google Authentication)
- **Image Hosting**: Firebase Storage with CORS configuration
- **Spaced Repetition**: ts-fsrs 5.2.3 (FSRS algorithm for both flashcards and quiz topic scheduling)
- **Deployment**: Vercel with automatic CI/CD

## How It Works

### Quiz Mode with FSRS Topic Scheduling

1. **Google Authentication**: Users sign in with Google OAuth for secure access (or use anonymously)
2. **FSRS Topic Selection**:
   - System uses FSRS algorithm to determine which topics should appear in your next quiz
   - Three adaptive phases:
     - **Phase 1 (Coverage)**: Cover all topics at least once
     - **Phase 2 (Practice)**: Focus on weak topics while maintaining strong ones
     - **Phase 3 (Mastery)**: Optimal spaced repetition for long-term retention
   - Topics scheduled based on stability, difficulty, and time since last review
3. **On-Demand Question Generation**:
   - First question generates immediately (~10 seconds)
   - Subsequent questions generate automatically in the background
   - Each new question triggers generation of the next one
   - Zero wait time between questions for seamless experience
4. **AI Question Generation**: xAI Grok creates unique synthesis questions from comprehensive SY0-701 exam objectives
5. **AI-Based Topic Identification**:
   - After generation, Grok Vision analyzes the question to identify which topics it actually tests
   - Uses semantic understanding with vision capabilities for consistency
   - Considers only what's required to answer correctly (ignores distractors)
   - Provides exact topic strings from the Security+ SY0-701 topic inventory
6. **Deterministic Difficulty Classification**:
   - System counts topics and domains from AI-identified topics
   - Classification logic:
     - 1 topic, 1 domain → **EASY** (100 points)
     - Multiple topics, 1 domain → **MEDIUM** (175 points)
     - Multiple topics, Multiple domains → **HARD** (325 points)
7. **Partial Credit**: Multiple-response questions award proportional credit
8. **IRT Analysis**: System estimates your ability level (theta) using Maximum Likelihood Estimation
9. **Confidence Intervals**: Statistical confidence bands shown for predictions
10. **Score Prediction**: Maps your ability estimate to the 100-900 exam score scale
11. **FSRS Update**: After each quiz, FSRS algorithm updates topic schedules based on performance
12. **Cloud Sync**: All progress stored in Firestore and synced across devices
13. **Local Backup**: Quiz state saved to localStorage for reliability

### Performance Analytics System

1. **Ability Level Over Time**: Line chart showing θ progression with confidence intervals
2. **Predicted Score Over Time**: Line chart tracking score estimates with confidence bands and passing threshold (750)
3. **Accuracy by Difficulty**: Bar chart showing percentage correct for easy/medium/hard questions
4. **Domain Performance**: Horizontal bar chart showing accuracy across all 5 SY0-701 domains
5. **Individual Domain Tables**: Collapsible tables showing detailed stats for each domain
6. **Topic Coverage**: Tables showing all topics with coverage count and accuracy
7. **IRT Performance Insights**: AI-generated insights analyzing your performance patterns
8. **Topic Review Schedule**: FSRS-based display of due topics and upcoming reviews
9. **Quiz History**: Clickable cards showing all past quizzes with stats
10. **Export/Import**: Backup and restore progress with automatic recalculation

### Flashcard System

1. **Manual Creation**: Create flashcards with term, definition, optional context, and domain
2. **Image Upload**: Optional image attachments stored in Firebase Storage
3. **Flashcard Storage**: Flashcards saved to Firestore with user association
4. **Spaced Repetition**: FSRS algorithm calculates optimal review intervals
5. **Review Tracking**: System monitors each card's review history and next due date
6. **Automatic Scheduling**: Cards appear when due based on spaced repetition algorithm
7. **Search & Filter**: Real-time search across terms, definitions, domains
8. **Edit & Delete**: Modify or remove flashcards at any time

## Question Types & Distribution

**Difficulty Levels (Deterministic Classification):**
- **EASY** (100 points): Single domain, single topic - Straightforward concept testing
- **MEDIUM** (175 points): Single domain, multiple topics - Applying 2-3 related concepts
- **HARD** (325 points): Multiple domains, multiple topics - Complex cross-domain synthesis

**Question Types:**
- **Single-Choice**: Select one correct answer from four options
- **Multiple-Response**: Select all correct answers with partial credit

## Progress Tracking & IRT Scoring

**IRT Ability Estimation (θ):**
- Range: -3 (beginner) to +3 (expert)
- Calculated using Maximum Likelihood Estimation (MLE)
- Accounts for question difficulty and discrimination parameters
- Statistical confidence intervals provided

**Score Prediction Mapping:**
- θ = -3: ~160 (very low ability)
- θ = -1: ~420 (below average)
- θ = 0: ~550 (average ability)
- θ = +1: ~680 (above average)
- θ = +2: ~810 (high ability)
- θ = +3: ~900 (expert ability)

**Passing Score**: 750/900 (requires θ ≈ +1.5)

**Performance Metrics:**
- Total questions answered
- Points earned vs. maximum possible points
- Overall accuracy percentage
- IRT ability estimate with standard error
- Predicted exam score with confidence interval
- Domain-specific accuracy
- Difficulty-specific accuracy
- Topic mastery tracking with FSRS scheduling

## FSRS Topic Scheduling

**Three Adaptive Phases:**

1. **Phase 1: Coverage** - Ensure all topics covered at least once
2. **Phase 2: Practice** - Focus on weak topics while maintaining strong ones
3. **Phase 3: Mastery** - Optimal spaced repetition for long-term retention

**Topic Selection Algorithm:**
- Overdue topics (past review date) selected first
- Struggling topics (low accuracy, frequent lapses) prioritized
- Phase-appropriate topic selection
- Balanced representation across domains
- FSRS stability and difficulty factored in

**Benefits:**
- Efficient study time allocation
- Automatic focus on weak areas
- Long-term retention optimization
- Natural progression from novice to expert

## Export/Import System

**Export Features:**
- Download complete performance data as JSON
- Includes all quiz history, questions, and answers
- Includes all performance metrics and FSRS state
- Timestamped backup files

**Import Features:**
- Two modes: Merge (add to existing) or Replace (overwrite)
- Automatic data validation
- Recalculation of all performance metrics
- FSRS state reconstruction from quiz history
- Safe two-dialog confirmation flow

**Use Cases:**
- Regular backups before major changes
- Transfer data between accounts
- Recover from accidental resets
- Archive historical progress

## Technology Details

**IRT Implementation:**
- 2-Parameter Logistic (2PL) Model
- Maximum Likelihood Estimation (MLE) for ability calculation
- Fisher Information for standard error
- Partial credit support for multiple-response questions
- Calibrated parameters per difficulty level

**FSRS Implementation:**
- ts-fsrs 5.2.3 library
- Tracks stability, difficulty, and retrievability per topic
- Updates after each quiz based on performance
- Three-phase adaptive system
- Integrates with IRT ability estimates

**AI Question Quality System:**
- xAI Grok for generation and topic identification
- Anti-telltale controls built into prompts
- Deterministic classification logic
- Semantic topic extraction
- Deduplication via embeddings

**Data Visualization:**
- Recharts library for responsive charts
- Interactive tooltips with detailed statistics
- Color-coded performance indicators
- Confidence interval visualizations
- Collapsible sections for information density

**Performance Optimization:**
- On-demand question generation
- Background sequential generation
- Question caching for next session
- Efficient Firestore queries
- Client-side calculation caching
- Subcollection architecture for scalability

## Developer Documentation

**Before implementing new features, read these guides:**

1. **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)** - Workflow to prevent code duplication
2. **[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** - Available shared components and utilities
3. **[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)** - How to refactor duplicate code

**Golden Rule:** Search before you code. If a pattern exists, reuse it. If it will be used 2+ times, make it shared.

---

---

## Professional Development Standards

This project follows enterprise-grade web development standards with a focus on performance, security, and accessibility.

### Design System

**Design Tokens** (`/styles/design-tokens.css`):
- Comprehensive CSS custom properties for colors, typography, spacing, shadows
- Light/dark theme support with `[data-theme]` selector
- High contrast mode support (`prefers-contrast: high`)
- Reduced motion support (`prefers-reduced-motion: reduce`)
- WCAG 2.2 AA compliant color contrasts

**Usage:**
```css
/* Use tokens instead of hard-coded values */
.button {
  background: var(--color-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}
```

### Security Headers

Configured in `next.config.mjs` following OWASP guidelines:

- **HSTS**: 2-year max-age with includeSubDomains and preload
- **CSP**: Strict Content Security Policy
- **X-Frame-Options**: DENY (clickjacking protection)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricted camera, microphone, geolocation

**Verify headers:**
```bash
curl -I https://securityplusai.com | grep -i "security\|strict\|content-security"
```

### SEO & Metadata

**Comprehensive metadata** in `app/layout.tsx`:
- Dynamic page titles with template
- Open Graph tags for social sharing
- Twitter Card meta tags
- Keywords and structured descriptions
- Canonical URLs

**Structured Data** (JSON-LD):
- Organization schema
- WebSite schema
- WebApplication schema
- Course schema
- FAQPage schema

**Sitemap & Robots:**
- Dynamic sitemap at `/sitemap.xml` (generated from `app/sitemap.ts`)
- Robots.txt at `/public/robots.txt`

**Validate SEO:**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### Accessibility (WCAG 2.2 AA)

**Implemented:**
- ✅ Semantic HTML with proper heading hierarchy
- ✅ ARIA labels on interactive elements
- ✅ Focus-visible styles (`outline: 2px solid var(--color-border-focus)`)
- ✅ Keyboard navigation support
- ✅ Skip-to-content link (`.skip-to-content` class)
- ✅ Color contrast ratios ≥ 4.5:1
- ✅ Reduced motion support
- ✅ Screen reader announcements

**Test Accessibility:**
```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Run Lighthouse accessibility audit
npx lighthouse https://securityplusai.com --only-categories=accessibility
```

### Error Handling

**Error Boundary** (`components/ErrorBoundary.tsx`):
- Catches JavaScript errors in component tree
- Displays user-friendly fallback UI
- Logs errors to console (extend to send to error tracking service)
- Graceful degradation with "Try Again" and "Go to Homepage" actions

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Performance Targets

**Core Web Vitals:**
- LCP (Largest Contentful Paint): ≤ 2.5s
- INP (Interaction to Next Paint): ≤ 200ms
- CLS (Cumulative Layout Shift): ≤ 0.1

**Optimizations:**
- Image optimization (AVIF/WebP) via Next.js Image component
- Code splitting (automatic route-based)
- CSS optimization (design tokens, Tailwind purging)
- Compression (Brotli/Gzip enabled)
- `poweredByHeader: false` to remove X-Powered-By

**Monitor Performance:**
```bash
# Lighthouse audit
npx lighthouse https://securityplusai.com --view

# Check bundle size
npm run build
# Review output in .next/
```

### Development Workflow

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables** (`.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_key
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm run start
```

5. **Lint and format:**
```bash
npm run lint
```

### Deployment Checklist

**Pre-Deployment:**
- [ ] Environment variables configured in Vercel/hosting platform
- [ ] Security headers verified
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals meet targets
- [ ] Error boundary tested
- [ ] Authentication flow tested
- [ ] Data export/import tested

**Post-Deployment:**
- [ ] Verify HTTPS and HSTS headers
- [ ] Test structured data with Google Rich Results Test
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor Core Web Vitals in Vercel Analytics
- [ ] Check error logs in Vercel deployment logs
- [ ] Verify CSP not blocking required resources

### Production Environment Variables

Required for deployment:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI APIs
NEXT_PUBLIC_GOOGLE_AI_API_KEY=
# Optional:
OPENAI_API_KEY=
```

### Monitoring & Observability

**Error Tracking** (to be implemented):
- Integrate Sentry or similar service
- Uncomment error tracking in `ErrorBoundary.tsx`
- Add error tracking to API routes

**Analytics** (privacy-first):
- Consider Vercel Analytics (built-in)
- Or privacy-focused alternatives (Plausible, Fathom)

**Performance Monitoring:**
- Vercel Speed Insights
- Real User Monitoring (RUM) via Core Web Vitals API

### Security Best Practices

1. **Never commit secrets**: Use `.env.local` (gitignored)
2. **Validate all inputs**: Client and server-side
3. **Use secure cookies**: HttpOnly, Secure, SameSite
4. **Keep dependencies updated**:
```bash
npm audit
npm audit fix
```
5. **Review CSP violations**: Check browser console
6. **Regular security audits**: Use tools like Snyk, npm audit

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow existing code style (TypeScript strict mode, ESLint/Prettier)
4. Add tests for new features (when testing framework is set up)
5. Ensure accessibility standards are met
6. Update documentation as needed
7. Commit with clear messages
8. Push to your branch
9. Open a Pull Request

---

## License

MIT
