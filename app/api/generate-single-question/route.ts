import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionWithTopics, selectQuestionType } from '@/lib/questionGenerator';
import { selectQuestionCategory, selectTopicsForQuestion } from '@/lib/quizPregeneration';
import { authenticateRequest, authenticateAndAuthorize } from '@/lib/apiAuth';
import { GenerateSingleQuestionSchema, safeValidateRequestBody } from '@/lib/apiValidation';
import { addQuestionToSession, sanitizeQuestionForClient, createQuizSession, getQuizSession } from '@/lib/quizStateManager';
import { generateUniqueQuestion } from '@/lib/similarityCheck';
import { selectTopicsWithFSRS, determineCurrentPhase } from '@/lib/topicSelectionFSRS';
import { ensureMetadataInitialized } from '@/lib/fsrsMetadataUpdate';
import { getUserProgress } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = safeValidateRequestBody(GenerateSingleQuestionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const {
      userId,
      quizSessionId,
      excludeTopics = [],
      questionNumber = 1,
    } = validation.data;

    // SECURITY: If userId provided, authenticate and authorize
    if (userId) {
      const authResult = await authenticateAndAuthorize(request, { userId });
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    // Get existing questions from session for similarity checking
    let existingQuestions: any[] = [];
    if (userId && quizSessionId) {
      try {
        const session = await getQuizSession(userId, quizSessionId);
        existingQuestions = session?.questions || [];
        console.log(`Found ${existingQuestions.length} existing questions in session for similarity check`);
      } catch (error) {
        console.warn('Could not retrieve existing questions for similarity check:', error);
        // Continue without similarity checking if session retrieval fails
      }
    }

    // Get user progress for FSRS-based topic selection
    let userProgress = null;
    let metadata = null;
    let selectedTopics: string[] = [];

    // Use deterministic difficulty distribution (3 easy, 4 medium, 3 hard)
    // Create distribution array and shuffle it once for consistency
    const difficultyDistribution: Array<'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics'> = [
      'single-domain-single-topic', 'single-domain-single-topic', 'single-domain-single-topic',           // 3 easy
      'single-domain-multiple-topics', 'single-domain-multiple-topics', 'single-domain-multiple-topics', 'single-domain-multiple-topics', // 4 medium
      'multiple-domains-multiple-topics', 'multiple-domains-multiple-topics', 'multiple-domains-multiple-topics'  // 3 hard
    ];

    // Shuffle using Fisher-Yates (seeded by questionNumber for consistency within a quiz)
    // Use questionNumber as seed so questions 1-10 always get same shuffled distribution
    const seed = Math.floor(Date.now() / 60000); // Changes every minute, but consistent within a quiz generation
    let random = seed;
    for (let i = difficultyDistribution.length - 1; i > 0; i--) {
      random = (random * 9301 + 49297) % 233280; // Simple LCG
      const j = Math.floor((random / 233280) * (i + 1));
      [difficultyDistribution[i], difficultyDistribution[j]] = [difficultyDistribution[j], difficultyDistribution[i]];
    }

    // Select category based on question number (1-10)
    const questionCategory = difficultyDistribution[questionNumber - 1] || 'single-domain-multiple-topics';
    console.log(`[DIFFICULTY] Q${questionNumber}: ${questionCategory}`);

    if (userId) {
      try {
        userProgress = await getUserProgress(userId);
        metadata = ensureMetadataInitialized(userProgress);

        // Determine how many topics to select based on category
        const topicCount = questionCategory === 'single-domain-single-topic' ? 1 :
                          questionCategory === 'single-domain-multiple-topics' ? 3 : 2;

        // Use FSRS-based topic selection
        selectedTopics = selectTopicsWithFSRS(metadata, topicCount, questionCategory);

        const phase = determineCurrentPhase(metadata);
        console.log(`[FSRS] Phase ${phase}: Selected topics for ${questionCategory}: ${selectedTopics.join(', ')}`);
      } catch (error) {
        console.warn('Could not use FSRS topic selection, falling back to random:', error);
        // Fallback to random selection if FSRS fails
        selectedTopics = selectTopicsForQuestion(questionCategory, []);
      }
    }

    // If no userId or FSRS selection failed, use random selection
    if (selectedTopics.length === 0) {
      selectedTopics = selectTopicsForQuestion(questionCategory, []);
    }

    // Select question type (single or multiple choice)
    const questionType = selectQuestionType();

    console.log(`Generating question ${questionNumber}: ${questionCategory} ${questionType}-choice, Topics: ${selectedTopics.join(', ')}`);

    // Generate question with similarity checking and retry logic
    const question = await generateUniqueQuestion(
      async () => {
        return await generateQuestionWithTopics(
          selectedTopics,
          questionCategory,
          questionType
        );
      },
      existingQuestions,
      3, // Max 3 retries
      0.85 // 85% similarity threshold
    );

    console.log(`Question ${questionNumber} generated successfully: ${question.difficulty} difficulty`);

    // Create or use existing quiz session
    let sessionId = quizSessionId;
    if (userId) {
      if (!sessionId) {
        // Create new quiz session for first question
        sessionId = await createQuizSession(userId, [question]);
        console.log(`Created new quiz session ${sessionId} for question 1`);
      } else {
        // Add to existing session
        await addQuestionToSession(userId, sessionId, question);
        console.log(`Added question to quiz session ${sessionId}`);
      }
    }

    // SECURITY: Sanitize question before returning (remove correct answer)
    const sanitizedQuestion = sanitizeQuestionForClient(question);

    return NextResponse.json({
      question: sanitizedQuestion,
      quizSessionId: sessionId  // Return session ID so client can use it
    });
  } catch (error: any) {
    console.error(`Error generating question:`, error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      status: error?.status,
      type: error?.type
    });

    // Check for specific Google AI API errors
    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: 'Too many requests to the AI service. Please wait a moment and try again.'
        },
        { status: 429 }
      );
    }

    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: 'API authentication error. Please contact support.'
        },
        { status: 401 }
      );
    }

    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return NextResponse.json(
        {
          error: 'Network error',
          details: 'Unable to connect to AI service. Please check your connection and try again.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate question',
        details: error?.message || 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
