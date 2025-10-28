# Page Component Structures

Complete hierarchical breakdown of every page in the exact structure format.

---

## **1. Login Page** (`/`)

```
LoginPage
├── Animated Background Gradients
│   ├── Top-left violet gradient blob
│   ├── Bottom-right cyan gradient blob
│   └── Center emerald gradient blob
├── Logo/Title Section
│   ├── Main headline: "Learn without limits."
│   └── Tagline: "Your adaptive learning companion"
├── Authentication Section
│   ├── Google Sign In Button
│   │   ├── Google icon
│   │   ├── "Sign in with Google" text
│   │   └── Hover effects (scale, shadow)
│   └── Anonymous Sign In Button
│       ├── User icon
│       ├── "Continue as Guest" text
│       └── Hover effects
└── Error Message Display
    └── Error text (if authentication fails)
```

---

## **2. Home Page** (`/home`)

```
HomePage
├── Header
│   ├── Logo
│   ├── Navigation links
│   │   ├── Home
│   │   └── Cybersecurity
│   └── User section
│       ├── User avatar/name
│       └── Sign out button
├── Animated Background Gradients
│   ├── Top-left violet gradient blob
│   ├── Bottom-right cyan gradient blob
│   └── Center emerald gradient blob
├── Hero Section
│   ├── Main Headline
│   │   ├── "Learn without" (white gradient)
│   │   └── "limits." (colored gradient)
│   └── Tagline
│       └── "Your adaptive learning companion powered by AI and spaced repetition"
├── Featured Subject Section
│   └── Cybersecurity Card (Large, clickable)
│       ├── Background (glass morphism with border)
│       ├── Gradient overlay (violet on hover)
│       ├── Icon Container
│       │   ├── Shield icon with security symbols
│       │   └── Glass background with border
│       ├── Content
│       │   ├── Title: "Cybersecurity"
│       │   ├── Description text
│       │   └── CTA with arrow
│       │       ├── "Start Learning" text
│       │       └── Arrow icon (translates on hover)
│       └── Hover effects (scale, shadow, glow)
└── Coming Soon Section
    ├── Section Header
    │   ├── Title: "More subjects coming soon"
    │   └── Subtitle: "Expanding your learning possibilities"
    └── Subject Cards Grid (4 cards, 2x2 on mobile, 4x1 on desktop)
        ├── Networking Card
        │   ├── Icon (globe/network)
        │   ├── Title: "Networking"
        │   ├── Description: "Network protocols and infrastructure"
        │   ├── "Coming Soon" badge
        │   │   ├── Pulsing dot indicator
        │   │   └── Badge text
        │   └── Reduced opacity (disabled)
        ├── Maths Card
        │   ├── Icon (calculator/plus symbols)
        │   ├── Title: "Maths"
        │   ├── Description: "Mathematical problem solving"
        │   ├── "Coming Soon" badge
        │   └── Reduced opacity
        ├── Physics Card
        │   ├── Icon (atom symbol)
        │   ├── Title: "Physics"
        │   ├── Description: "Physical laws and principles"
        │   ├── "Coming Soon" badge
        │   └── Reduced opacity
        └── English Card
            ├── Icon (book)
            ├── Title: "English"
            ├── Description: "Language arts and literature"
            ├── "Coming Soon" badge
            └── Reduced opacity
```

---

## **3. Cybersecurity Hub** (`/cybersecurity`)

```
CybersecurityPage
├── Header
├── Animated Background Gradients
├── Hero Section
│   ├── Main Headline
│   │   ├── "Master" (white gradient)
│   │   └── "Cybersecurity" (colored gradient)
│   └── Tagline
│       └── "Comprehensive Security+ exam preparation"
└── Learning Options Grid (3 cards, 1 column mobile, 3 columns desktop)
    ├── Quiz Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (violet on hover)
    │   ├── Icon Container
    │   │   ├── Document/quiz icon
    │   │   └── Glass background
    │   ├── Content
    │   │   ├── Title: "Quiz"
    │   │   ├── Description: "Test your knowledge with AI-generated questions"
    │   │   └── CTA
    │   │       ├── "Start Quiz" text
    │   │       └── Arrow icon
    │   └── Hover effects (scale, shadow, glow)
    ├── Flashcards Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (cyan on hover)
    │   ├── Icon Container
    │   │   ├── Cards stack icon
    │   │   └── Glass background
    │   ├── Content
    │   │   ├── Title: "Flashcards"
    │   │   ├── Description: "Study with spaced repetition"
    │   │   └── CTA
    │   │       ├── "Study Now" text
    │   │       └── Arrow icon
    │   └── Hover effects
    └── Study Materials Card (clickable)
        ├── Background (glass morphism)
        ├── Gradient overlay (emerald on hover)
        ├── Icon Container
        │   ├── Book icon
        │   └── Glass background
        ├── Content
        │   ├── Title: "Study Materials"
        │   ├── Description: "Browse comprehensive study resources"
        │   └── CTA
        │       ├── "Browse Materials" text
        │       └── Arrow icon
        └── Hover effects
```

---

## **4. Quiz Options Page** (`/cybersecurity/quiz`)

```
QuizOptionsPage
├── Header
├── Animated Background Gradients
├── Hero Section
│   ├── Main Headline
│   │   ├── "Test your" (white gradient)
│   │   └── "knowledge" (violet gradient)
│   └── Tagline
│       └── "Choose how you want to challenge yourself."
└── Quiz Options Grid (2 cards, 1 column mobile, 2 columns desktop)
    ├── Start New Quiz Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (violet on hover)
    │   ├── Icon Container
    │   │   ├── New document icon
    │   │   └── Glass background with border
    │   ├── Content
    │   │   ├── Title: "Start New Quiz"
    │   │   ├── Description: "Take 10 AI-generated synthesis questions and get instant feedback"
    │   │   └── CTA
    │   │       ├── "Begin Quiz" text
    │   │       └── Arrow icon (translates on hover)
    │   └── Hover effects (scale, violet glow)
    └── Performance Card (clickable)
        ├── Background (glass morphism)
        ├── Gradient overlay (cyan on hover)
        ├── Icon Container
        │   ├── Bar chart icon
        │   └── Glass background with border
        ├── Content
        │   ├── Title: "Performance"
        │   ├── Description: "View your scores, IRT analysis, and complete quiz history"
        │   └── CTA
        │       ├── "View Stats" text
        │       └── Arrow icon (translates on hover)
        └── Hover effects (scale, cyan glow)
```

---

## **5. Quiz Page** (`/cybersecurity/quiz/start`)

```
QuizPage
├── Header
├── Animated Background Gradients
├── Progress Section
│   ├── Question Counter
│   │   └── "Question X of 10" text
│   ├── Progress Bar Container
│   │   ├── Background bar (empty state)
│   │   └── Progress fill bar (current progress)
│   └── Progress Percentage
│       └── "X% Complete" text
├── Loading States
│   ├── Initial Loading (while fetching first question)
│   │   ├── Spinner animation
│   │   └── "Loading quiz..." text
│   └── Generating Next Question
│       ├── Spinner animation
│       └── "Generating next question..." text
├── ACTIVE QUIZ MODE (before submission):
│   ├── QuestionCard
│   │   ├── Card Container (glass morphism background)
│   │   │   ├── Background gradient overlays
│   │   │   └── Rounded corners with border
│   │   ├── Question Text
│   │   │   └── Large, bold question text
│   │   ├── Multiple Choice Instruction (if applicable)
│   │   │   ├── Container (glass box with border)
│   │   │   ├── Gradient overlay
│   │   │   └── Text: "Select all that apply - This question has multiple correct answers"
│   │   └── Answer Options Container
│   │       └── For each option (A, B, C, D):
│   │           ├── Option Button (clickable)
│   │           │   ├── Background (glass, changes on selection)
│   │           │   ├── Border (white, changes on selection)
│   │           │   ├── Gradient overlays
│   │           │   └── Hover effects (scale, glow, shadow)
│   │           ├── Selection Indicator
│   │           │   ├── For Multiple Choice: Checkbox
│   │           │   │   ├── Square with rounded corners
│   │           │   │   ├── Border
│   │           │   │   └── Checkmark (when selected)
│   │           │   └── For Single Choice: Radio button
│   │           │       ├── Circle with border
│   │           │       └── Inner filled circle (when selected)
│   │           ├── Option Letter
│   │           │   └── "A.", "B.", "C.", or "D." (bold, gray)
│   │           └── Option Text
│   │               └── Answer option text
│   └── Submit Answer Button
│       ├── Button Container
│       │   ├── Background (glass morphism)
│       │   ├── Border
│       │   └── Gradient overlays
│       ├── Button States
│       │   ├── Disabled (no answer selected)
│       │   │   ├── Grayed out
│       │   │   ├── No hover effects
│       │   │   └── Cursor: not-allowed
│       │   └── Enabled (answer selected)
│       │       ├── Full color
│       │       ├── Hover effects (scale, glow, violet shadow)
│       │       └── Cursor: pointer
│       └── Button Text
│           └── "Submit Answer"
└── REVIEW MODE (after submission):
    ├── Question Number Header
    │   ├── Number Badge Container
    │   │   ├── Glass background with border
    │   │   ├── Gradient overlay
    │   │   └── Question number (large, centered)
    │   └── Header Text
    │       └── "Question X" (large, bold)
    ├── QuestionCard (Review Mode)
    │   ├── Card Container (same as active mode)
    │   ├── Question Text
    │   └── Answer Options (colored by correctness)
    │       └── For each option:
    │           ├── Correct Answer Styling
    │           │   ├── Green background (bg-green-500/10)
    │           │   ├── Green border (border-green-500/60)
    │           │   ├── Green shadow (shadow-green-500/30)
    │           │   ├── Green gradient overlays
    │           │   │   ├── Primary gradient (from-green-500/30)
    │           │   │   └── Secondary gradient (from-white/10)
    │           │   └── "Correct" badge (multiple choice only)
    │           │       ├── Green background with border
    │           │       ├── Green text
    │           │       └── Positioned after option text
    │           ├── Incorrect Selected Styling
    │           │   ├── Red background (bg-red-500/10)
    │           │   ├── Red border (border-red-500/60)
    │           │   ├── Red shadow (shadow-red-500/30)
    │           │   ├── Red gradient overlays
    │           │   │   ├── Primary gradient (from-red-500/30)
    │           │   │   └── Secondary gradient (from-white/10)
    │           │   └── "Incorrect" badge (multiple choice only)
    │           │       ├── Red background with border
    │           │       ├── Red text
    │           │       └── Positioned after option text
    │           └── Unselected Option Styling
    │               ├── Neutral background (bg-white/5)
    │               ├── Neutral border (border-white/25)
    │               └── No badges
    ├── ExplanationSection
    │   ├── Main Explanation Card
    │   │   ├── Card Container (glass morphism)
    │   │   │   ├── Border (green/red/yellow based on result)
    │   │   │   ├── Shadow (colored glow)
    │   │   │   └── Gradient overlays (colored based on result)
    │   │   ├── Status Header Section
    │   │   │   ├── Status Text
    │   │   │   │   ├── "Correct!" (green, if correct)
    │   │   │   │   ├── "Partially Correct" (yellow, if partial)
    │   │   │   │   └── "Incorrect" (red, if wrong)
    │   │   │   └── Difficulty Badge (if shown)
    │   │   │       ├── Badge background (colored by difficulty)
    │   │   │       ├── Badge border
    │   │   │       └── Badge text: "EASY"/"MEDIUM"/"HARD"
    │   │   ├── Correct Answer Display (only if user was wrong)
    │   │   │   ├── Label
    │   │   │   │   └── "Correct Answer:" or "Correct Answers:"
    │   │   │   └── Answer(s) List
    │   │   │       └── For each correct answer:
    │   │   │           ├── Option letter (A, B, C, D)
    │   │   │           └── Full option text
    │   │   └── Explanation Section
    │   │       ├── Label
    │   │       │   └── "Explanation:" (bold)
    │   │       └── Explanation Text
    │   │           └── Detailed explanation of why answer is correct
    │   └── Why Other Options Are Incorrect (Collapsible)
    │       ├── Collapsible Container (glass morphism)
    │       │   ├── Border
    │       │   └── Gradient overlay
    │       ├── Collapsible Header (clickable button)
    │       │   ├── Header Container
    │       │   │   ├── Full width
    │       │   │   ├── Padding
    │       │   │   └── Hover effect (subtle background change)
    │       │   ├── Header Content
    │       │   │   ├── Title Text
    │       │   │   │   └── "Why Other Options Are Incorrect"
    │       │   │   └── Dropdown Arrow Icon
    │       │   │       ├── SVG chevron
    │       │   │       ├── Rotation animation (0° collapsed, 180° expanded)
    │       │   │       └── Transition duration
    │       │   └── Click Handler
    │       │       └── Toggles expanded state
    │       └── Collapsible Content (visible when expanded)
    │           ├── Content Container
    │           │   ├── Padding
    │           │   └── Spacing between items
    │           └── Incorrect Options List
    │               └── For each incorrect option:
    │                   ├── Option Letter
    │                   │   └── "A.", "B.", "C.", or "D." (bold, gray)
    │                   └── Explanation Text
    │                       └── Why this option is incorrect
    ├── QuestionMetadata
    │   ├── Metadata Container (glass morphism)
    │   │   ├── Border
    │   │   └── Gradient overlay
    │   ├── Domain(s) Section
    │   │   ├── Label
    │   │   │   └── "Domain:" or "Domains:"
    │   │   └── Domain Badges Container
    │   │       └── For each domain:
    │   │           ├── Badge (pill-shaped)
    │   │           │   ├── Glass background
    │   │           │   ├── Border
    │   │           │   └── Padding
    │   │           └── Domain Name Text
    │   ├── Topic(s) Section
    │   │   ├── Label
    │   │   │   └── "Topic:" or "Topics:"
    │   │   └── Topic Badges Container
    │   │       └── For each topic:
    │   │           ├── Badge (pill-shaped)
    │   │           │   ├── Glass background
    │   │           │   ├── Border
    │   │           │   └── Padding
    │   │           └── Topic Text (e.g., "1.2 Given a scenario...")
    │   ├── Difficulty Section
    │   │   ├── Label
    │   │   │   └── "Difficulty:"
    │   │   └── Difficulty Badge
    │   │       ├── Easy Badge
    │   │       │   ├── Green background
    │   │       │   ├── Green border
    │   │       │   ├── Green text
    │   │       │   └── "EASY" text
    │   │       ├── Medium Badge
    │   │       │   ├── Yellow background
    │   │       │   ├── Yellow border
    │   │       │   ├── Yellow text
    │   │       │   └── "MEDIUM" text
    │   │       └── Hard Badge
    │   │           ├── Red background
    │   │           ├── Red border
    │   │           ├── Red text
    │   │           └── "HARD" text
    │   └── Question Type Section
    │       ├── Label
    │       │   └── "Type:"
    │       └── Type Badge
    │           ├── Badge background (glass)
    │           ├── Badge border
    │           └── Type Text
    │               ├── "Single Domain, Single Topic"
    │               ├── "Single Domain, Multiple Topics"
    │               └── "Multiple Domains, Multiple Topics"
    ├── Next Button
    │   ├── Button Container
    │   │   ├── Background (glass morphism)
    │   │   ├── Border
    │   │   └── Gradient overlays (violet)
    │   ├── Button States
    │   │   ├── Disabled (generating next question)
    │   │   │   ├── Grayed out
    │   │   │   ├── Spinner icon
    │   │   │   ├── "Generating..." text
    │   │   │   └── Cursor: not-allowed
    │   │   └── Enabled (ready for next)
    │   │       ├── Full color
    │   │       ├── Hover effects (scale, glow, shadow)
    │   │       └── Cursor: pointer
    │   └── Button Text
    │       └── "Next Question" or "Finish Quiz" (for last question)
    └── Quiz Completion (after final question)
        ├── Celebration Animation
        │   ├── Confetti effect
        │   └── Particle animations
        ├── Success Card
        │   ├── Card Container (glass morphism, large)
        │   ├── Completion Icon
        │   │   └── Checkmark or trophy icon
        │   ├── Congratulations Text
        │   │   └── "Quiz Complete!"
        │   ├── Score Display
        │   │   ├── Score Number
        │   │   │   └── "X / 10"
        │   │   └── Percentage
        │   │       └── "(X%)"
        │   └── Action Buttons
        │       ├── View Performance Button
        │       │   ├── Primary styling
        │       │   └── Links to performance page
        │       └── Start New Quiz Button
        │           ├── Secondary styling
        │           └── Starts new quiz
```

---

## **6. Quiz Review Page** (`/cybersecurity/quiz/review/[quizId]`)

```
QuizReviewPage
├── Header
├── Animated Background Gradients
├── Loading State (while fetching quiz data)
│   ├── Spinner animation
│   └── "Loading quiz..." text
├── Quiz Summary Header
│   ├── Page Title
│   │   └── "Quiz Review" (large, bold)
│   ├── Quiz Metadata Row
│   │   ├── Date Taken
│   │   │   └── "Month Day, Year" format
│   │   ├── Separator dot
│   │   ├── Time Taken
│   │   │   └── "HH:MM AM/PM" format
│   │   ├── Separator dot
│   │   ├── Question Count
│   │   │   └── "X questions"
│   │   ├── Separator dot
│   │   └── Duration
│   │       └── "Time: Xm Ys"
│   ├── Score Display
│   │   ├── Score Fraction
│   │   │   ├── Score number (white)
│   │   │   ├── Separator (/)
│   │   │   └── Total (lighter white)
│   │   └── Percentage
│   │       └── "(X%)" in gray
│   └── Status Badge (if incomplete)
│       ├── Yellow background
│       ├── Yellow border
│       └── "Incomplete Quiz" text
├── Questions List Container
│   └── For each question in the quiz:
│       ├── Question Number Header
│       │   ├── Number Badge
│       │   │   ├── Glass background with border
│       │   │   ├── Gradient overlay
│       │   │   └── Question number
│       │   └── Header Text
│       │       └── "Question X"
│       ├── QuestionCard (Review Mode)
│       │   ├── Card Container
│       │   ├── Question Text
│       │   └── Answer Options (colored by correctness)
│       │       └── [Same structure as Quiz Page Review Mode]
│       ├── ExplanationSection
│       │   ├── Main Explanation Card
│       │   │   ├── Status header (Correct/Incorrect/Partially Correct)
│       │   │   ├── Correct answer display (if wrong)
│       │   │   └── Explanation text
│       │   └── Why Other Options Are Incorrect (Collapsible)
│       │       ├── Collapsible header with arrow
│       │       └── Collapsed content with explanations
│       └── QuestionMetadata
│           ├── Domains section
│           ├── Topics section
│           ├── Difficulty section
│           └── Question Type section
└── Back to Performance Button
    ├── Button Container
    │   ├── Glass background
    │   ├── Border
    │   └── Gradient overlays
    ├── Hover Effects
    │   ├── Scale up
    │   └── Enhanced shadow
    └── Button Text
        └── "Back to Performance"
```

---

## **7. Performance Page** (`/cybersecurity/performance`)

```
PerformancePage
├── Header
├── Animated Background Gradients
├── Hero Section
│   ├── Title: "Your Performance"
│   └── Subtitle/tagline
├── Predicted Exam Score Section (Collapsible)
│   ├── Dropdown Toggle Button
│   │   ├── Button Container
│   │   │   ├── Full width
│   │   │   ├── Glass background
│   │   │   └── Border
│   │   ├── Content Row
│   │   │   ├── Section Title
│   │   │   │   └── "Predicted Exam Score"
│   │   │   └── Dropdown Arrow
│   │   │       └── Rotates based on expanded state
│   │   └── Click Handler
│   └── Expanded Content (when open)
│       ├── Content Container
│       │   ├── Glass background
│       │   └── Padding
│       ├── Score Subtitle
│       │   ├── Questions Counter
│       │   │   └── "Based on X question(s)"
│       │   ├── Separator dot
│       │   └── Confidence Level (color-coded)
│       │       ├── "High confidence" (green)
│       │       ├── "Medium confidence" (yellow)
│       │       ├── "Low confidence" (orange)
│       │       ├── "Very low confidence" (red)
│       │       └── "Insufficient data" (gray)
│       ├── Score Range Display (Multi-colored)
│       │   ├── Score Display Container
│       │   └── Score Components
│       │       ├── Lower Bound
│       │       │   └── Colored by score range (red/yellow/green)
│       │       ├── Dash Separator
│       │       │   └── Gray color
│       │       └── Upper Bound
│       │           └── Colored by score range (red/yellow/green)
│       ├── Total Score Text
│       │   └── "out of 900"
│       ├── Progress Bar (Multi-segment)
│       │   ├── Progress Bar Container
│       │   │   ├── Background (empty state)
│       │   │   └── Rounded corners with border
│       │   └── Colored Segments
│       │       ├── Red Segment (100-599)
│       │       │   ├── Background: red gradient
│       │       │   ├── Width: based on score range
│       │       │   ├── Border radius (rounded left if first)
│       │       │   └── Gradient overlay
│       │       ├── Yellow Segment (600-749)
│       │       │   ├── Background: yellow gradient
│       │       │   ├── Width: based on score range
│       │       │   └── Gradient overlay
│       │       └── Green Segment (750-900)
│       │           ├── Background: green gradient
│       │           ├── Width: based on score range
│       │           ├── Border radius (rounded right if last)
│       │           └── Gradient overlay
│       └── Scale Labels
│           ├── "100" (left)
│           ├── "750" (passing threshold, center)
│           └── "900" (right)
├── Quick Stats Grid (3 cards)
│   ├── Total Questions Card
│   │   ├── Card Container (glass morphism)
│   │   ├── Icon
│   │   │   └── Document/checklist icon
│   │   ├── Number Display
│   │   │   └── Large, bold number
│   │   └── Label
│   │       └── "Total Questions"
│   ├── Accuracy Card
│   │   ├── Card Container
│   │   ├── Icon
│   │   │   └── Target/bullseye icon
│   │   ├── Percentage Display
│   │   │   └── Large, bold percentage
│   │   └── Label
│   │       └── "Accuracy"
│   └── Correct Answers Card
│       ├── Card Container
│       ├── Icon
│       │   └── Checkmark icon
│       ├── Number Display
│       │   └── Large, bold number
│       └── Label
│           └── "Correct Answers"
├── Performance Analysis Section (Collapsible)
│   ├── Dropdown Toggle Button
│   │   ├── Section Title: "Performance Analysis"
│   │   └── Dropdown Arrow
│   └── Expanded Content
│       ├── Ability Level Display
│       │   ├── Label Row
│       │   │   ├── Label Text: "Ability Level"
│       │   │   └── Tooltip (on hover)
│       │   │       └── Explanation of IRT ability level
│       │   ├── Ability Range Display (Multi-colored)
│       │   │   ├── Lower Bound
│       │   │   │   └── Colored by ability (<-1: red, -1 to 1: yellow, >1: green)
│       │   │   ├── Dash Separator
│       │   │   └── Upper Bound
│       │   │       └── Colored by ability
│       │   └── Ability Progress Bar (Multi-segment)
│       │       ├── Container (scale: -3 to +3)
│       │       └── Colored Segments
│       │           ├── Red Segment (< -1.0)
│       │           ├── Yellow Segment (-1.0 to 1.0)
│       │           └── Green Segment (≥ 1.0)
│       └── Performance Insights
│           ├── Section Title: "Key Insights"
│           └── Insights List
│               └── For each insight:
│                   ├── Bullet point
│                   └── Insight text (dynamically generated)
├── Performance Graphs Section (Collapsible)
│   ├── Dropdown Toggle Button
│   │   ├── Section Title: "Performance Graphs"
│   │   └── Dropdown Arrow
│   └── Expanded Content (PerformanceGraphs component)
│       ├── Score Over Time Graph
│       │   ├── Graph Title
│       │   ├── Line Chart (Recharts)
│       │   │   ├── X-Axis: Quiz number
│       │   │   ├── Y-Axis: Score (0-10)
│       │   │   ├── Line: Score progression
│       │   │   ├── Dots: Individual quiz scores
│       │   │   └── Tooltip: Score details on hover
│       │   └── Legend
│       ├── Accuracy Over Time Graph
│       │   ├── Graph Title
│       │   ├── Line Chart
│       │   │   ├── X-Axis: Quiz number
│       │   │   ├── Y-Axis: Accuracy percentage
│       │   │   ├── Line: Accuracy progression
│       │   │   ├── Dots: Individual accuracies
│       │   │   └── Tooltip
│       │   └── Legend
│       └── Ability Level Over Time Graph
│           ├── Graph Title
│           ├── Area Chart (with confidence band)
│           │   ├── X-Axis: Quiz number
│           │   ├── Y-Axis: Ability level
│           │   ├── Area: Confidence interval band
│           │   ├── Line: Ability progression
│           │   ├── Dots: Individual ability estimates
│           │   └── Tooltip: Ability + confidence interval
│           └── Legend
├── Topic Coverage by Domain Section (Collapsible)
│   ├── Dropdown Toggle Button
│   │   ├── Section Title: "Topic Coverage by Domain"
│   │   └── Dropdown Arrow
│   └── Expanded Content
│       └── Domain Tables List
│           └── For each domain:
│               ├── Domain Header (Collapsible)
│               │   ├── Header Button
│               │   │   ├── Domain Name
│               │   │   ├── Question Count
│               │   │   └── Dropdown Arrow
│               │   └── Click Handler
│               └── Domain Table (when expanded)
│                   ├── Table Header
│                   │   ├── "Topic" column
│                   │   ├── "Questions" column
│                   │   ├── "Correct" column
│                   │   └── "Accuracy" column
│                   └── Table Rows
│                       └── For each topic in domain:
│                           ├── Topic Name cell
│                           ├── Questions Count cell
│                           ├── Correct Count cell
│                           └── Accuracy Percentage cell
│                               └── Color-coded by performance
├── Quiz History Section
│   ├── Section Title
│   │   └── "Quiz History"
│   ├── Empty State (if no quizzes)
│   │   ├── Empty icon
│   │   └── "No quizzes taken yet" message
│   └── Quiz Cards List
│       └── For each quiz:
│           ├── Quiz Card (clickable to review)
│           │   ├── Card Container (glass morphism)
│           │   │   ├── Border
│           │   │   ├── Hover effects (scale, glow)
│           │   │   └── Click handler (navigate to review)
│           │   ├── Card Header
│           │   │   ├── Date and Time
│           │   │   │   └── "Month Day, Year • HH:MM AM/PM"
│           │   │   └── Delete Button
│           │   │       ├── Trash icon
│           │   │       ├── Red hover effect
│           │   │       └── Click handler (shows confirmation)
│           │   ├── Score Display
│           │   │   ├── Score Fraction: "X/10"
│           │   │   └── Percentage: "(X%)"
│           │   ├── Incomplete Badge (if not completed)
│           │   │   ├── Yellow background
│           │   │   └── "Incomplete Quiz" text
│           │   ├── Quiz Stats Grid
│           │   │   ├── Duration
│           │   │   │   ├── Clock icon
│           │   │   │   └── Time taken
│           │   │   ├── Difficulty Breakdown
│           │   │   │   ├── Distribution text
│           │   │   │   └── "E/M/H" format
│           │   │   └── Accuracy
│           │   │       ├── Target icon
│           │   │       └── Percentage
│           │   └── Review Link Indicator
│           │       ├── Arrow icon
│           │       └── "Click to review" hint
│           └── Delete Confirmation Modal (when delete clicked)
│               ├── Modal Overlay (darkened background)
│               ├── Modal Container (glass morphism, centered)
│               │   ├── Border
│               │   └── Shadow
│               ├── Warning Icon
│               │   └── Exclamation/alert icon
│               ├── Confirmation Message
│               │   ├── Title: "Delete Quiz?"
│               │   └── Warning text about permanent deletion
│               └── Action Buttons
│                   ├── Cancel Button
│                   │   ├── Secondary styling
│                   │   └── Closes modal
│                   └── Confirm Delete Button
│                       ├── Red/danger styling
│                       ├── Loading state (while deleting)
│                       └── Deletes quiz and refreshes
└── Reset Progress Button
    ├── Button Container
    │   ├── Red/warning background
    │   ├── Red border
    │   └── Position: bottom of page
    ├── Warning Icon
    │   └── Alert triangle icon
    ├── Button Text
    │   └── "Reset All Progress"
    └── Click Handler
        └── Shows confirmation dialog
            ├── Modal Overlay
            ├── Confirmation Message
            │   ├── "Are you sure?" title
            │   └── Warning about data loss
            └── Action Buttons
                ├── Cancel button
                └── Confirm reset button
                    └── Resets progress and reloads page
```

---

## **8. Flashcards Hub** (`/cybersecurity/flashcards`)

```
FlashcardsPage
├── Header
├── Animated Background Gradients
├── Hero Section
│   ├── Title: "Flashcards"
│   └── Tagline
└── Flashcard Options Grid (4 cards, 2x2)
    ├── Study Flashcards Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (violet on hover)
    │   ├── Icon Container
    │   │   ├── Cards/study icon
    │   │   └── Glass background
    │   ├── Content
    │   │   ├── Title: "Study Flashcards"
    │   │   ├── Description
    │   │   └── CTA
    │   │       ├── "Start Studying" text
    │   │       └── Arrow icon
    │   └── Hover effects
    ├── Create Flashcards Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (cyan on hover)
    │   ├── Icon Container
    │   │   ├── Plus/create icon
    │   │   └── Glass background
    │   ├── Content
    │   │   ├── Title: "Create Flashcards"
    │   │   ├── Description: "Generate from PDF"
    │   │   └── CTA
    │   │       ├── "Create from PDF" text
    │   │       └── Arrow icon
    │   └── Hover effects
    ├── Search Flashcards Card (clickable)
    │   ├── Background (glass morphism)
    │   ├── Gradient overlay (emerald on hover)
    │   ├── Icon Container
    │   │   ├── Search/magnifying glass icon
    │   │   └── Glass background
    │   ├── Content
    │   │   ├── Title: "Search Flashcards"
    │   │   ├── Description
    │   │   └── CTA
    │   │       ├── "Search Now" text
    │   │       └── Arrow icon
    │   └── Hover effects
    └── Performance Card (clickable)
        ├── Background (glass morphism)
        ├── Gradient overlay (yellow on hover)
        ├── Icon Container
        │   ├── Chart/stats icon
        │   └── Glass background
        ├── Content
        │   ├── Title: "Performance"
        │   ├── Description
        │   └── CTA
        │       ├── "View Stats" text
        │       └── Arrow icon
        └── Hover effects
```

---

## **9. Flashcards Study Page** (`/cybersecurity/flashcards/study`)

```
FlashcardsStudyPage
├── Header
├── Animated Background Gradients
├── Loading State (fetching flashcards)
│   ├── Spinner animation
│   └── "Loading flashcards..." text
├── Empty State (no flashcards available)
│   ├── Empty icon
│   ├── "No flashcards available" message
│   └── "Create flashcards" CTA button
├── Progress Section
│   ├── Card Counter
│   │   └── "Card X of Y" text
│   └── Progress Bar
│       ├── Background bar
│       └── Progress fill (based on current position)
├── Flashcard Display Container
│   ├── Card Container (3D flippable)
│   │   ├── Glass morphism background
│   │   ├── Border with glow
│   │   ├── Shadow effects
│   │   └── 3D perspective transform
│   ├── Card Front Side (Question)
│   │   ├── Label Badge
│   │   │   ├── "Question" text
│   │   │   └── Colored background
│   │   ├── Question Text
│   │   │   └── Large, centered text
│   │   └── Flip Hint
│   │       ├── Tap icon
│   │       └── "Tap to reveal answer" text
│   ├── Card Back Side (Answer)
│   │   ├── Label Badge
│   │   │   ├── "Answer" text
│   │   │   └── Colored background
│   │   ├── Answer Text
│   │   │   └── Large, centered text
│   │   └── Flip Hint
│   │       ├── Tap icon
│   │       └── "Tap to flip back" text
│   └── Flip Animation
│       ├── 3D rotation transform (rotateY)
│       ├── Transition duration
│       └── Backface visibility hidden
├── Navigation Controls
│   ├── Previous Button
│   │   ├── Button Container (glass morphism)
│   │   ├── Left Arrow Icon
│   │   ├── Button Text: "Previous"
│   │   ├── Disabled State (on first card)
│   │   │   ├── Grayed out
│   │   │   └── Cursor: not-allowed
│   │   └── Hover Effects (when enabled)
│   │       └── Scale and glow
│   ├── Flip Button
│   │   ├── Button Container (glass morphism)
│   │   ├── Flip Icon (rotating)
│   │   ├── Button Text
│   │   │   ├── "Reveal Answer" (when on front)
│   │   │   └── "Show Question" (when on back)
│   │   └── Hover Effects
│   │       └── Scale and glow
│   └── Next Button
│       ├── Button Container (glass morphism)
│       ├── Right Arrow Icon
│       ├── Button Text: "Next"
│       ├── Disabled State (on last card)
│       │   ├── Grayed out
│       │   └── Cursor: not-allowed
│       └── Hover Effects (when enabled)
│           └── Scale and glow
└── Card Status Section
    ├── Current Position Indicator
    │   └── Dot indicators for each card
    │       ├── Active dot (current card)
    │       │   └── Larger, colored
    │       └── Inactive dots
    │           └── Smaller, gray
    └── Completion Status
        └── Shows when all cards reviewed
            ├── Completion message
            └── Action buttons
                ├── "Review Again" button
                └── "Back to Flashcards" button
```

---

## **10. Flashcards Create Page** (`/cybersecurity/flashcards/create`)

```
FlashcardsCreatePage
├── Header
├── Animated Background Gradients
├── Hero Section
│   ├── Title: "Create Flashcards from PDF"
│   └── Instructions
│       └── "Upload a PDF document and AI will generate flashcards"
├── Upload Section
│   ├── File Upload Area (drag & drop zone)
│   │   ├── Upload Container
│   │   │   ├── Glass background
│   │   │   ├── Dashed border
│   │   │   ├── Large padding
│   │   │   └── Hover effects (border glow)
│   │   ├── Upload Icon
│   │   │   └── Cloud upload or document icon
│   │   ├── Upload Text
│   │   │   ├── Primary: "Choose file or drag here"
│   │   │   └── Secondary: "PDF documents only"
│   │   ├── File Size Limit Text
│   │   │   └── "Maximum file size: 10MB"
│   │   └── Drag & Drop Handlers
│   │       ├── onDragOver (visual feedback)
│   │       ├── onDragLeave (remove feedback)
│   │       └── onDrop (handle file)
│   ├── Selected File Display (when file chosen)
│   │   ├── File Info Container (glass card)
│   │   ├── File Icon
│   │   │   └── PDF document icon
│   │   ├── File Details
│   │   │   ├── File Name
│   │   │   └── File Size
│   │   └── Remove Button
│   │       ├── X icon
│   │       ├── Red hover effect
│   │       └── Click handler (clears file)
│   └── Generate Button
│       ├── Button Container (glass morphism)
│       ├── Button States
│       │   ├── Disabled (no file selected)
│       │   │   ├── Grayed out
│       │   │   └── Cursor: not-allowed
│       │   ├── Loading (processing PDF)
│       │   │   ├── Spinner animation
│       │   │   └── "Generating..." text
│       │   └── Enabled (file selected)
│       │       ├── Full color
│       │       └── Hover effects
│       └── Button Text
│           └── "Generate Flashcards"
├── Generation Progress (while processing)
│   ├── Progress Container (glass card, centered)
│   ├── Progress Spinner
│   │   └── Animated loading indicator
│   ├── Status Message
│   │   ├── "Extracting text from PDF..."
│   │   ├── "Analyzing content..."
│   │   └── "Generating flashcards..."
│   └── Progress Percentage (if available)
│       └── "X% complete"
├── Generated Flashcards Preview (after generation)
│   ├── Preview Header
│   │   ├── Success Icon
│   │   │   └── Checkmark icon
│   │   ├── Success Message
│   │   │   └── "Successfully generated X flashcards"
│   │   └── Cards Count
│   │       └── "X cards created"
│   ├── Preview Cards List
│   │   └── For each generated flashcard:
│   │       ├── Card Container (glass morphism)
│   │       ├── Card Number Badge
│   │       │   └── "Card X"
│   │       ├── Question Section
│   │       │   ├── Label: "Question"
│   │       │   └── Question Text (truncated if long)
│   │       ├── Answer Section
│   │       │   ├── Label: "Answer"
│   │       │   └── Answer Text (truncated if long)
│   │       └── Action Buttons
│   │           ├── Edit Button
│   │           │   ├── Edit icon
│   │           │   └── Opens edit modal
│   │           └── Delete Button
│   │               ├── Trash icon
│   │               └── Removes card from set
│   └── Action Buttons Section
│       ├── Save Flashcards Button
│       │   ├── Primary styling (green)
│       │   ├── Checkmark icon
│       │   ├── "Save X Flashcards" text
│       │   └── Saves to database
│       ├── Regenerate Button
│       │   ├── Secondary styling
│       │   ├── Refresh icon
│       │   ├── "Regenerate" text
│       │   └── Generates new set
│       └── Cancel Button
│           ├── Tertiary styling
│           ├── X icon
│           └── Clears and returns
└── Error State (if generation fails)
    ├── Error Container (glass card)
    ├── Error Icon
    │   └── Alert/warning icon
    ├── Error Message
    │   └── Description of what went wrong
    └── Retry Button
        └── Allows trying again
```

---

## **11. Flashcards Search Page** (`/cybersecurity/flashcards/search`)

```
FlashcardsSearchPage
├── Header
├── Animated Background Gradients
├── Hero Section
│   └── Title: "Search Flashcards"
├── Search Section
│   ├── Search Input Container (glass morphism)
│   │   ├── Search Icon
│   │   │   └── Magnifying glass icon (left side)
│   │   ├── Text Input
│   │   │   ├── Placeholder: "Search flashcards..."
│   │   │   ├── Large text
│   │   │   └── onChange handler (live search)
│   │   └── Clear Button (when text entered)
│   │       ├── X icon
│   │       ├── Appears on right side
│   │       └── Clears search input
│   └── Filter Options Bar
│       ├── Topic Filter Dropdown
│       │   ├── Dropdown button
│       │   │   ├── "All Topics" or selected topic
│       │   │   └── Chevron icon
│       │   └── Dropdown Menu (when opened)
│       │       ├── Menu container (glass)
│       │       └── Topic options list
│       │           └── For each topic:
│       │               ├── Checkbox
│       │               └── Topic name
│       ├── Difficulty Filter Dropdown
│       │   ├── Dropdown button
│       │   │   ├── "All Difficulties" or selected
│       │   │   └── Chevron icon
│       │   └── Dropdown Menu
│       │       └── Options: All, Easy, Medium, Hard
│       └── Date Range Filter
│           ├── Dropdown button
│           │   ├── "All Time" or selected range
│           │   └── Chevron icon
│           └── Dropdown Menu
│               └── Options: Today, Last 7 days, Last 30 days, All time
├── Search Results Section
│   ├── Results Header
│   │   ├── Results Count
│   │   │   └── "X flashcards found"
│   │   └── Sort Dropdown
│   │       ├── Sort button
│   │       │   ├── "Sort by: [option]"
│   │       │   └── Chevron icon
│   │       └── Sort Menu
│   │           ├── By Relevance
│   │           ├── By Date Created (newest first)
│   │           ├── By Date Created (oldest first)
│   │           └── By Difficulty
│   ├── Results List
│   │   └── For each matching flashcard:
│   │       ├── Result Card (glass morphism)
│   │       │   ├── Border
│   │       │   └── Hover effects (glow, scale)
│   │       ├── Card Header
│   │       │   ├── Topic Badge
│   │       │   │   ├── Topic name
│   │       │   │   └── Colored background
│   │       │   ├── Difficulty Badge
│   │       │   │   └── Easy/Medium/Hard
│   │       │   └── Date Created
│   │       │       └── "X days ago"
│   │       ├── Question Preview
│   │       │   ├── Label: "Question"
│   │       │   └── Question text (truncated)
│   │       ├── Answer Snippet
│   │       │   ├── Label: "Answer"
│   │       │   └── Answer preview (truncated)
│   │       └── Action Buttons
│   │           ├── Study Button
│   │           │   ├── Primary styling
│   │           │   ├── Book icon
│   │           │   └── Opens in study mode
│   │           ├── Edit Button
│   │           │   ├── Secondary styling
│   │           │   ├── Edit icon
│   │           │   └── Opens edit modal
│   │           └── Delete Button
│   │               ├── Danger styling
│   │               ├── Trash icon
│   │               └── Shows confirmation
│   └── Pagination (if many results)
│       ├── Previous Page button
│       ├── Page Numbers
│       │   └── Current page highlighted
│       └── Next Page button
└── Empty State (no results found)
    ├── Empty Icon
    │   └── Magnifying glass with X
    ├── Empty Message
    │   ├── Title: "No flashcards found"
    │   └── Subtitle: "Try different search terms"
    └── Suggestions
        ├── "Clear filters" button
        └── "Create new flashcards" button
```

---

## **12. Flashcards Performance Page** (`/cybersecurity/flashcards/performance`)

```
FlashcardsPerformancePage
├── Header
├── Animated Background Gradients
├── Hero Section
│   └── Title: "Flashcard Performance"
├── Summary Statistics Grid (4 cards)
│   ├── Total Cards Studied Card
│   │   ├── Card Container (glass morphism)
│   │   ├── Icon
│   │   │   └── Cards/deck icon
│   │   ├── Number Display
│   │   │   └── Total count (large, bold)
│   │   └── Label
│   │       └── "Total Cards Studied"
│   ├── Study Sessions Card
│   │   ├── Card Container
│   │   ├── Icon
│   │   │   └── Calendar/session icon
│   │   ├── Number Display
│   │   │   └── Session count
│   │   └── Label
│   │       └── "Study Sessions"
│   ├── Average Accuracy Card
│   │   ├── Card Container
│   │   ├── Icon
│   │   │   └── Target/bullseye icon
│   │   ├── Percentage Display
│   │   │   └── Average accuracy %
│   │   └── Label
│   │       └── "Average Accuracy"
│   └── Mastery Level Card
│       ├── Card Container
│       ├── Icon
│       │   └── Star/trophy icon
│       ├── Mastery Display
│       │   ├── Level text or percentage
│       │   └── Color-coded by level
│       └── Label
│           └── "Mastery Level"
├── Study Activity Graph Section
│   ├── Section Title
│   │   └── "Study Activity"
│   ├── Graph Container (glass morphism)
│   │   └── Bar Chart (Recharts)
│   │       ├── X-Axis: Date
│   │       ├── Y-Axis: Cards studied
│   │       ├── Bars: Daily card count
│   │       │   └── Color-coded by volume
│   │       ├── Tooltip: Date + count on hover
│   │       └── Grid lines
│   └── Time Range Selector
│       ├── Last 7 days button
│       ├── Last 30 days button
│       └── All time button
├── Mastery Breakdown Section
│   ├── Section Title
│   │   └── "Mastery Breakdown"
│   ├── Chart Container (glass morphism)
│   │   └── Donut/Pie Chart (Recharts)
│   │       ├── Mastered Segment (green)
│   │       │   ├── Count and percentage
│   │       │   └── Label: "Mastered"
│   │       ├── Learning Segment (yellow)
│   │       │   ├── Count and percentage
│   │       │   └── Label: "Learning"
│   │       ├── New Segment (gray)
│   │       │   ├── Count and percentage
│   │       │   └── Label: "New"
│   │       ├── Center Label
│   │       │   └── Total cards count
│   │       └── Legend
│   └── Mastery Definitions (info box)
│       ├── Mastered: Correctly answered 3+ times
│       ├── Learning: Seen but not mastered
│       └── New: Never studied
├── Topics Performance Section
│   ├── Section Title
│   │   └── "Performance by Topic"
│   └── Topic Cards Grid
│       └── For each topic:
│           ├── Topic Card (glass morphism)
│           ├── Topic Header
│           │   ├── Topic Name
│           │   └── Topic Badge
│           ├── Statistics Row
│           │   ├── Cards Count
│           │   │   └── "X cards"
│           │   └── Mastery Percentage
│           │       └── Color-coded
│           ├── Progress Bar
│           │   ├── Background bar
│           │   └── Filled progress
│           │       └── Color based on mastery %
│           └── Performance Trend Icon
│               ├── Up arrow (improving)
│               ├── Flat (stable)
│               └── Down arrow (declining)
└── Study History Section
    ├── Section Title
    │   └── "Recent Study Sessions"
    └── Session Cards List
        └── For each study session:
            ├── Session Card (glass morphism)
            ├── Session Header
            │   ├── Date and Time
            │   │   └── "Month Day, HH:MM AM/PM"
            │   └── Duration Badge
            │       └── "Xm Ys"
            ├── Session Stats
            │   ├── Cards Studied
            │   │   └── "X cards"
            │   ├── Accuracy
            │   │   └── "X% accuracy"
            │   │   └── Color-coded
            │   └── Topics Covered
            │       └── Topic badges list
            └── View Details Button
                └── Expands to show all cards from session
```

---

**Notes:**
- All collapsible sections use the same pattern: clickable header with arrow that rotates (0° collapsed, 180° expanded)
- Glass morphism styling: `backdrop-blur`, `bg-white/[opacity]`, `border`, `rounded-[Xpx]`
- Color coding is consistent across the app:
  - Green: Correct/Passing/High performance
  - Yellow: Medium/Caution
  - Red: Incorrect/Failing/Low performance
  - Violet: Interactive elements, CTAs
  - Cyan: Secondary actions
- All hover effects follow the same pattern: scale, glow/shadow, color intensity increase
