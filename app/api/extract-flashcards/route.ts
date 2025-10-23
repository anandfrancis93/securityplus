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
    // Use Claude to create flashcards from the provided terms
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are a CompTIA Security+ SY0-701 expert. I will provide you with Security+ terms/keywords. For EACH term, create exactly ONE flashcard.

CRITICAL REQUIREMENTS:
1. Create EXACTLY ONE flashcard for EVERY term/keyword provided
2. If 10 terms are provided, create EXACTLY 10 flashcards
3. If 100 terms are provided, create EXACTLY 100 flashcards
4. Preserve the EXACT order of terms as they appear
5. Each term should have its own flashcard entry

For each term:
- Use the term EXACTLY as provided (don't modify it)
- Provide a clear, comprehensive Security+ definition (2-3 sentences)
- Add relevant context if the term appears with additional information

Format: Terms may be provided in these formats:
- "Term" (just the term)
- "Term - definition" (term with definition)
- "Term: definition" (term with definition)
- "Term. Description." (term with description)

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "flashcards": [
    {
      "term": "exact term",
      "definition": "comprehensive Security+ definition",
      "context": "additional context if provided"
    }
  ]
}

IMPORTANT: The number of flashcards in your response MUST EXACTLY MATCH the number of terms/keywords in the input.

Terms/Keywords:
${textContent.slice(0, 100000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the response
    const textResponse = content.text.trim();
    console.log('Claude response received, parsing JSON...');

    const jsonContent = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', textResponse.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    if (!result.flashcards || !Array.isArray(result.flashcards)) {
      console.error('Invalid response format:', result);
      return NextResponse.json(
        { error: 'AI returned invalid format. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`Successfully extracted ${result.flashcards.length} flashcards from ${fileName}`);

    return NextResponse.json({
      flashcards: result.flashcards,
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
