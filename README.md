# Security+ SY0-701 Learning Platform

An AI-powered web application for CompTIA Security+ SY0-701 certification exam preparation with intelligent quiz generation and flashcard study system.

## Features

### Quiz Mode
- **AI-Generated Synthesis Questions**: Creates complex questions combining multiple security concepts using Claude 3.5 Sonnet
- **Instant Start with On-Demand Generation**: First question appears in ~10 seconds, remaining questions generate automatically in the background
- **Progressive Loading**: Zero wait time between questions - next question is always ready when you click "Next"
- **Adaptive Difficulty**: Questions vary across easy, medium, and hard levels with weighted scoring
- **Multiple-Response Questions**: Includes "select all that apply" questions with partial credit support
- **Item Response Theory (IRT) Scoring**: Advanced psychometric scoring system that weighs questions by difficulty
- **Partial Credit System**: Earn points for partially correct answers on multiple-response questions
- **Intelligent Score Prediction**: IRT-based ability estimation predicts your exam score (100-900 scale)

### Flashcard Mode
- **PDF/Text Upload**: Upload study materials (PDF or TXT files) for automatic processing
- **AI Key Term Extraction**: Claude AI analyzes documents and extracts Security+ relevant terms and definitions
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
- **Multi-Subject Support**: Organized homepage with subjects (Cybersecurity, Mathematics, Physics)
- **Cloud Sync**: All progress and flashcards automatically saved to Firebase (Firestore + Storage)
- **Progress Tracking**: Track answered questions, points earned, ability estimate, and predicted exam score
- **Dark Mode UI**: Eye-friendly dark interface with modern design
- **Smart Question Management**: Never repeats previously answered questions
- **Detailed Explanations**: Learn why correct answers are right and incorrect answers are wrong
- **Topic Tags**: Each question shows relevant Security+ topics covered
- **Flexible Quiz Flow**: End quiz anytime and return to home page
- **Reset Progress**: Clear quiz or flashcard progress independently

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **AI**: Claude 3.5 Sonnet (claude-sonnet-4-5-20250929) for question generation and flashcard extraction
- **Backend**: Firebase (Firestore Database + Firebase Storage + Google Authentication)
- **Document Processing**: pdf-parse for PDF text extraction
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

### Quiz Mode
1. **Google Authentication**: Users sign in with Google OAuth for secure access
2. **On-Demand Question Generation**:
   - First question generates immediately (~10 seconds)
   - Subsequent questions generate automatically in the background
   - Each new question triggers generation of the next one
   - Zero wait time between questions for seamless experience
3. **Question Types**: Claude AI generates unique synthesis questions with varied difficulty (easy/medium/hard) and types (single-choice/multiple-response)
4. **Adaptive Scoring**: Each question is worth different points based on difficulty:
   - Easy: 100 points
   - Medium: 150 points
   - Hard: 250 points
5. **Partial Credit**: Multiple-response questions award proportional credit (e.g., 3/4 correct = 75% of points)
6. **IRT Analysis**: System estimates your ability level (theta) using Item Response Theory
7. **Score Prediction**: Maps your ability estimate to the 100-900 exam score scale
8. **Cloud Sync**: All progress is stored in Firestore and synced across devices
9. **Smart Tracking**: Keeps track of answered questions to avoid repetition

### Flashcard Mode
1. **Upload**: User uploads PDF or TXT file containing Security+ study material
2. **Text Extraction**: System extracts text from PDF using pdf-parse or reads TXT directly
3. **AI Analysis**: Claude AI analyzes content and extracts key Security+ terms with definitions
4. **Flashcard Creation**: Terms are saved to Firestore in order of appearance
5. **Image Upload**: Optional image attachments stored in Firebase Storage (supports PNG, JPG, GIF, WebP up to 5MB)
6. **Spaced Repetition**: SM-2 algorithm calculates optimal review intervals
   - Ease Factor: Starts at 2.5, adjusts based on performance
   - Intervals: Dynamically calculated based on user ratings
   - Quality Score: Maps user difficulty ratings to 0-5 scale
7. **Review Tracking**: System monitors each card's review history and next due date
8. **Automatic Scheduling**: Cards appear when due based on spaced repetition algorithm
9. **Search & Filter**: Real-time search across terms, definitions, domains, and source files

## Features in Detail

### Synthesis Questions

Questions combine multiple topics from the Security+ syllabus:
- General Security Concepts
- Threats, Vulnerabilities, and Mitigations
- Security Architecture
- Security Operations
- Security Program Management and Oversight

### Question Types & Distribution

Each 10-question quiz includes a balanced mix:
- **3 Easy questions** (100 points each) - single-choice
- **4 Medium questions** (150 points each) - mix of single and multiple-response
- **3 Hard questions** (250 points each) - includes synthesis multiple-response questions

Total possible points per quiz: 1,550 points

### Progress Tracking

- Total questions answered
- Points earned vs. maximum possible points
- Overall accuracy percentage
- IRT ability estimate (theta: -3 to +3 scale)
- Predicted exam score (100-900 scale)
- Quiz history with detailed scoring

### Score Prediction with IRT

The app uses **Item Response Theory (IRT)**, the same psychometric model used in actual certification exams:

1. **Ability Estimation**: Calculates your ability level (theta) using Maximum Likelihood Estimation
2. **Question Parameters**: Each question has difficulty and discrimination parameters
3. **Adaptive Weighting**: Harder questions contribute more to your ability estimate
4. **Score Mapping**: Converts theta to the 100-900 scale
   - theta = -3: ~100 (very low)
   - theta = 0: ~550 (average)
   - theta = 1: ~750 (passing)
   - theta = 3: ~900 (very high)

**Passing Score**: 750/900 (requires theta ≈ 1.0)

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

#### Supported File Formats

- **PDF**: Automatically extracts text from PDF documents
- **TXT**: Plain text files with Security+ content

**Best Practices:**
- Upload study guides, textbooks, or notes
- Ensure content is Security+ SY0-701 related for best results
- AI extracts terms in document order for logical learning flow

## License

MIT
