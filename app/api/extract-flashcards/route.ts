import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Next.js 15 App Router configuration
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// Vercel configuration for larger body size
export const runtime = 'nodejs';

// Helper function to process a batch of terms
async function processTermsBatch(
  batchText: string,
  termCount: number
): Promise<Array<{ term: string; definition: string; context?: string }>> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `You are a CompTIA Security+ SY0-701 expert. I will provide you with ${termCount} Security+ terms (one per line). Create EXACTLY ${termCount} flashcards.

CRITICAL: Create ONE flashcard for EACH LINE. Input has ${termCount} lines → Output MUST have ${termCount} flashcards.

For each line:
- Extract term name (before " - " or ":" or entire line)
- Use provided definition as context if available
- Add comprehensive Security+ definition

Return ONLY valid JSON:
{
  "flashcards": [
    {"term": "term1", "definition": "Security+ definition", "context": "optional"},
    ...${termCount} items total...
  ]
}

Terms:
${batchText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Parse JSON response
  let jsonContent = content.text.trim();
  jsonContent = jsonContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }

  const result = JSON.parse(jsonContent);

  if (!result.flashcards || !Array.isArray(result.flashcards)) {
    throw new Error('Invalid response format from AI');
  }

  return result.flashcards;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting flashcard extraction...');

    // Parse JSON body
    const body = await request.json();
    const { text, fileName = 'Manual Entry' } = body;

    if (!text) {
      console.error('No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    console.log(`Processing text input, length: ${text.length} characters`);

    const textContent = text.trim();

    if (!textContent.trim()) {
      console.error('Extracted text is empty');
      return NextResponse.json(
        { error: 'File appears to be empty or contains no readable text' },
        { status: 400 }
      );
    }

    console.log('Sending to Claude for analysis...');

    // Count the number of terms/lines
    const lines = textContent.split('\n').filter((line: string) => line.trim().length > 0);
    const termCount = lines.length;
    console.log(`Processing ${termCount} terms...`);

    // If more than 50 terms, process in batches
    const BATCH_SIZE = 50;
    const allFlashcards: Array<{ term: string; definition: string; context?: string }> = [];

    if (termCount > BATCH_SIZE) {
      console.log(`Large input detected. Processing in batches of ${BATCH_SIZE}...`);

      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(lines.length / BATCH_SIZE);

        console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} terms)...`);

        const batchText = batch.join('\n');
        const batchFlashcards = await processTermsBatch(batchText, batch.length);
        allFlashcards.push(...batchFlashcards);

        console.log(`Batch ${batchNumber} complete. Total flashcards so far: ${allFlashcards.length}`);
      }

      console.log(`All batches complete. Total: ${allFlashcards.length} flashcards`);

      return NextResponse.json({
        flashcards: allFlashcards,
        fileName,
      });
    }

    // Process small batches (50 or fewer terms)
    const flashcards = await processTermsBatch(textContent, termCount);

    console.log(`Successfully generated ${flashcards.length} flashcards`);

    return NextResponse.json({
      flashcards,
      fileName,
    });
  } catch (error) {
    console.error('Error extracting flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to extract flashcards: ${errorMessage}` },
      { status: 500 }
    );
  }
}
