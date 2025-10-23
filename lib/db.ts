import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { UserProgress, QuizSession, Question } from './types';

const USERS_COLLECTION = 'users';
const QUESTIONS_COLLECTION = 'questions';

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }

    // Create new user progress
    const newProgress: UserProgress = {
      userId,
      answeredQuestions: [],
      correctAnswers: 0,
      totalQuestions: 0,
      lastUpdated: Date.now(),
      quizHistory: [],
    };

    await setDoc(docRef, newProgress);
    return newProgress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

export async function updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...progress,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

export async function saveQuizSession(userId: string, session: QuizSession): Promise<void> {
  try {
    console.log('saveQuizSession called with:', { userId, sessionId: session.id, questionsCount: session.questions.length });

    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    let userData: UserProgress;

    if (userDoc.exists()) {
      console.log('User document exists, loading existing data');
      userData = userDoc.data() as UserProgress;
    } else {
      console.log('User document does not exist, creating new one');
      // Create new user progress if it doesn't exist
      userData = {
        userId,
        answeredQuestions: [],
        correctAnswers: 0,
        totalQuestions: 0,
        lastUpdated: Date.now(),
        quizHistory: [],
      };
    }

    const quizHistory = userData.quizHistory || [];

    // Update or add quiz session
    const existingIndex = quizHistory.findIndex(q => q.id === session.id);
    if (existingIndex >= 0) {
      quizHistory[existingIndex] = session;
    } else {
      quizHistory.push(session);
    }

    // Update answered questions
    const answeredQuestions = new Set(userData.answeredQuestions || []);
    session.questions.forEach(q => {
      answeredQuestions.add(q.questionId);
    });

    // Calculate correct answers from this session
    const sessionCorrectAnswers = session.questions.filter(q => q.isCorrect).length;

    const updatedProgress: UserProgress = {
      userId,
      quizHistory,
      answeredQuestions: Array.from(answeredQuestions),
      correctAnswers: (userData.correctAnswers || 0) + sessionCorrectAnswers,
      totalQuestions: (userData.totalQuestions || 0) + session.questions.length,
      lastUpdated: Date.now(),
    };

    console.log('Saving updated progress:', {
      totalQuestions: updatedProgress.totalQuestions,
      correctAnswers: updatedProgress.correctAnswers,
      quizHistoryCount: updatedProgress.quizHistory.length
    });

    // Use setDoc to create or update the document
    await setDoc(userRef, updatedProgress);
    console.log('Progress saved successfully to Firestore');
  } catch (error) {
    console.error('Error saving quiz session:', error);
    throw error;
  }
}

export async function getAnsweredQuestions(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProgress;
      return data.answeredQuestions || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting answered questions:', error);
    return [];
  }
}

export async function saveQuestion(question: Question): Promise<void> {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, question.id);
    await setDoc(docRef, question);
  } catch (error) {
    console.error('Error saving question:', error);
    throw error;
  }
}

export async function calculatePredictedScore(progress: UserProgress): Promise<number> {
  if (progress.totalQuestions === 0) return 0;

  const accuracy = progress.correctAnswers / progress.totalQuestions;

  // Security+ passing score is 750/900 (83.3%)
  // Map user's accuracy to the 100-900 scale
  const predictedScore = Math.round(accuracy * 900);

  return Math.max(100, Math.min(900, predictedScore));
}

export async function resetUserProgress(userId: string): Promise<void> {
  try {
    console.log('Resetting progress for user:', userId);
    const userRef = doc(db, USERS_COLLECTION, userId);

    const resetProgress: UserProgress = {
      userId,
      answeredQuestions: [],
      correctAnswers: 0,
      totalQuestions: 0,
      lastUpdated: Date.now(),
      quizHistory: [],
    };

    await setDoc(userRef, resetProgress);
    console.log('User progress reset successfully');
  } catch (error) {
    console.error('Error resetting user progress:', error);
    throw error;
  }
}
