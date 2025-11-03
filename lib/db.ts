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
      quizzes.push({
        id: doc.id,
        ...doc.data()
      } as QuizSession);
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

      console.log('[getUserProgress] Raw data from Firestore:', {
        estimatedAbility: data.estimatedAbility,
        abilityStandardError: data.abilityStandardError,
        totalQuestions: data.totalQuestions
      });

      // Load quiz history from subcollection instead of storing in main document
      data.quizHistory = await loadQuizHistory(userId);

      // Load cached quiz from subcollection if it exists
      if (data.hasCachedQuiz) {
        try {
          const cachedQuizRef = doc(db, USERS_COLLECTION, userId, 'cached_quiz', 'current');
          const cachedQuizDoc = await getDoc(cachedQuizRef);
          if (cachedQuizDoc.exists()) {
            data.cachedQuiz = cachedQuizDoc.data() as CachedQuiz;
            console.log('[getUserProgress] Loaded cached quiz from subcollection:', {
              questionsCount: data.cachedQuiz?.questions?.length || 0
            });
          }
        } catch (error) {
          console.error('[getUserProgress] Error loading cached quiz:', error);
          // Don't fail the whole function if cached quiz fails to load
        }
      }

      // Ensure abilityStandardError exists (for backwards compatibility with existing users)
      if (data.abilityStandardError === undefined && data.quizHistory && data.quizHistory.length > 0) {
        console.log('[getUserProgress] abilityStandardError undefined, recalculating from quiz history');
        const allAttempts: QuestionAttempt[] = data.quizHistory.flatMap(quiz => quiz.questions);
        const { standardError } = allAttempts.length > 0
          ? estimateAbilityWithError(allAttempts)
          : { standardError: Infinity };
        data.abilityStandardError = standardError;
      } else if (data.abilityStandardError === undefined) {
        console.log('[getUserProgress] No quiz history, setting abilityStandardError to Infinity');
        data.abilityStandardError = Infinity;
      }

      console.log('[getUserProgress] Final data:', {
        estimatedAbility: data.estimatedAbility,
        abilityStandardError: data.abilityStandardError,
        totalQuestions: data.totalQuestions
      });

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

    // Load quiz history BEFORE saving current quiz to get accurate count
    // This ensures totalQuizzesCompleted doesn't include the quiz being saved
    const quizHistory = await loadQuizHistory(userId);

    // Save quiz to subcollection instead of array in main document
    const quizRef = doc(db, USERS_COLLECTION, userId, QUIZZES_SUBCOLLECTION, session.id);
    const cleanedSession = removeUndefinedValues(session) as QuizSession;
    await setDoc(quizRef, cleanedSession);
    console.log('Quiz session saved to subcollection:', session.id);

    // Update answered questions with size limit to prevent "too many index entries" error
    const answeredQuestions = new Set(userData.answeredQuestions || []);
    session.questions.forEach(q => {
      answeredQuestions.add(q.questionId);
    });

    // Limit to most recent 5000 questions to avoid Firebase limits
    const answeredQuestionsArray = Array.from(answeredQuestions);
    const limitedAnsweredQuestions = answeredQuestionsArray.slice(-5000);

    if (answeredQuestionsArray.length > 5000) {
      console.log(`[saveQuizSession] Trimmed answeredQuestions from ${answeredQuestionsArray.length} to 5000`);
    }

    // Calculate correct answers and points from this session
    const sessionCorrectAnswers = session.questions.filter(q => q.isCorrect).length;
    const sessionPoints = session.questions.reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
    const sessionMaxPoints = session.questions.reduce((sum, q) => sum + (q.maxPoints || 100), 0);

    // Get all attempts across all quizzes for ability estimation
    // Include current session questions since quizHistory was loaded BEFORE current quiz was saved
    const allAttempts: QuestionAttempt[] = [
      ...quizHistory.flatMap(quiz => quiz.questions),
      ...session.questions
    ];

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

    // Use updateDoc to only update specific fields, not the entire document
    // This avoids hitting the index limit on existing large documents
    const updates: any = {
      answeredQuestions: limitedAnsweredQuestions,
      correctAnswers: (userData.correctAnswers || 0) + sessionCorrectAnswers,
      totalQuestions: (userData.totalQuestions || 0) + session.questions.length,
      totalPoints: (userData.totalPoints || 0) + sessionPoints,
      maxPossiblePoints: (userData.maxPossiblePoints || 0) + sessionMaxPoints,
      estimatedAbility,
      abilityStandardError,
      lastUpdated: Date.now(),
      // Clear old quizHistory array if it exists (data is now in subcollection)
      quizHistory: [],
    };

    console.log('Updating progress:', {
      totalQuestions: updates.totalQuestions,
      correctAnswers: updates.correctAnswers,
      totalPoints: updates.totalPoints,
      maxPossiblePoints: updates.maxPossiblePoints,
      estimatedAbility: updates.estimatedAbility,
      abilityStandardError: updates.abilityStandardError,
      quizHistoryCount: quizHistory.length
    });

    // Try to update, but if it fails due to index limit, recreate the document
    try {
      await updateDoc(userRef, updates);
      console.log('Progress updated successfully');
    } catch (updateError: any) {
      if (updateError?.message?.includes('too many index entries')) {
        console.log('[RECOVERY] Document too large, recreating with fresh data...');

        // Delete the corrupted document
        await setDoc(userRef, {
          userId,
          answeredQuestions: updates.answeredQuestions,
          correctAnswers: updates.correctAnswers,
          totalQuestions: updates.totalQuestions,
          totalPoints: updates.totalPoints,
          maxPossiblePoints: updates.maxPossiblePoints,
          estimatedAbility: updates.estimatedAbility,
          abilityStandardError: updates.abilityStandardError,
          lastUpdated: updates.lastUpdated,
          quizHistory: [], // Empty, data in subcollection
          topicPerformance: {}, // Start fresh to avoid index issues
          quizMetadata: {
            totalQuizzesCompleted: updatedMetadata.totalQuizzesCompleted,
            currentPhase: updatedMetadata.currentPhase,
            allTopicsCoveredOnce: updatedMetadata.allTopicsCoveredOnce,
            questionHistory: {},
            topicCoverage: {},
            topicPerformance: {},
            lastParameterUpdate: Date.now(),
          },
        });

        console.log('[RECOVERY] Document recreated successfully');
        return; // Exit early, skip topic updates
      }
      throw updateError;
    }

    // Update topicPerformance and quizMetadata separately with smaller batches
    // Only update topics that were actually tested in this quiz
    const testedTopics = new Set(session.questions.flatMap(q => q.question.topics || []));
    const topicUpdates: any = {};

    for (const topicName of testedTopics) {
      if (topicName && topicPerformance[topicName]) {
        // Sanitize field name for Firestore (replace invalid characters)
        const sanitizedFieldName = topicName
          .replace(/\//g, '_')  // Replace forward slashes
          .replace(/\*/g, '_')  // Replace asterisks
          .replace(/~/g, '_')   // Replace tildes
          .replace(/\[/g, '_')  // Replace left brackets
          .replace(/\]/g, '_')  // Replace right brackets
          .replace(/\(/g, '_')  // Replace left parentheses
          .replace(/\)/g, '_')  // Replace right parentheses
          .replace(/\./g, '_'); // Replace dots (periods)
        topicUpdates[`topicPerformance.${sanitizedFieldName}`] = topicPerformance[topicName];
      }
    }

    if (Object.keys(topicUpdates).length > 0) {
      try {
        await updateDoc(userRef, topicUpdates);
        console.log(`Updated ${Object.keys(topicUpdates).length} topic performance entries`);
      } catch (topicError) {
        console.warn('Could not update topic performance, skipping:', topicError);
      }
    }

    // Update quiz metadata including topicPerformance
    // Store topicPerformance in quizMetadata where we can use original topic names
    try {
      await updateDoc(userRef, {
        'quizMetadata.totalQuizzesCompleted': updatedMetadata.totalQuizzesCompleted,
        'quizMetadata.currentPhase': updatedMetadata.currentPhase,
        'quizMetadata.allTopicsCoveredOnce': updatedMetadata.allTopicsCoveredOnce,
        'quizMetadata.topicPerformance': updatedMetadata.topicPerformance || {},
      });
      console.log('Quiz metadata updated');
    } catch (metadataError) {
      console.warn('Could not update quiz metadata, skipping:', metadataError);
    }
  } catch (error: any) {
    console.error('Error saving quiz session:', error);

    // If we hit the index limit, the user MUST reset their progress
    if (error?.message?.includes('too many index entries')) {
      throw new Error('Your progress data is too large. Please go to the Performance page and click "Reset Progress" to continue using the app. Your quiz will be saved after reset.');
    }

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
      topicPerformance: {},    // Clear topic review schedule
      // Note: Optional fields (quizMetadata, cachedQuiz) are omitted to avoid Firestore errors
      // Firestore doesn't accept undefined values, so we simply don't include these fields
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
 * FIXED: Store in subcollection to avoid "too many index entries" error
 */
export async function saveUnusedQuestionsToCache(userId: string, cachedQuiz: CachedQuiz): Promise<void> {
  try {
    console.log('Saving unused questions to cache:', {
      userId,
      questionsCount: cachedQuiz.questions.length,
      generatedForAbility: cachedQuiz.generatedForAbility,
      generatedAfterQuiz: cachedQuiz.generatedAfterQuiz
    });

    // Store cached quiz in a subcollection instead of main document
    // This avoids the "too many index entries" error
    const cachedQuizRef = doc(db, USERS_COLLECTION, userId, 'cached_quiz', 'current');

    // Clean the data to remove undefined values
    const cleanedCachedQuiz = removeUndefinedValues(cachedQuiz);

    await setDoc(cachedQuizRef, {
      ...cleanedCachedQuiz,
      lastUpdated: Date.now(),
    });

    // Update user document with just a flag indicating cache exists
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      hasCachedQuiz: true,
      cachedQuizUpdatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    console.log('Unused questions cached successfully in subcollection');
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
