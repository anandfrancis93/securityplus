import { adminDb } from './firebaseAdmin';
import { Question } from './types';

/**
 * Server-side quiz state stored in Firestore
 * SECURITY: Never exposed to client - contains correct answers
 */
export interface ServerQuizSession {
  userId: string;
  quizSessionId: string;
  questions: Question[]; // Full questions with correct answers
  answeredQuestions: Set<string>; // Question IDs that have been answered
  startedAt: number;
  expiresAt: number; // Sessions expire after 24 hours
}

/**
 * Create a new quiz session on the server
 * Stores questions with correct answers (never sent to client)
 */
export async function createQuizSession(
  userId: string,
  questions: Question[]
): Promise<string> {
  const quizSessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const sessionData = {
    userId,
    quizSessionId,
    questions: questions.map(q => ({
      ...q,
      // Ensure correct answer is stored
      correctAnswer: q.correctAnswer,
    })),
    answeredQuestions: [], // Empty array (will convert to Set when reading)
    startedAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  await adminDb
    .collection('quizSessions')
    .doc(quizSessionId)
    .set(sessionData);

  console.log(`Created quiz session ${quizSessionId} for user ${userId} with ${questions.length} questions`);

  return quizSessionId;
}

/**
 * Get a quiz session from the server
 * SECURITY: Only returns session if it belongs to the requesting user
 */
export async function getQuizSession(
  userId: string,
  quizSessionId: string
): Promise<ServerQuizSession | null> {
  const sessionDoc = await adminDb
    .collection('quizSessions')
    .doc(quizSessionId)
    .get();

  if (!sessionDoc.exists) {
    return null;
  }

  const sessionData = sessionDoc.data()!;

  // SECURITY: Verify session belongs to requesting user
  if (sessionData.userId !== userId) {
    console.error(`User ${userId} attempted to access quiz session ${quizSessionId} belonging to ${sessionData.userId}`);
    return null;
  }

  // Check expiration
  if (sessionData.expiresAt < Date.now()) {
    console.log(`Quiz session ${quizSessionId} has expired, deleting...`);
    await adminDb.collection('quizSessions').doc(quizSessionId).delete();
    return null;
  }

  return {
    ...sessionData,
    answeredQuestions: new Set(sessionData.answeredQuestions || []),
  } as ServerQuizSession;
}

/**
 * Get a specific question from a quiz session
 * SECURITY: Returns full question WITH correct answer (server-side only)
 */
export async function getQuestionFromSession(
  userId: string,
  quizSessionId: string,
  questionId: string
): Promise<Question | null> {
  const session = await getQuizSession(userId, quizSessionId);

  if (!session) {
    return null;
  }

  const question = session.questions.find(q => q.id === questionId);
  return question || null;
}

/**
 * Mark a question as answered to prevent replay attacks
 */
export async function markQuestionAnswered(
  userId: string,
  quizSessionId: string,
  questionId: string
): Promise<void> {
  const session = await getQuizSession(userId, quizSessionId);

  if (!session) {
    throw new Error('Quiz session not found or unauthorized');
  }

  // Add to answered questions
  const answeredQuestions = Array.from(session.answeredQuestions);
  answeredQuestions.push(questionId);

  await adminDb
    .collection('quizSessions')
    .doc(quizSessionId)
    .update({
      answeredQuestions,
    });

  console.log(`Marked question ${questionId} as answered in session ${quizSessionId}`);
}

/**
 * Check if a question has already been answered (prevent replay attacks)
 */
export async function isQuestionAnswered(
  userId: string,
  quizSessionId: string,
  questionId: string
): Promise<boolean> {
  const session = await getQuizSession(userId, quizSessionId);

  if (!session) {
    return false;
  }

  return session.answeredQuestions.has(questionId);
}

/**
 * Delete expired quiz sessions (cleanup function)
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = Date.now();

  const expiredSessions = await adminDb
    .collection('quizSessions')
    .where('expiresAt', '<', now)
    .get();

  let deletedCount = 0;
  const batch = adminDb.batch();

  expiredSessions.forEach(doc => {
    batch.delete(doc.ref);
    deletedCount++;
  });

  await batch.commit();

  console.log(`Deleted ${deletedCount} expired quiz sessions`);
  return deletedCount;
}

/**
 * Get sanitized questions for client (without correct answers)
 * SECURITY: Removes correctAnswer field before sending to client
 */
export function sanitizeQuestionsForClient(questions: Question[]): Partial<Question>[] {
  return questions.map(q => {
    const { correctAnswer, ...sanitizedQuestion } = q;
    return sanitizedQuestion;
  });
}

/**
 * Get a single sanitized question for client
 */
export function sanitizeQuestionForClient(question: Question): Partial<Question> {
  const { correctAnswer, ...sanitizedQuestion } = question;
  return sanitizedQuestion;
}

/**
 * Add a new question to an existing quiz session
 * Used when generating additional questions mid-quiz
 */
export async function addQuestionToSession(
  userId: string,
  quizSessionId: string,
  question: Question
): Promise<void> {
  const session = await getQuizSession(userId, quizSessionId);

  if (!session) {
    throw new Error('Quiz session not found or unauthorized');
  }

  // Add question to the session
  const updatedQuestions = [...session.questions, question];

  await adminDb
    .collection('quizSessions')
    .doc(quizSessionId)
    .update({
      questions: updatedQuestions,
    });

  console.log(`Added question ${question.id} to session ${quizSessionId}`);
}
