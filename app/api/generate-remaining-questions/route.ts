import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisQuestion } from '@/lib/questionGenerator';

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const { count = 9, excludeTopics = [] } = await request.json();

    // Define question configurations
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

    // Shuffle and take the needed count
    const shuffledConfigs = shuffleArray(questionConfigs).slice(0, count);

    console.log(`Generating ${count} remaining questions in parallel...`);

    // Generate all questions in parallel
    const questionPromises = shuffledConfigs.map(async (config, index) => {
      // Retry up to 3 times if generation fails
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const question = await generateSynthesisQuestion(
            excludeTopics,
            config.difficulty,
            config.type
          );
          console.log(`Generated ${index + 2}/10: ${config.difficulty} ${config.type}-choice`);
          return question;
        } catch (error) {
          console.error(`Error generating question ${index + 2} (attempt ${attempt}/${maxRetries}):`, error);

          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      console.error(`Failed to generate question ${index + 2} after ${maxRetries} attempts`);
      return null;
    });

    // Wait for all questions
    const results = await Promise.all(questionPromises);
    const questions = results.filter((q) => q !== null);

    console.log(`Successfully generated ${questions.length}/${count} remaining questions`);

    // If we didn't get enough, try to generate more
    if (questions.length < count) {
      console.log(`Generating ${count - questions.length} additional questions...`);
      const additionalNeeded = count - questions.length;
      const additionalConfigs = shuffleArray(questionConfigs).slice(0, additionalNeeded);

      const additionalPromises = additionalConfigs.map(async (config) => {
        try {
          return await generateSynthesisQuestion(excludeTopics, config.difficulty, config.type);
        } catch (error) {
          console.error('Error generating additional question:', error);
          return null;
        }
      });

      const additionalResults = await Promise.all(additionalPromises);
      const additionalQuestions = additionalResults.filter((q) => q !== null);
      questions.push(...additionalQuestions);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating remaining questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate remaining questions' },
      { status: 500 }
    );
  }
}
