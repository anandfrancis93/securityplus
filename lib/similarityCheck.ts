import OpenAI from 'openai';
import { Question } from './types';

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate embedding for a question using OpenAI's text-embedding-3-small model
 * Cost: ~$0.000002 per question (100 tokens)
 */
export async function generateQuestionEmbedding(question: Question): Promise<number[]> {
  const client = getOpenAIClient();

  // Combine question text and options for comprehensive embedding
  const textToEmbed = `${question.question} ${(question.options || []).join(' ')}`;

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: textToEmbed,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate question embedding');
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 and 1 (typically 0 to 1 for embeddings)
 * Higher values = more similar
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Check if a candidate question is too similar to any existing questions
 * Returns { isSimilar: boolean, maxSimilarity: number, similarTo?: Question }
 */
export async function checkQuestionSimilarity(
  candidateQuestion: Question,
  existingQuestions: Question[],
  threshold: number = 0.85
): Promise<{
  isSimilar: boolean;
  maxSimilarity: number;
  similarTo?: Question;
}> {
  // If no existing questions, it's not similar
  if (existingQuestions.length === 0) {
    return { isSimilar: false, maxSimilarity: 0 };
  }

  try {
    // Generate embedding for candidate question
    const candidateEmbedding = await generateQuestionEmbedding(candidateQuestion);

    let maxSimilarity = 0;
    let mostSimilarQuestion: Question | undefined;

    // Compare with all existing questions
    for (const existingQuestion of existingQuestions) {
      // Generate embedding for existing question
      const existingEmbedding = await generateQuestionEmbedding(existingQuestion);

      // Calculate similarity
      const similarity = cosineSimilarity(candidateEmbedding, existingEmbedding);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarQuestion = existingQuestion;
      }
    }

    console.log(`[SIMILARITY CHECK] Max similarity: ${(maxSimilarity * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(0)}%)`);

    return {
      isSimilar: maxSimilarity >= threshold,
      maxSimilarity,
      similarTo: maxSimilarity >= threshold ? mostSimilarQuestion : undefined,
    };
  } catch (error) {
    console.error('Error checking question similarity:', error);
    // If similarity check fails, allow the question (fail open)
    // This prevents the entire quiz from breaking if OpenAI has issues
    console.warn('Similarity check failed, allowing question through');
    return { isSimilar: false, maxSimilarity: 0 };
  }
}

/**
 * Generate a unique question with retry logic
 * Attempts to generate a question that's not too similar to existing ones
 */
export async function generateUniqueQuestion(
  generateFn: () => Promise<Question>,
  existingQuestions: Question[],
  maxRetries: number = 3,
  similarityThreshold: number = 0.85
): Promise<Question> {
  let attempts = 0;
  let lastCandidate: Question | null = null;

  while (attempts < maxRetries) {
    attempts++;
    console.log(`[UNIQUENESS] Attempt ${attempts}/${maxRetries} to generate unique question`);

    // Generate candidate question
    const candidate = await generateFn();
    lastCandidate = candidate;

    // Check similarity
    const similarityResult = await checkQuestionSimilarity(
      candidate,
      existingQuestions,
      similarityThreshold
    );

    if (!similarityResult.isSimilar) {
      console.log(`[UNIQUENESS] ✓ Question is unique (similarity: ${(similarityResult.maxSimilarity * 100).toFixed(1)}%)`);
      return candidate;
    }

    console.warn(
      `[UNIQUENESS] ✗ Question too similar (${(similarityResult.maxSimilarity * 100).toFixed(1)}%), retrying...`
    );

    if (similarityResult.similarTo) {
      console.warn(`Similar to: "${similarityResult.similarTo.question.substring(0, 100)}..."`);
    }
  }

  // If all retries exhausted, log warning and return last candidate
  console.warn(
    `[UNIQUENESS] ⚠️  Failed to generate unique question after ${maxRetries} attempts, using last candidate`
  );
  return lastCandidate!;
}
