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
  orderBy,
  limit as firestoreLimit,
  deleteDoc,
} from 'firebase/firestore';
import { UserProgress, QuizSession, Question, QuestionAttempt, TopicPerformance, CachedQuiz } from './types';
import { estimateAbility, estimateAbilityWithError, calculateIRTScore } from './irt';
import { ensureMetadataInitialized, updateMetadataAfterQuiz, syncTopicPerformanceToUserProgress } from './fsrsMetadataUpdate';

const USERS_COLLECTION = 'users';
const QUESTIONS_COLLECTION = 'questions';
const QUIZZES_SUBCOLLECTION = 'quizzes';

/**
 * Remove undefined values from an object recursively
 * Firestore doesn't allow undefined values
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined && item !== null);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Load quiz history from subcollection
 * This prevents the main user document from growing too large
 */
export async function loadQuizHistory(userId: string, limitCount?: number): Promise<QuizSession[]> {
  try {
    const quizzesRef = collection(db, USERS_COLLECTION, userId, QUIZZES_SUBCOLLECTION);
    const quizzesQuery = limitCount
      ? query(quizzesRef, orderBy('startedAt', 'desc'), firestoreLimit(limitCount))
      : query(quizzesRef, orderBy('startedAt', 'desc'));

    const querySnapshot = await getDocs(quizzesQuery);
    const quizzes: QuizSession[] = [];

    querySnapshot.forEach((doc) => {
      quizzes.push(doc.data() as QuizSession);
    });

    return quizzes;
  } catch (error) {
    console.error('Error loading quiz history:', error);
    return [];
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProgress;

      // Load quiz history from subcollection instead of storing in main document
      data.quizHistory = await loadQuizHistory(userId);

      // Ensure abilityStandardError exists (for backwards compatibility with existing users)
      if (data.abilityStandardError === undefined && data.quizHistory && data.quizHistory.length > 0) {
        const allAttempts: QuestionAttempt[] = data.quizHistory.flatMap(quiz => quiz.questions);
        const { standardError } = allAttempts.length > 0
          ? estimateAbilityWithError(allAttempts)
          : { standardError: Infinity };
        data.abilityStandardError = standardError;
      } else if (data.abilityStandardError === undefined) {
        data.abilityStandardError = Infinity;
      }

      return data;
    }

    // Create new user progress
    const newProgress: UserProgress = {
      userId,
      answeredQuestions: [],
      correctAnswers: 0,
      totalQuestions: 0,
      totalPoints: 0,
      maxPossiblePoints: 0,
      estimatedAbility: 0,
      abilityStandardError: Infinity,
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
        totalPoints: 0,
        maxPossiblePoints: 0,
        estimatedAbility: 0,
        lastUpdated: Date.now(),
        quizHistory: [], // Will be empty, quizzes stored in subcollection
      };
    }

    // Save quiz to subcollection instead of array in main document
    const quizRef = doc(db, USERS_COLLECTION, userId, QUIZZES_SUBCOLLECTION, session.id);
    const cleanedSession = removeUndefinedValues(session) as QuizSession;
    await setDoc(quizRef, cleanedSession);
    console.log('Quiz session saved to subcollection:', session.id);

    // Load all quiz history from subcollection for calculations
    const quizHistory = await loadQuizHistory(userId);

    // Update answered questions
    const answeredQuestions = new Set(userData.answeredQuestions || []);
    session.questions.forEach(q => {
      answeredQuestions.add(q.questionId);
    });

    // Calculate correct answers and points from this session
    const sessionCorrectAnswers = session.questions.filter(q => q.isCorrect).length;
    const sessionPoints = session.questions.reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
    const sessionMaxPoints = session.questions.reduce((sum, q) => sum + (q.maxPoints || 100), 0);

    // Get all attempts across all quizzes for ability estimation
    const allAttempts: QuestionAttempt[] = quizHistory.flatMap(quiz => quiz.questions);

    // Estimate ability using IRT with standard error for confidence intervals
    const { theta: estimatedAbility, standardError: abilityStandardError } = allAttempts.length > 0
      ? estimateAbilityWithError(allAttempts)
      : { theta: 0, standardError: Infinity };

    // Initialize or get quiz metadata and update with FSRS
    console.log('[FSRS] Initializing metadata...');
    // Load quizHistory for FSRS initialization
    userData.quizHistory = quizHistory;
    const quizMetadata = ensureMetadataInitialized(userData);
    console.log('[FSRS] Metadata initialized successfully');

    console.log('[FSRS] Updating metadata after quiz...');
    const updatedMetadata = updateMetadataAfterQuiz(quizMetadata, session.questions);
    console.log('[FSRS] Metadata updated successfully');

    console.log('[FSRS] Syncing topic performance...');
    const topicPerformance = syncTopicPerformanceToUserProgress(updatedMetadata);
    console.log('[FSRS] Topic performance synced successfully');

    const updatedProgress: UserProgress = {
      userId,
      // DO NOT store quizHistory in main document - it's in subcollection
      quizHistory: [],
      answeredQuestions: Array.from(answeredQuestions),
      correctAnswers: (userData.correctAnswers || 0) + sessionCorrectAnswers,
      totalQuestions: (userData.totalQuestions || 0) + session.questions.length,
      totalPoints: (userData.totalPoints || 0) + sessionPoints,
      maxPossiblePoints: (userData.maxPossiblePoints || 0) + sessionMaxPoints,
      estimatedAbility,
      abilityStandardError,
      topicPerformance,
      quizMetadata: updatedMetadata, // Always include FSRS metadata
      lastUpdated: Date.now(),
    };

    console.log('Saving updated progress:', {
      totalQuestions: updatedProgress.totalQuestions,
      correctAnswers: updatedProgress.correctAnswers,
      totalPoints: updatedProgress.totalPoints,
      maxPossiblePoints: updatedProgress.maxPossiblePoints,
      estimatedAbility: updatedProgress.estimatedAbility,
      quizHistoryCount: quizHistory.length
    });

    // Clean undefined values before saving to Firestore
    const cleanedProgress = removeUndefinedValues(updatedProgress) as UserProgress;

    // Use setDoc to create or update the document
    await setDoc(userRef, cleanedProgress);
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

  // Use IRT-based scoring if we have ability estimate
  const irtScore = calculateIRTScore(progress);

  console.log('Predicted score calculated:', {
    totalQuestions: progress.totalQuestions,
    totalPoints: progress.totalPoints,
    maxPossiblePoints: progress.maxPossiblePoints,
    estimatedAbility: progress.estimatedAbility,
    irtScore
  });

  return irtScore;
}

export async function resetUserProgress(userId: string): Promise<void> {
  try {
    console.log('[DEBUG db.ts] resetUserProgress called for user:', userId);
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Delete all quizzes from subcollection
    console.log('[DEBUG db.ts] Deleting all quizzes from subcollection...');
    const quizzesRef = collection(db, USERS_COLLECTION, userId, QUIZZES_SUBCOLLECTION);
    const quizzesSnapshot = await getDocs(quizzesRef);

    const deletions = quizzesSnapshot.docs.map(async (quizDoc) => {
      await deleteDoc(quizDoc.ref);
    });

    await Promise.all(deletions);
    console.log(`[DEBUG db.ts] Deleted ${quizzesSnapshot.size} quizzes from subcollection`);

    const resetProgress: UserProgress = {
      userId,
      answeredQuestions: [],
      correctAnswers: 0,
      totalQuestions: 0,
      totalPoints: 0,
      maxPossiblePoints: 0,
      estimatedAbility: 0,
      lastUpdated: Date.now(),
      quizHistory: [],
      // Do NOT preserve cachedQuiz or quizMetadata - complete reset
    };

    console.log('[DEBUG db.ts] Reset data prepared:', resetProgress);
    console.log('[DEBUG db.ts] Calling setDoc...');
    await setDoc(userRef, resetProgress);
    console.log('[DEBUG db.ts] setDoc completed successfully');
    console.log('[DEBUG db.ts] User progress reset successfully (including cached questions)');
  } catch (error) {
    console.error('[ERROR db.ts] Error resetting user progress:', error);
    throw error;
  }
}

/**
 * Save unused pre-generated questions to cache for next quiz
 * This prevents wasting questions when quiz is ended early
 */
export async function saveUnusedQuestionsToCache(userId: string, cachedQuiz: CachedQuiz): Promise<void> {
  try {
    console.log('Saving unused questions to cache:', {
      userId,
      questionsCount: cachedQuiz.questions.length,
      generatedForAbility: cachedQuiz.generatedForAbility,
      generatedAfterQuiz: cachedQuiz.generatedAfterQuiz
    });

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      cachedQuiz,
      lastUpdated: Date.now(),
    });

    console.log('Unused questions cached successfully');
  } catch (error) {
    console.error('Error saving unused questions to cache:', error);
    throw error;
  }
}

// Notification preference functions
export async function saveNotificationPreference(userId: string, enabled: boolean): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      notificationsEnabled: enabled,
    });
  } catch (error) {
    console.error('Error saving notification preference:', error);
    throw error;
  }
}

export async function getNotificationPreference(userId: string): Promise<boolean> {
  try {
    const progress = await getUserProgress(userId);
    return progress?.notificationsEnabled ?? false;
  } catch (error) {
    console.error('Error getting notification preference:', error);
    return false;
  }
}

/**
 * Extract domain from a topic string
 * Topics from questions are in format like "Zero Trust", "PKI", etc.
 * Map them to the 5 main SY0-701 domains
 */
function extractDomainFromTopics(topics: string[]): string {
  // Domain mapping keywords
  const domainKeywords = {
    '1.0 General Security Concepts': [
      'security control', 'technical', 'managerial', 'operational', 'physical',
      'cia', 'confidentiality', 'integrity', 'availability', 'non-repudiation',
      'authentication', 'authorization', 'accounting', 'aaa',
      'zero trust', 'adaptive identity', 'policy', 'trust zone',
      'bollard', 'vestibule', 'fencing', 'surveillance', 'guard', 'badge', 'lighting', 'sensor',
      'honeypot', 'honeynet', 'honeyfile', 'honeytoken',
      'change management', 'approval', 'backout', 'maintenance window',
      'pki', 'encryption', 'cryptographic', 'tpm', 'hsm', 'hashing', 'salting',
      'certificate', 'crl', 'ocsp', 'blockchain'
    ],
    '2.0 Threats, Vulnerabilities, and Mitigations': [
      'threat actor', 'nation-state', 'hacktivist', 'insider threat', 'organized crime',
      'phishing', 'vishing', 'smishing', 'social engineering', 'pretexting',
      'vulnerability', 'buffer overflow', 'injection', 'xss', 'sqli', 'race condition',
      'malware', 'ransomware', 'trojan', 'worm', 'spyware', 'virus', 'keylogger', 'rootkit',
      'ddos', 'dns attack', 'brute force', 'password spray',
      'mitigation', 'segmentation', 'patching', 'hardening', 'least privilege'
    ],
    '3.0 Security Architecture': [
      'cloud', 'iaac', 'serverless', 'microservices', 'containerization',
      'virtualization', 'iot', 'ics', 'scada', 'rtos', 'embedded',
      'network infrastructure', 'sdn', 'air-gapped', 'segmentation',
      'data protection', 'data classification', 'data at rest', 'data in transit',
      'resilience', 'high availability', 'load balancing', 'clustering',
      'backup', 'replication', 'snapshot', 'disaster recovery'
    ],
    '4.0 Security Operations': [
      'baseline', 'hardening', 'mdm', 'byod', 'cope', 'cyod',
      'wpa3', 'radius', 'wireless',
      'asset management', 'inventory', 'disposal', 'sanitization',
      'vulnerability scan', 'penetration test', 'cvss', 'cve',
      'monitoring', 'siem', 'log', 'alert', 'dlp', 'netflow',
      'firewall', 'ips', 'ids', 'web filter', 'dns filtering',
      'identity', 'access management', 'provisioning', 'sso', 'ldap', 'oauth', 'saml',
      'mfa', 'biometric', 'password', 'privileged access',
      'automation', 'orchestration', 'api', 'ci/cd',
      'incident response', 'forensics', 'chain of custody'
    ],
    '5.0 Security Program Management and Oversight': [
      'governance', 'policy', 'aup', 'procedure', 'playbook',
      'compliance', 'regulatory', 'audit', 'attestation',
      'risk management', 'risk assessment', 'sle', 'ale', 'aro',
      'third-party', 'vendor', 'sla', 'mou', 'msa', 'nda',
      'privacy', 'gdpr', 'data subject', 'right to be forgotten',
      'penetration testing', 'security awareness', 'training'
    ]
  };

  // Check each topic against domain keywords
  const topicsLower = topics.map(t => t.toLowerCase());

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const topic of topicsLower) {
      for (const keyword of keywords) {
        if (topic.includes(keyword)) {
          return domain;
        }
      }
    }
  }

  // Default to most general domain if no match
  return '1.0 General Security Concepts';
}

/**
 * Update topic performance tracking across sessions
 * Called when saving a quiz session
 */
export function updateTopicPerformance(
  existingTopicPerformance: { [topicName: string]: TopicPerformance } = {},
  session: QuizSession
): { [topicName: string]: TopicPerformance } {
  const updated = { ...existingTopicPerformance };

  for (const attempt of session.questions) {
    const topics = attempt.question.topics || [];

    for (const topic of topics) {
      // Skip invalid topics (null, undefined, empty strings)
      if (!topic || typeof topic !== 'string') {
        console.warn(`[Legacy Topic Update] Skipping invalid topic: ${topic}`);
        continue;
      }

      const domain = extractDomainFromTopics([topic]);

      if (!updated[topic]) {
        // Create new topic entry
        updated[topic] = {
          topicName: topic,
          domain,
          questionsAnswered: 0,
          correctAnswers: 0,
          totalPoints: 0,
          maxPoints: 0,
          accuracy: 0,
          lastTested: Date.now(),
          isMastered: false
        };
      }

      // Update topic stats
      const topicPerf = updated[topic];
      topicPerf.questionsAnswered += 1;
      topicPerf.correctAnswers += attempt.isCorrect ? 1 : 0;
      topicPerf.totalPoints += attempt.pointsEarned;
      topicPerf.maxPoints += attempt.maxPoints;
      topicPerf.accuracy = (topicPerf.correctAnswers / topicPerf.questionsAnswered) * 100;
      topicPerf.lastTested = Date.now();
      topicPerf.isMastered = topicPerf.accuracy >= 80 && topicPerf.questionsAnswered >= 3;
    }
  }

  return updated;
}
