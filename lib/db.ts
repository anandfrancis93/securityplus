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
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProgress;
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

      // Calculate total correct answers
      const correctAnswers = session.questions.filter(q => q.isCorrect).length;

      await updateDoc(userRef, {
        quizHistory,
        answeredQuestions: Array.from(answeredQuestions),
        correctAnswers: (userData.correctAnswers || 0) + correctAnswers,
        totalQuestions: (userData.totalQuestions || 0) + session.questions.length,
        lastUpdated: Date.now(),
      });
    }
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
