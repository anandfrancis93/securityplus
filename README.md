# Security+ SY0-701 Learning Platform

An AI-powered web application for CompTIA Security+ SY0-701 certification exam preparation with intelligent adaptive testing, performance analytics, and flashcard study system.

## Features

### Quiz Mode with Adaptive Testing
- **AI-Generated Synthesis Questions**: Creates complex questions combining multiple security concepts using Claude 4.5 Sonnet
- **Instant Start with On-Demand Generation**: First question appears in ~10 seconds, remaining questions generate automatically in the background
- **Progressive Loading**: Zero wait time between questions - next question is always ready when you click "Next"
- **Pseudo-Adaptive Difficulty**: Questions dynamically adapt to your current ability level
  - Low ability: 70% easy, 25% medium, 5% hard questions
  - Average ability: 20% easy, 60% medium, 20% hard questions
  - High ability: 10% easy, 30% medium, 60% hard questions
- **Multiple-Response Questions**: Includes "select all that apply" questions with partial credit support (70% single-choice, 30% multiple-response)
- **Item Response Theory (IRT) Scoring**: Advanced psychometric scoring system that weighs questions by difficulty
- **Phase 1 IRT Reliability**: Requires 15 questions minimum for reliable ability estimates with capped predictions until threshold is met
- **Partial Credit System**: Earn proportional points for partially correct answers on multiple-response questions
- **Intelligent Score Prediction**: IRT-based ability estimation predicts your exam score (100-900 scale)

### Performance Analytics & Progress Tracking
- **5 Interactive Performance Graphs**:
  1. **Ability Level Over Time**: Track your IRT ability (θ) progression from -3 (beginner) to +3 (expert)
  2. **Predicted Score Over Time**: Monitor your exam readiness with 750 passing threshold
  3. **Accuracy by Difficulty**: See performance breakdown across easy/medium/hard questions
  4. **Performance by Domain**: Track coverage and accuracy across all 5 SY0-701 domains (unique question counts)
  5. **Study Volume Over Time**: Cumulative question count showing study consistency
- **Topic Coverage Tables**: 5 scrollable tables (one per domain) showing ALL Security+ topics with coverage count and accuracy, including topics with 0 occurrences
- **Cross-Session Topic Tracking**: Comprehensive tracking of performance across all SY0-701 topics and domains
- **IRT Performance Analysis**: Detailed ability metrics with visual progress indicators
- **Domain Coverage Monitoring**: Automatic categorization and tracking across 5 exam domains
- **Mastery Identification**: System identifies mastered topics (80%+ accuracy, 3+ questions)
- **Phase 1 Warnings**: Clear indicators when insufficient data (<15 questions) with progress tracking

### Flashcard Mode with Spaced Repetition
- **Manual Flashcard Creation**: Create custom flashcards with terms, definitions, and optional context
- **Image Support**: Add images to flashcards with Firebase Storage integration (up to 5MB per image)
- **Image Lightbox**: Click images to view enlarged versions with zoom functionality
- **Spaced Repetition (SM-2 Algorithm)**: Intelligent review scheduling based on your performance
  - **Again** (<1 min): Reset card, review immediately
  - **Hard** (~6 hours): Difficult recall, reduced interval
  - **Good** (~10 hours): Normal progression
  - **Easy** (4 days): Perfect recall, increased interval
- **Interactive Flip Cards**: Click to flip between term and definition
- **Search Functionality**: Quickly find flashcards by term, definition, domain, or source file
- **Progress Tracking**: Monitor Learning, Review, and Mastered cards
- **Reset Progress**: Clear all review history while keeping flashcards
- **Order Preservation**: Flashcards maintain the order they appear in your document
- **Manual Creation & Editing**: Create or edit flashcards with custom terms, definitions, context, and images

### User Experience
- **Google Sign-In**: Secure authentication via Google OAuth
- **Multi-Subject Support**: Organized homepage with subjects (Cybersecurity active, others coming soon)
- **Cloud Sync**: All progress and flashcards automatically saved to Firebase (Firestore + Storage)
- **Comprehensive Progress Tracking**: Track answered questions, points earned, ability estimate, predicted exam score, and topic mastery
- **Dark Mode UI**: Eye-friendly dark interface with modern design
- **Smart Question Management**: Never repeats previously answered questions within a quiz session
- **Detailed Explanations**: Learn why correct answers are right and incorrect answers are wrong
- **Topic Tags**: Each question shows relevant Security+ topics covered
- **Flexible Quiz Flow**: End quiz anytime and return to home page
- **Reset Progress**: Clear quiz or flashcard progress independently

## Tech Stack

- **Frontend**: Next.js 15.5.6 (App Router), React 19, TypeScript, Tailwind CSS
- **Charting**: Recharts 2.15.0 for data visualization
- **AI**: Claude 4.5 Sonnet (claude-sonnet-4-5-20250929) for question generation
- **Backend**: Firebase (Firestore Database + Firebase Storage + Google Authentication)
- **Image Hosting**: Firebase Storage with CORS configuration
- **Deployment**: Vercel with automatic CI/CD

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd securityplus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. **Enable Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in production mode
4. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
5. **Enable Firebase Storage**:
   - Go to Storage → Get Started
   - Start in production mode
   - Upgrade to Blaze (Pay-as-you-go) plan if needed for Storage
6. **Configure Storage CORS** (for image uploads):
   - Install Google Cloud SDK: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
   - Create `cors.json`:
     ```json
     [
       {
         "origin": ["http://localhost:3000", "https://*.vercel.app"],
         "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
         "maxAgeSeconds": 3600,
         "responseHeader": ["Content-Type", "Authorization"]
       }
     ]
     ```
   - Run: `gsutil cors set cors.json gs://your-bucket-name.appspot.com`
7. **Deploy Firestore Security Rules**:
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init firestore` (select your project)
   - Deploy rules: `firebase deploy --only firestore:rules`
   - The rules are in `firestore.rules` file
8. **Deploy Storage Security Rules**:
   - Rules should allow authenticated users read/write access
   - Deploy: `firebase deploy --only storage`
9. Get your Firebase configuration from Project Settings

### 4. Set Up Anthropic API

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Ensure you have credits available

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com/)
2. Import your Git repository
3. Configure environment variables
4. Deploy

### Environment Variables for Vercel

Add these in your Vercel project settings:

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## How It Works

### Quiz Mode with Adaptive Testing
1. **Google Authentication**: Users sign in with Google OAuth for secure access
2. **On-Demand Question Generation**:
   - First question generates immediately (~10 seconds)
   - Subsequent questions generate automatically in the background
   - Each new question triggers generation of the next one
   - Zero wait time between questions for seamless experience
3. **Pseudo-Adaptive Selection**:
   - System calculates your current ability level (θ) after each answer
   - Next question difficulty is selected based on your ability:
     - Struggling: More easy/medium questions to build confidence
     - Average: Balanced mix across all difficulties
     - Excelling: More medium/hard questions for challenge
4. **Question Types**: Claude AI generates unique synthesis questions from comprehensive SY0-701 exam objectives
5. **Adaptive Scoring**: Each question is worth different points based on difficulty:
   - Easy: 100 points
   - Medium: 150 points
   - Hard: 250 points
6. **Partial Credit**: Multiple-response questions award proportional credit (e.g., 3/4 correct = 75% of points)
7. **IRT Analysis**: System estimates your ability level (theta) using Maximum Likelihood Estimation with Phase 1 safeguards
8. **Phase 1 Reliability**:
   - Requires minimum 15 questions for reliable estimates
   - Ability capped at ±2.0 (instead of ±3.0) until threshold met
   - Clear warnings displayed when data is insufficient
   - Prevents unrealistic predictions (e.g., "+3 ability after 1 question")
9. **Score Prediction**: Maps your ability estimate to the 100-900 exam score scale
10. **Topic Tracking**: Automatically categorizes questions into 5 SY0-701 domains and tracks performance
11. **Cloud Sync**: All progress is stored in Firestore and synced across devices
12. **Smart Tracking**: Keeps track of answered questions within quiz sessions to avoid repetition

### Performance Analytics System
1. **Ability Level Over Time**: Line chart showing θ progression with reference lines at average (0) and target (+1)
2. **Predicted Score Over Time**: Line chart tracking score estimates with passing threshold (750) marked
3. **Accuracy by Difficulty**: Bar chart showing percentage correct for easy/medium/hard questions
4. **Domain Performance**: Horizontal bar chart showing accuracy across all 5 SY0-701 domains (counts unique questions, not topic occurrences)
5. **Study Volume**: Cumulative line chart showing total questions answered over time
6. **Topic Coverage Tables**: 5 scrollable tables (one per domain) displaying all Security+ SY0-701 topics with:
   - Topic name
   - Times covered (including 0 occurrences)
   - Accuracy percentage (color-coded: green ≥80%, yellow ≥60%, red <60%)
   - Coverage summary per domain (e.g., "45 of 93 topics covered")
7. **Cross-Session Topic Tracking**:
   - Tracks every topic across all quiz sessions
   - Automatically maps topics to correct SY0-701 domain using keyword matching
   - Identifies mastered topics (80%+ accuracy, 3+ questions answered)
   - Can be used to exclude mastered topics from future quizzes
8. **Interactive Tooltips**: Hover over graph elements for detailed statistics

### Flashcard Mode
1. **Manual Creation**: User creates flashcards by entering term, definition, optional context, and domain
2. **Image Upload**: Optional image attachments stored in Firebase Storage (supports PNG, JPG, GIF, WebP up to 5MB)
3. **Flashcard Storage**: Flashcards saved to Firestore with user association
4. **Spaced Repetition**: SM-2 algorithm calculates optimal review intervals
   - Ease Factor: Starts at 2.5, adjusts based on performance
   - Intervals: Dynamically calculated based on user ratings
   - Quality Score: Maps user difficulty ratings to 0-5 scale
5. **Review Tracking**: System monitors each card's review history and next due date
6. **Automatic Scheduling**: Cards appear when due based on spaced repetition algorithm
7. **Search & Filter**: Real-time search across terms, definitions, domains, and source files
8. **Edit & Delete**: Modify or remove flashcards at any time

## Features in Detail

### Comprehensive SY0-701 Coverage

Questions are generated from the complete CompTIA Security+ SY0-701 exam objectives:

**1.0 General Security Concepts** (12% of exam)
- Security controls (Technical, Managerial, Operational, Physical)
- CIA Triad and AAA framework
- Zero Trust architecture
- Physical security
- Change management
- Cryptographic solutions (PKI, encryption, certificates)

**2.0 Threats, Vulnerabilities, and Mitigations** (22% of exam)
- Threat actors and motivations
- Attack vectors and surfaces
- Vulnerability types and indicators
- Malware attacks and password attacks
- Mitigation techniques

**3.0 Security Architecture** (18% of exam)
- Cloud, IaC, Serverless, Microservices
- Network infrastructure and segmentation
- Data protection strategies
- Resilience and recovery

**4.0 Security Operations** (28% of exam - largest domain)
- Hardening and secure baselines
- Asset management and vulnerability management
- Monitoring and alerting (SIEM, DLP, IDS/IPS)
- Identity and access management
- Automation and orchestration
- Incident response and digital forensics

**5.0 Security Program Management and Oversight** (20% of exam)
- Security governance and policies
- Risk management process
- Third-party risk assessment
- Compliance and privacy
- Audits and security awareness

### Question Types & Distribution

**Difficulty Levels:**
- **Easy** (100 points): Straightforward, testing 1-2 basic concepts
- **Medium** (150 points): Applying 2-3 concepts with moderate complexity
- **Hard** (250 points): Complex synthesis of 3+ concepts with nuanced scenarios

**Question Types:**
- **Single-Choice** (70%): Select one correct answer from four options
- **Multiple-Response** (30%): Select all correct answers (2-3 correct out of 4 options)

**Adaptive Distribution** (varies by ability):
- System dynamically adjusts difficulty based on your performance
- Higher ability → more challenging questions
- Lower ability → more foundational questions
- Ensures optimal learning zone

### Progress Tracking & IRT Scoring

**IRT Ability Estimation (θ):**
- Range: -3 (beginner) to +3 (expert)
- Phase 1 capped at ±2.0 until 15 questions answered
- Calculated using Maximum Likelihood Estimation (MLE)
- Accounts for question difficulty and discrimination parameters

**Score Prediction Mapping:**
- θ = -3: ~100 (very low ability)
- θ = -1: ~400 (below average)
- θ = 0: ~550 (average ability)
- θ = +1: ~750 (passing ability) ✓
- θ = +2: ~810 (high ability)
- θ = +3: ~900 (expert ability)

**Passing Score**: 750/900 (requires θ ≈ +1.0)

**Performance Metrics:**
- Total questions answered
- Points earned vs. maximum possible points
- Overall accuracy percentage
- IRT ability estimate (theta)
- Predicted exam score (100-900 scale)
- Domain-specific accuracy
- Difficulty-specific accuracy
- Topic mastery tracking

### Cross-Session Topic Tracking

**Automatic Domain Mapping:**
- System uses keyword matching to categorize topics into 5 SY0-701 domains
- Tracks performance on every individual topic across all quiz sessions
- Example: "Zero Trust" → automatically mapped to "1.0 General Security Concepts"

**Mastery Criteria:**
- 80%+ accuracy on a topic
- At least 3 questions answered on that topic
- Enables intelligent study planning

**Use Cases:**
- Identify weak topics requiring more practice
- See comprehensive exam coverage
- Track improvement on specific security concepts
- Can exclude mastered topics from future quizzes (optional)

### Flashcard System

#### Spaced Repetition Algorithm (SM-2)

The app uses the SuperMemo 2 (SM-2) algorithm, a proven method for optimizing long-term retention:

**How It Works:**
- **Ease Factor**: Measures how easy a card is (default 2.5)
- **Repetitions**: Count of successful reviews
- **Interval**: Days until next review

**Rating System:**
- **Again (0)**: Forgot completely → Review in <1 minute
- **Hard (3)**: Recalled with difficulty → 80% of normal interval
- **Good (4)**: Recalled with some effort → Normal progression
- **Easy (5)**: Perfect recall → 130% of normal interval

**Progression Example:**
1. First review: Immediate
2. Second review: 1 day later
3. Third review: 6 days later
4. Fourth review: ~15 days later (varies by performance)

#### Card Statistics

- **Learning**: Currently being learned (0 successful reviews)
- **Review**: In review phase (1-2 successful reviews)
- **Mastered**: Well-learned (3+ successful reviews)
- **Total**: All flashcards in your collection

#### Domain Categories

Choose from predefined Security+ domains when creating flashcards:
- 1.0 General Security Concepts
- 2.0 Threats, Vulnerabilities, and Mitigations
- 3.0 Security Architecture
- 4.0 Security Operations
- 5.0 Security Program Management and Oversight

**Best Practices:**
- Use concise terms (2+ characters)
- Write clear definitions (10+ characters)
- Add context for complex concepts
- Include diagrams/images when helpful
- Organize by domain for structured learning

## Phase 1 IRT Reliability Features

**Problem Solved:**
- Previous issue: 1 correct answer → Ability +3, Score 900 (unrealistic)
- Solution: Phase 1 threshold system ensures reliable estimates

**Implementation:**
1. **Minimum Data Threshold**: 15 questions required for full IRT analysis
2. **Ability Capping**: Estimates capped at ±2.0 until threshold met
3. **Visual Warnings**: Yellow banner appears when data insufficient
4. **Progress Indicator**: Shows "X/15 questions" progress
5. **Automatic Uncapping**: Full -3 to +3 range unlocked after 15 questions

**User Experience:**
- Clear communication about estimate reliability
- No false sense of exam readiness with insufficient data
- Smooth transition to full IRT once threshold met
- Maintains user motivation while ensuring accuracy

## Technology Details

**IRT Implementation:**
- 2-Parameter Logistic (2PL) Model
- Maximum Likelihood Estimation (MLE) for ability calculation
- Newton-Raphson iterative convergence
- Partial credit support for multiple-response questions

**Data Visualization:**
- Recharts library for responsive charts
- Interactive tooltips with detailed statistics
- Color-coded performance indicators (green/yellow/red)
- Reference lines for targets and thresholds

**Performance Optimization:**
- Background question generation for zero wait time
- Automatic pre-loading of next question
- Efficient Firebase queries with proper indexing
- Client-side calculation caching

## License

MIT
