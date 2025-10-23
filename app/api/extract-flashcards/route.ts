import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure route to handle larger files (10MB limit)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Add maxDuration for Vercel
export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    console.log('Starting flashcard extraction...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Get file content
    let textContent = '';
    const fileName = file.name;

    if (file.type === 'application/pdf') {
      try {
        console.log('Parsing PDF...');
        // Parse PDF - dynamically import pdf-parse
        const { PDFParse } = await import('pdf-parse');
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`Buffer size: ${buffer.length} bytes`);

        const pdfParser = new PDFParse({ data: buffer });
        const textResult = await pdfParser.getText();
        textContent = textResult.text;
        console.log(`Extracted ${textContent.length} characters from PDF`);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json(
          { error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Parse text file (also check file extension for .txt)
      console.log('Reading text file...');
      textContent = await file.text();
      console.log(`Extracted ${textContent.length} characters from text file`);
    } else {
      console.error(`Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please upload PDF or TXT files.` },
        { status: 400 }
      );
    }

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
