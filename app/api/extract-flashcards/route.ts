import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateRequest } from '@/lib/apiAuth';
import { ExtractFlashcardsSchema, safeValidateRequestBody } from '@/lib/apiValidation';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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
  const apiResult = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are a CompTIA Security+ SY0-701 expert. I will provide you with ${termCount} Security+ terms (one per line). Create EXACTLY ${termCount} flashcards.

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
      },
    ],
    generationConfig: {
      maxOutputTokens: 8000,
      temperature: 0.3,
    },
  });

  const response = apiResult.response;

  // Parse JSON response
  let jsonContent = response.text().trim();
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

    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse JSON body
    const body = await request.json();

    // SECURITY: Validate input (basic validation, text can be large)
    if (!body.text || typeof body.text !== 'string') {
      console.error('Invalid or missing text');
      return NextResponse.json({ error: 'Invalid request: text field required' }, { status: 400 });
    }

    if (body.text.length > 100000) {
      return NextResponse.json({ error: 'Text too large (max 100KB)' }, { status: 400 });
    }

    const { text, fileName = 'Manual Entry' } = body;

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
