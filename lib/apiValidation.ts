import { z } from 'zod';

// Firebase UID validation (28 characters, alphanumeric)
const FirebaseUidSchema = z.string().regex(/^[a-zA-Z0-9]{20,40}$/, 'Invalid Firebase UID format');

// Question generation schemas
export const GenerateQuestionsSchema = z.object({
  count: z.number().int().min(1).max(100).optional(),
  excludeTopics: z.array(z.string().max(300)).max(100).optional(),
});

export const GenerateSingleQuestionSchema = z.object({
  userId: FirebaseUidSchema.optional(),
  quizSessionId: z.string().min(1).max(100).optional(),
  excludeTopics: z.array(z.string().max(300)).max(100).optional(),
  questionNumber: z.number().int().min(1).max(100).optional(),
});

export const GenerateRemainingQuestionsSchema = z.object({
  count: z.number().int().min(1).max(50).optional(),
  excludeTopics: z.array(z.string().max(300)).max(100).optional(),
});

// Quiz pregeneration schema
export const PregenerateQuizSchema = z.object({
  userId: FirebaseUidSchema,
  completedQuestions: z.array(z.any()).optional(), // Complex object, validated elsewhere
});

// Clear cached quiz schema
export const ClearCachedQuizSchema = z.object({
  userId: FirebaseUidSchema,
});

// Flashcard extraction schema
export const ExtractFlashcardsSchema = z.object({
  text: z.string().min(10).max(100000), // Max ~100KB of text
  domain: z.string().max(200).optional(),
  sourceFile: z.string().max(500).optional(),
});

// Pairing validation schema
export const ValidatePairingCodeSchema = z.object({
  code: z.string().length(6).regex(/^[A-Z0-9]{6}$/, 'Pairing code must be 6 uppercase alphanumeric characters'),
});

// Create pairing code schema
export const CreatePairingCodeSchema = z.object({
  userId: FirebaseUidSchema,
});

// Answer verification schema
export const VerifyAnswerSchema = z.object({
  userId: FirebaseUidSchema,
  quizSessionId: z.string().min(1).max(100),
  questionId: z.string().min(1).max(100),
  userAnswer: z.union([
    z.number().int().min(0).max(3), // Single answer (0-3)
    z.array(z.number().int().min(0).max(3)).min(1).max(4), // Multiple answers
  ]),
  questionNumber: z.number().int().min(1).max(100).optional(),
});

/**
 * Validate request body against a Zod schema
 * Returns validated data or throws error with details
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Safe wrapper that returns validation result or error response
 */
export function safeValidateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Invalid request body' };
  }
}
