# Complete Website Structure

This document provides a hierarchical breakdown of every page and component in the Security+ Learning Platform.

---

## **1. Login Page** (`/`)
**Route**: `/`
**Component**: `LoginPage`

```
LoginPage
├── Background gradients (animated)
├── Logo/Title section
│   ├── App name: "Learn without limits"
│   └── Tagline
├── Authentication options
│   ├── Google Sign In button
│   └── Anonymous Sign In button
└── Error message display (if any)
```

---

## **2. Home Page** (`/home`)
**Route**: `/home`
**Component**: `HomePage`

```
HomePage
├── Header
│   ├── Logo
│   ├── Navigation links
│   └── User profile/Sign out
├── Animated background gradients
├── Hero Section
│   ├── Main headline: "Learn without limits."
│   ├── Tagline
│   └── Gradient text effects
├── Featured Subject Card - Cybersecurity (clickable)
│   ├── Icon (shield with security symbols)
│   ├── Title: "Cybersecurity"
│   ├── Description
│   ├── "Start Learning" CTA with arrow
│   └── Hover effects (scale, glow)
└── Coming Soon Section
    ├── Section header
    └── Subject cards grid (4 items)
        ├── Networking card
        │   ├── Icon (globe)
        │   ├── Title
        │   ├── Description
        │   └── "Coming Soon" badge
        ├── Maths card
        │   ├── Icon (calculator)
        │   ├── Title
        │   ├── Description
        │   └── "Coming Soon" badge
        ├── Physics card
        │   ├── Icon (atom)
        │   ├── Title
        │   ├── Description
        │   └── "Coming Soon" badge
        └── English card
            ├── Icon (book)
            ├── Title
            ├── Description
            └── "Coming Soon" badge
```

---

## **3. Cybersecurity Hub** (`/cybersecurity`)
**Route**: `/cybersecurity`
**Component**: `CybersecurityPage`

```
CybersecurityPage
├── Header
├── Animated background gradients
├── Hero Section
│   ├── Main headline: "Master Cybersecurity"
│   └── Tagline
├── Learning Options Grid (3 cards)
│   ├── Quiz Card (clickable)
│   │   ├── Icon (document with checkmark)
│   │   ├── Title: "Quiz"
│   │   ├── Description
│   │   ├── "Start Quiz" CTA
│   │   └── Hover effects
│   ├── Flashcards Card (clickable)
│   │   ├── Icon (cards stack)
│   │   ├── Title: "Flashcards"
│   │   ├── Description
│   │   ├── "Study Now" CTA
│   │   └── Hover effects
│   └── Study Materials Card (clickable)
│       ├── Icon (book)
│       ├── Title: "Study Materials"
│       ├── Description
│       ├── "Browse Materials" CTA
│       └── Hover effects
└── Feature highlights
    └── Benefits/features list
```

---

## **4. Quiz Options Page** (`/cybersecurity/quiz`)
**Route**: `/cybersecurity/quiz`
**Component**: `QuizOptionsPage`

```
QuizOptionsPage
├── Header
├── Animated background gradients
├── Hero Section
│   ├── Main headline: "Test your knowledge"
│   └── Tagline: "Choose how you want to challenge yourself"
└── Quiz Options Grid (2 cards)
    ├── Start New Quiz Card (clickable)
    │   ├── Icon (new document)
    │   ├── Title: "Start New Quiz"
    │   ├── Description: "Take 10 AI-generated synthesis questions..."
    │   ├── "Begin Quiz" CTA
    │   └── Hover effects (violet glow)
    └── Performance Card (clickable)
        ├── Icon (bar chart)
        ├── Title: "Performance"
        ├── Description: "View your scores, IRT analysis..."
        ├── "View Stats" CTA
        └── Hover effects (cyan glow)
```

---

## **5. Quiz Page** (`/cybersecurity/quiz/start`)
**Route**: `/cybersecurity/quiz/start`
**Component**: `QuizPage`

```
QuizPage
├── Header
├── Animated background gradients
├── Progress Section
│   ├── Question counter: "Question X of 10"
│   ├── Progress bar (visual)
│   └── Progress percentage
├── Loading States
│   ├── Initial loading spinner
│   └── "Generating next question..." spinner
├── ACTIVE QUIZ MODE (before submission):
│   ├── QuestionCard
│   │   ├── Question text
│   │   ├── "Select all that apply" banner (if multiple choice)
│   │   │   ├── Instruction text
│   │   │   └── Glass morphism styling
│   │   └── Answer Options (A, B, C, D)
│   │       ├── Radio button/checkbox indicator
│   │       ├── Option letter (A, B, C, D)
│   │       ├── Option text
│   │       ├── Hover effects (glow, scale)
│   │       └── Selection state (white border/shadow)
│   └── Submit Answer Button
│       ├── Disabled state (no answer selected)
│       ├── Enabled state (answer selected)
│       └── Hover effects (violet glow)
└── REVIEW MODE (after submission):
    ├── Question Number Header
    │   ├── Number badge (glass styled)
    │   └── "Question X" text
    ├── QuestionCard (review mode)
    │   ├── Question text
    │   └── Answer Options (colored by correctness)
    │       ├── Correct answers:
    │       │   ├── Green border/background/shadow
    │       │   ├── Green gradient overlay
    │       │   └── "Correct" badge (multiple choice only)
    │       ├── Incorrect selected answers:
    │       │   ├── Red border/background/shadow
    │       │   ├── Red gradient overlay
    │       │   └── "Incorrect" badge (multiple choice only)
    │       └── Unselected answers:
    │           └── Neutral gray styling
    ├── ExplanationSection
    │   ├── Status Card (glass morphism)
    │   │   ├── Status header:
    │   │   │   ├── "Correct!" (green)
    │   │   │   ├── "Incorrect" (red)
    │   │   │   └── "Partially Correct" (yellow)
    │   │   ├── Correct Answer display (if user was wrong)
    │   │   │   ├── Label: "Correct Answer:" / "Correct Answers:"
    │   │   │   └── Answer(s) with letter labels
    │   │   └── Explanation section
    │   │       ├── Label: "Explanation:"
    │   │       └── Detailed explanation text
    │   └── Why Other Options Are Incorrect (collapsible)
    │       ├── Collapsible header (clickable)
    │       │   ├── Title text
    │       │   ├── Dropdown arrow (rotates when expanded)
    │       │   └── Hover effect
    │       └── Collapsed content (when expanded)
    │           └── List of incorrect options with explanations
    ├── QuestionMetadata
    │   ├── Domain(s) badges
    │   │   └── Pill-shaped badges with domain names
    │   ├── Topic(s) badges
    │   │   └── Pill-shaped badges with topic codes
    │   ├── Difficulty badge
    │   │   ├── Easy (green)
    │   │   ├── Medium (yellow)
    │   │   └── Hard (red)
    │   └── Question Type badge
    │       ├── Single Domain, Single Topic
    │       ├── Single Domain, Multiple Topics
    │       └── Multiple Domains, Multiple Topics
    ├── Next Button
    │   ├── Disabled state (generating next question)
    │   ├── Enabled state
    │   └── Hover effects (violet glow)
    └── Celebration Animation (on quiz completion)
        ├── Confetti effect
        ├── Success message
        ├── Score display
        └── "View Performance" button
```

---

## **6. Quiz Review Page** (`/cybersecurity/quiz/review/[quizId]`)
**Route**: `/cybersecurity/quiz/review/[quizId]`
**Component**: `QuizReviewPage`

```
QuizReviewPage
├── Header
├── Animated background gradients
├── Quiz Summary Header
│   ├── Title: "Quiz Review"
│   ├── Quiz metadata
│   │   ├── Date taken
│   │   ├── Time taken
│   │   └── Number of questions
│   ├── Score display
│   │   ├── Score fraction (X/10)
│   │   ├── Percentage
│   │   └── "Incomplete Quiz" badge (if applicable)
│   └── Loading state (spinner)
├── Questions List (all questions in quiz)
│   └── For each question:
│       ├── Question Number Header
│       │   ├── Number badge
│       │   └── "Question X" text
│       ├── QuestionCard (review mode)
│       │   ├── Question text
│       │   └── Answer Options (colored)
│       │       ├── Correct answers (green)
│       │       ├── Incorrect selected (red)
│       │       └── Unselected (neutral)
│       ├── ExplanationSection
│       │   ├── Status header with color
│       │   ├── Correct answer (if wrong)
│       │   ├── Explanation
│       │   └── Why Other Options Are Incorrect (collapsible)
│       └── QuestionMetadata
│           ├── Domains
│           ├── Topics
│           ├── Difficulty
│           └── Type
└── Back to Performance Button
    └── Returns to performance page
```

---

## **7. Performance Page** (`/cybersecurity/performance`)
**Route**: `/cybersecurity/performance`
**Component**: `PerformancePage`

```
PerformancePage
├── Header
├── Animated background gradients
├── Hero Section
│   ├── Title: "Your Performance"
│   └── Tagline
├── Summary Statistics Section
│   ├── Predicted Exam Score Card (collapsible)
│   │   ├── Dropdown toggle button
│   │   │   ├── Title
│   │   │   └── Arrow icon (rotates)
│   │   └── Expanded content:
│   │       ├── Score subtitle
│   │       │   ├── "Based on X questions"
│   │       │   └── Confidence level (color-coded)
│   │       ├── Score range display (multi-colored)
│   │       │   ├── Lower bound (red/yellow/green)
│   │       │   ├── Dash separator
│   │       │   └── Upper bound (red/yellow/green)
│   │       ├── "out of 900" text
│   │       ├── Progress bar (multi-segment)
│   │       │   ├── Red segment (100-599)
│   │       │   ├── Yellow segment (600-749)
│   │       │   └── Green segment (750-900)
│   │       └── Scale labels (100, 750, 900)
│   ├── Quick Stats Grid (3 cards)
│   │   ├── Total Questions card
│   │   │   ├── Icon
│   │   │   ├── Number
│   │   │   └── Label
│   │   ├── Accuracy card
│   │   │   ├── Icon
│   │   │   ├── Percentage
│   │   │   └── Label
│   │   └── Correct Answers card
│   │       ├── Icon
│   │       ├── Number
│   │       └── Label
│   └── Performance Analysis Section (collapsible)
│       ├── Dropdown toggle button
│       └── Expanded content:
│           ├── Ability Level display
│           │   ├── Label with tooltip
│           │   ├── Ability range (multi-colored)
│           │   │   ├── Lower bound (red/yellow/green)
│           │   │   ├── Dash separator
│           │   │   └── Upper bound (red/yellow/green)
│           │   └── Progress bar (multi-segment)
│           │       ├── Red segment (<-1.0)
│           │       ├── Yellow segment (-1.0 to 1.0)
│           │       └── Green segment (≥1.0)
│           └── Performance Insights
│               ├── Section title
│               └── Insights list (bullet points)
├── PerformanceGraphs (collapsible)
│   ├── Dropdown toggle button
│   └── Expanded content:
│       ├── Score Over Time graph
│       │   ├── Line chart
│       │   ├── X-axis (quiz number)
│       │   └── Y-axis (score out of 10)
│       ├── Accuracy Over Time graph
│       │   ├── Line chart
│       │   ├── X-axis (quiz number)
│       │   └── Y-axis (percentage)
│       └── Ability Level Over Time graph
│           ├── Line chart with confidence band
│           ├── X-axis (quiz number)
│           └── Y-axis (ability level)
├── Topic Coverage by Domain (collapsible)
│   ├── Dropdown toggle button
│   └── Expanded content:
│       └── Domain tables (one per domain)
│           ├── Domain header (collapsible)
│           │   ├── Domain name
│           │   └── Arrow icon
│           └── Topic coverage table
│               ├── Topic column
│               ├── Questions column
│               ├── Correct column
│               └── Accuracy column
├── Quiz History Section
│   ├── Section title: "Quiz History"
│   └── Quiz cards list
│       └── For each quiz:
│           ├── Quiz card (clickable to review)
│           │   ├── Date and time
│           │   ├── Score (X/10, percentage)
│           │   ├── Duration
│           │   ├── "Incomplete" badge (if applicable)
│           │   ├── Difficulty breakdown
│           │   ├── Accuracy
│           │   └── Delete button
│           └── Delete confirmation modal
│               ├── Warning message
│               ├── Confirm button
│               └── Cancel button
└── Reset Progress Button
    ├── Warning styling (red)
    └── Confirmation dialog
```

---

## **8. Flashcards Hub** (`/cybersecurity/flashcards`)
**Route**: `/cybersecurity/flashcards`
**Component**: `FlashcardsPage`

```
FlashcardsPage
├── Header
├── Animated background gradients
├── Hero Section
│   ├── Title: "Flashcards"
│   └── Tagline
└── Flashcard Options Grid (4 cards)
    ├── Study Flashcards Card
    │   ├── Icon
    │   ├── Title: "Study Flashcards"
    │   ├── Description
    │   └── "Start Studying" CTA
    ├── Create Flashcards Card
    │   ├── Icon
    │   ├── Title: "Create Flashcards"
    │   ├── Description
    │   └── "Create from PDF" CTA
    ├── Search Flashcards Card
    │   ├── Icon
    │   ├── Title: "Search Flashcards"
    │   ├── Description
    │   └── "Search Now" CTA
    └── Performance Card
        ├── Icon
        ├── Title: "Performance"
        ├── Description
        └── "View Stats" CTA
```

---

## **9. Flashcards Study Page** (`/cybersecurity/flashcards/study`)
**Route**: `/cybersecurity/flashcards/study`
**Component**: `FlashcardsStudyPage`

```
FlashcardsStudyPage
├── Header
├── Animated background gradients
├── Progress Section
│   ├── Card counter: "Card X of Y"
│   └── Progress bar
├── Flashcard Display
│   ├── Card container (flippable)
│   │   ├── Front side
│   │   │   ├── "Question" label
│   │   │   ├── Question text
│   │   │   └── "Tap to reveal answer" hint
│   │   └── Back side (after flip)
│   │       ├── "Answer" label
│   │       ├── Answer text
│   │       └── "Tap to flip back" hint
│   └── Flip animation (3D transform)
├── Navigation Controls
│   ├── Previous button
│   │   ├── Arrow icon
│   │   ├── Disabled state (first card)
│   │   └── Hover effects
│   ├── Flip button
│   │   ├── "Reveal Answer" / "Show Question"
│   │   └── Hover effects
│   └── Next button
│       ├── Arrow icon
│       ├── Disabled state (last card)
│       └── Hover effects
└── Card Status Indicators
    ├── Current card indicator
    └── Total cards count
```

---

## **10. Flashcards Create Page** (`/cybersecurity/flashcards/create`)
**Route**: `/cybersecurity/flashcards/create`
**Component**: `FlashcardsCreatePage`

```
FlashcardsCreatePage
├── Header
├── Animated background gradients
├── Hero Section
│   ├── Title: "Create Flashcards from PDF"
│   └── Instructions
├── Upload Section
│   ├── File upload area (drag & drop)
│   │   ├── Upload icon
│   │   ├── "Choose file or drag here"
│   │   ├── Supported formats text
│   │   └── File size limit
│   ├── Selected file display
│   │   ├── File name
│   │   ├── File size
│   │   └── Remove button
│   └── Generate button
│       ├── Disabled state (no file)
│       ├── Loading state (processing)
│       └── Enabled state
├── Generation Progress (while processing)
│   ├── Progress spinner
│   ├── Status message
│   └── Processing percentage
└── Generated Flashcards Preview
    ├── Section title
    ├── Cards count
    ├── Preview cards list
    │   └── For each card:
    │       ├── Card number
    │       ├── Question preview
    │       ├── Answer preview (truncated)
    │       └── Edit/Delete buttons
    └── Action buttons
        ├── Save Flashcards button
        ├── Regenerate button
        └── Cancel button
```

---

## **11. Flashcards Search Page** (`/cybersecurity/flashcards/search`)
**Route**: `/cybersecurity/flashcards/search`
**Component**: `FlashcardsSearchPage`

```
FlashcardsSearchPage
├── Header
├── Animated background gradients
├── Hero Section
│   └── Title: "Search Flashcards"
├── Search Section
│   ├── Search input
│   │   ├── Search icon
│   │   ├── Placeholder text
│   │   └── Clear button (when text entered)
│   └── Filter options
│       ├── Topic filter dropdown
│       ├── Difficulty filter
│       └── Date range filter
├── Search Results
│   ├── Results count
│   ├── Sort options
│   │   ├── By relevance
│   │   ├── By date created
│   │   └── By difficulty
│   └── Results list
│       └── For each result:
│           ├── Card preview
│           │   ├── Question text
│           │   ├── Answer snippet
│           │   ├── Topic badge
│           │   └── Created date
│           └── Action buttons
│               ├── Study button
│               ├── Edit button
│               └── Delete button
└── Empty State (no results)
    ├── Empty icon
    ├── "No flashcards found" message
    └── Suggestions
```

---

## **12. Flashcards Performance Page** (`/cybersecurity/flashcards/performance`)
**Route**: `/cybersecurity/flashcards/performance`
**Component**: `FlashcardsPerformancePage`

```
FlashcardsPerformancePage
├── Header
├── Animated background gradients
├── Hero Section
│   └── Title: "Flashcard Performance"
├── Summary Statistics
│   ├── Total Cards Studied card
│   ├── Study Sessions card
│   ├── Average Accuracy card
│   └── Mastery Level card
├── Study Activity Graph
│   ├── Bar chart
│   ├── X-axis (date)
│   └── Y-axis (cards studied)
├── Mastery Breakdown
│   ├── Pie chart or donut chart
│   └── Categories:
│       ├── Mastered (green)
│       ├── Learning (yellow)
│       └── New (gray)
├── Topics Performance
│   └── Topic cards list
│       └── For each topic:
│           ├── Topic name
│           ├── Cards count
│           ├── Mastery percentage
│           └── Progress bar
└── Study History
    └── Session cards list
        └── For each session:
            ├── Date and time
            ├── Cards studied
            ├── Duration
            └── Accuracy
```

---

## **Common Components Used Across Pages**

### **Header** (appears on all authenticated pages)
```
Header
├── Logo/Brand
├── Navigation Menu
│   ├── Home link
│   ├── Cybersecurity link
│   └── Other links
├── Settings button (optional)
│   └── Dropdown menu
│       ├── Liquid Glass toggle
│       └── Other settings
└── User Section
    ├── User avatar/name
    └── Sign Out button
```

### **Loading States**
```
LoadingSpinner
├── Animated spinner
├── Loading message
└── Glass morphism container
```

### **Error States**
```
ErrorDisplay
├── Error icon
├── Error message
└── Retry button (if applicable)
```

### **Empty States**
```
EmptyState
├── Empty icon/illustration
├── "No data" message
└── Suggested action
```

---

## **Styling Themes**

### **Liquid Glass Mode** (when enabled)
- Glass morphism effects (backdrop-blur, transparency)
- Animated gradient backgrounds
- Subtle shadows and glows
- Rounded corners (rounded-[40px])
- Border overlays (white/10)

### **Standard Mode** (when disabled)
- Solid backgrounds (zinc-900, zinc-950)
- Traditional borders (zinc-700, zinc-800)
- Monospace font option
- Standard rounded corners (rounded-md)

---

## **Color Coding System**

### **Performance Colors**
- **Green** (emerald-400): Correct, High performance, Passing (750-900)
- **Yellow**: Medium performance, Caution (600-749)
- **Red**: Incorrect, Low performance, Failing (100-599)
- **Violet/Purple**: Interactive elements, CTAs, selected states
- **Cyan/Blue**: Secondary actions, information
- **White/Gray**: Neutral elements, text

### **Difficulty Colors**
- **Green**: Easy questions
- **Yellow**: Medium questions
- **Red**: Hard questions

---

**Last Updated**: 2025-01-27
**Total Pages**: 12 main pages + multiple sub-components
**Total Components**: 20+ unique components
