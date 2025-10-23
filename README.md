# Security+ SY0-701 MCQ Generator

An AI-powered web application that generates synthesis questions for CompTIA Security+ SY0-701 certification exam preparation.

## Features

- **AI-Generated Synthesis Questions**: Creates complex questions combining multiple security concepts
- **Cloud Sync**: Progress synced across devices using Firebase (no account creation needed)
- **Progress Tracking**: Track answered questions, accuracy, and predicted exam score
- **Dark Mode UI**: Eye-friendly dark interface
- **Smart Question Management**: Never repeats previously answered questions
- **Detailed Explanations**: Learn why correct answers are right and incorrect answers are wrong
- **Flexible Quiz Flow**: End quiz anytime and return to home page

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4o-mini for question generation
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

### 4. Set Up OpenAI API

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Ensure you have credits available

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
OPENAI_API_KEY=your_openai_api_key_here

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

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## How It Works

1. **Anonymous Authentication**: Users are automatically authenticated anonymously via Firebase
2. **Question Generation**: AI generates unique synthesis questions combining multiple Security+ topics
3. **Cloud Sync**: All progress is stored in Firestore and synced across devices
4. **Score Prediction**: Algorithm predicts exam score (out of 900) based on performance
5. **Smart Tracking**: Keeps track of answered questions to avoid repetition

## Features in Detail

### Synthesis Questions

Questions combine multiple topics from the Security+ syllabus:
- General Security Concepts
- Threats, Vulnerabilities, and Mitigations
- Security Architecture
- Security Operations
- Security Program Management and Oversight

### Progress Tracking

- Total questions answered
- Correct answers count
- Overall accuracy percentage
- Predicted exam score (100-900 scale)
- Quiz history with scores

### Score Prediction

The app predicts your Security+ exam score based on:
- Your accuracy rate
- Number of questions answered
- Passing score: 750/900 (83.3%)

## License

MIT
