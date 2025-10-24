import Anthropic from '@anthropic-ai/sdk';
import { Question } from './types';
import { calculateIRTParameters } from './irt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle question options to randomize correct answer position
function shuffleQuestionOptions(questionData: any): any {
  // Create array of indices [0, 1, 2, 3]
  const indices = [0, 1, 2, 3];

  // Shuffle indices
  const shuffledIndices = shuffleArray(indices);

  // Reorder options based on shuffled indices
  const shuffledOptions = shuffledIndices.map(i => questionData.options[i]);

  // Find new position of correct answer
  const newCorrectAnswerIndex = shuffledIndices.indexOf(questionData.correctAnswer);

  // Reorder explanations to match new option order
  const shuffledExplanations = shuffledIndices.map(i => questionData.incorrectExplanations[i]);

  return {
    ...questionData,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswerIndex,
    incorrectExplanations: shuffledExplanations
  };
}

const SECURITY_PLUS_TOPICS = `
1.0 General Security Concepts
- Security controls (Technical, Managerial, Operational, Physical)
- CIA Triad, Non-repudiation, AAA
- Zero Trust architecture
- Physical security measures
- Deception and disruption technology
- Change management processes
- Cryptographic solutions (PKI, encryption, hashing, digital signatures)

2.0 Threats, Vulnerabilities, and Mitigations
- Threat actors and motivations
- Attack vectors and surfaces
- Vulnerability types (application, OS, web, hardware, cloud, mobile)
- Malicious activity indicators
- Mitigation techniques

3.0 Security Architecture
- Architecture models (Cloud, IaC, Serverless, Microservices, IoT, ICS/SCADA)
- Enterprise infrastructure security
- Data protection strategies
- Resilience and recovery

4.0 Security Operations
- Hardening techniques
- Asset management
- Vulnerability management
- Monitoring and alerting
- Identity and access management
- Incident response
- Automation and orchestration

5.0 Security Program Management and Oversight
- Security governance
- Risk management
- Third-party risk assessment
- Compliance
- Audits and assessments
- Security awareness practices
`;

export async function generateSynthesisQuestion(
  excludeTopics: string[] = [],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  questionType: 'single' | 'multiple' = 'single'
): Promise<Question> {

  const difficultyGuidance = {
    easy: 'The question should be straightforward, testing basic understanding of 1-2 concepts with clear, distinguishable answer options.',
    medium: 'The question should require applying 2-3 concepts together with moderate complexity. Options should be plausible but distinguishable.',
    hard: 'The question should be complex, combining 3+ concepts in a nuanced scenario. Incorrect options should be subtly wrong and require deep understanding to eliminate.'
  };

  const typeGuidance = questionType === 'single'
    ? 'This is a SINGLE-CHOICE question. Provide exactly ONE correct answer (index 0-3).'
    : 'This is a MULTIPLE-RESPONSE question (select all that apply). Provide 2-3 correct answers as an array of indices (e.g., [0, 2] or [1, 2, 3]). The question should ask "Which of the following are..." or "Select all that apply".';

  const prompt = `Generate a single CompTIA Security+ SY0-701 synthesis question that combines multiple security concepts.

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficultyGuidance[difficulty]}

QUESTION TYPE: ${questionType.toUpperCase()}
${typeGuidance}

IMPORTANT REQUIREMENTS:
1. The question must be a SYNTHESIS question combining security topics
2. Present a realistic scenario requiring application of multiple concepts
3. Include 4 answer options (A, B, C, D)
4. Explain why the correct answer(s) are right
5. Explain why each option is correct or wrong (provide 4 explanations)
6. Tag with relevant topic areas

CRITICAL - ANSWER LENGTH RANDOMIZATION:
- VARY the length of ALL answer options
- Make some INCORRECT answers LONGER than correct answers
- Make some INCORRECT answers MORE DETAILED than correct answers
- The correct answer should NOT always be the longest option
- Some correct answers should be SHORT and concise
- Some incorrect answers should be LONG and detailed but subtly wrong
- This prevents guessing based on answer length

Topics to cover:
${SECURITY_PLUS_TOPICS}

${excludeTopics.length > 0 ? `Avoid these previously used topics: ${excludeTopics.join(', ')}` : ''}

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": ${questionType === 'single' ? '0' : '[0, 2]'},
  "explanation": "why the correct answer(s) are right",
  "incorrectExplanations": ["why option 0 is wrong/right", "why option 1 is wrong/right", "why option 2 is wrong/right", "why option 3 is wrong/right"],
  "topics": ["topic1", "topic2", "topic3"],
  "difficulty": "${difficulty}"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: `You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality synthesis questions that test understanding across multiple security domains. Return only valid JSON, no markdown formatting.\n\n${prompt}`
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const textContent = content.text.trim();

    // Remove markdown code blocks if present
    const jsonContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const questionData = JSON.parse(jsonContent);

    // Shuffle the answer options to randomize correct answer position
    // Only shuffle for single-choice questions
    const shuffledData = questionType === 'single' ? shuffleQuestionOptions(questionData) : questionData;

    // Calculate IRT parameters based on difficulty
    const irtParams = calculateIRTParameters(difficulty);

    const correctAnswerDisplay = Array.isArray(shuffledData.correctAnswer)
      ? `[${shuffledData.correctAnswer.join(', ')}]`
      : shuffledData.correctAnswer;

    console.log(`Question generated: Type=${questionType}, Difficulty=${difficulty}, Correct=${correctAnswerDisplay}, Points=${irtParams.maxPoints}`);

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: shuffledData.question,
      options: shuffledData.options,
      correctAnswer: shuffledData.correctAnswer,
      explanation: shuffledData.explanation,
      incorrectExplanations: shuffledData.incorrectExplanations,
      topics: shuffledData.topics,
      difficulty: shuffledData.difficulty,
      questionType: questionType,
      irtDifficulty: irtParams.irtDifficulty,
      irtDiscrimination: irtParams.irtDiscrimination,
      maxPoints: irtParams.maxPoints,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate question');
  }
}

/**
 * Generate a batch of questions with varied difficulty and types
 *
 * Distribution for 10 questions:
 * - 3 easy (1 single, 2 single)
 * - 4 medium (2 single, 2 multiple-response)
 * - 3 hard (2 single, 1 multiple-response)
 *
 * This creates a balanced mix similar to the real Security+ exam
 */
export async function generateQuestionBatch(count: number, excludeTopics: string[] = []): Promise<Question[]> {
  const usedTopics = [...excludeTopics];

  // Define question configuration for adaptive difficulty
  const questionConfigs = [
    { difficulty: 'easy' as const, type: 'single' as const },
    { difficulty: 'easy' as const, type: 'single' as const },
    { difficulty: 'easy' as const, type: 'single' as const },
    { difficulty: 'medium' as const, type: 'single' as const },
    { difficulty: 'medium' as const, type: 'single' as const },
    { difficulty: 'medium' as const, type: 'multiple' as const },
    { difficulty: 'medium' as const, type: 'multiple' as const },
    { difficulty: 'hard' as const, type: 'single' as const },
    { difficulty: 'hard' as const, type: 'single' as const },
    { difficulty: 'hard' as const, type: 'multiple' as const },
  ];

  // Shuffle configs to randomize question order
  const shuffledConfigs = shuffleArray(questionConfigs).slice(0, count);

  console.log(`Generating ${count} questions in parallel...`);

  // Generate all questions in parallel for much faster generation
  const questionPromises = shuffledConfigs.map(async (config, index) => {
    // Retry up to 3 times if generation fails
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const question = await generateSynthesisQuestion(usedTopics, config.difficulty, config.type);
        console.log(`Generated ${index + 1}/${count}: ${config.difficulty} ${config.type}-choice (${question.maxPoints} pts)`);
        return question;
      } catch (error) {
        lastError = error;
        console.error(`Error generating question ${index + 1} (attempt ${attempt}/${maxRetries}):`, error);

        // Wait a bit before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error(`Failed to generate question ${index + 1} after ${maxRetries} attempts`);
    return null;
  });

  // Wait for all questions to be generated
  const results = await Promise.all(questionPromises);

  // Filter out any failed generations
  const questions = results.filter((q): q is Question => q !== null);

  console.log(`Successfully generated ${questions.length}/${count} questions`);

  // If we didn't get enough questions, try to generate more to reach the target
  if (questions.length < count) {
    console.log(`Attempting to generate ${count - questions.length} more questions to reach target of ${count}...`);

    const additionalNeeded = count - questions.length;
    const additionalConfigs = shuffleArray(questionConfigs).slice(0, additionalNeeded);

    const additionalPromises = additionalConfigs.map(async (config, index) => {
      try {
        const question = await generateSynthesisQuestion(usedTopics, config.difficulty, config.type);
        console.log(`Generated additional ${index + 1}/${additionalNeeded}: ${config.difficulty} ${config.type}-choice`);
        return question;
      } catch (error) {
        console.error(`Error generating additional question ${index + 1}:`, error);
        return null;
      }
    });

    const additionalResults = await Promise.all(additionalPromises);
    const additionalQuestions = additionalResults.filter((q): q is Question => q !== null);

    questions.push(...additionalQuestions);
    console.log(`Final count: ${questions.length}/${count} questions`);
  }

  return questions;
}
