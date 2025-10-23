# Security+ SY0-701 MCQ Generator

An AI-powered web application that generates synthesis questions for CompTIA Security+ SY0-701 certification exam preparation.

## Features

### Core Features
- **AI-Generated Synthesis Questions**: Creates complex questions combining multiple security concepts using Claude 3.5 Sonnet
- **Adaptive Difficulty**: Questions vary across easy, medium, and hard levels with weighted scoring
- **Multiple-Response Questions**: Includes "select all that apply" questions with partial credit support
- **Item Response Theory (IRT) Scoring**: Advanced psychometric scoring system that weighs questions by difficulty
- **Partial Credit System**: Earn points for partially correct answers on multiple-response questions
- **Intelligent Score Prediction**: IRT-based ability estimation predicts your exam score (100-900 scale)

### User Experience
- **Device Pairing**: Sync progress across devices with a simple 6-digit code (no account needed)
- **Cloud Sync**: All progress automatically saved to Firebase
- **Progress Tracking**: Track answered questions, points earned, ability estimate, and predicted exam score
- **Dark Mode UI**: Eye-friendly dark interface
- **Smart Question Management**: Never repeats previously answered questions
- **Detailed Explanations**: Learn why correct answers are right and incorrect answers are wrong
- **Flexible Quiz Flow**: End quiz anytime and return to home page
- **Reset Progress**: Clear all data and start fresh anytime

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: Claude 3.5 Sonnet for question generation
- **Backend**: Firebase (Firestore + Anonymous Auth)
- **Deployment**: Vercel

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
3. Enable Firestore Database
4. Enable Anonymous Authentication:
   - Go to Authentication → Sign-in method
   - Enable Anonymous provider
5. Get your Firebase configuration from Project Settings

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

1. **Anonymous Authentication**: Users are automatically authenticated anonymously via Firebase
2. **Question Generation**: Claude AI generates unique synthesis questions with varied difficulty (easy/medium/hard) and types (single-choice/multiple-response)
3. **Adaptive Scoring**: Each question is worth different points based on difficulty:
   - Easy: 100 points
   - Medium: 150 points
   - Hard: 250 points
4. **Partial Credit**: Multiple-response questions award proportional credit (e.g., 3/4 correct = 75% of points)
5. **IRT Analysis**: System estimates your ability level (theta) using Item Response Theory
6. **Score Prediction**: Maps your ability estimate to the 100-900 exam score scale
7. **Cloud Sync**: All progress is stored in Firestore and synced across devices
8. **Smart Tracking**: Keeps track of answered questions to avoid repetition

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

## License

MIT
