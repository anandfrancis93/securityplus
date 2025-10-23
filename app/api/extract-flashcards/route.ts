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
    // Use Claude to extract Security+ key terms
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are a CompTIA Security+ SY0-701 expert. Analyze the following document and extract key Security+ terms and concepts.

For each term:
1. Extract it EXACTLY as it appears in the document (preserve order from start to end)
2. Provide a clear, concise definition (2-3 sentences max)
3. Include relevant context from the document if available

Focus on:
- Security concepts, protocols, and technologies
- Threat types and attack vectors
- Security controls and mitigation techniques
- Cryptographic concepts
- Network security
- Access control and identity management
- Compliance and governance terms
- Any CompTIA Security+ SY0-701 exam objectives

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "flashcards": [
    {
      "term": "exact term from document",
      "definition": "clear definition",
      "context": "optional context from document"
    }
  ]
}

Document content:
${textContent.slice(0, 50000)}`,
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
