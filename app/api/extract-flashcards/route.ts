import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get file content
    let textContent = '';
    const fileName = file.name;

    if (file.type === 'application/pdf') {
      // Parse PDF - dynamically import pdf-parse
      const { PDFParse } = await import('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfParser = new PDFParse({ data: buffer });
      const textResult = await pdfParser.getText();
      textContent = textResult.text;
    } else if (file.type === 'text/plain') {
      // Parse text file
      textContent = await file.text();
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or TXT files.' },
        { status: 400 }
      );
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: 'File appears to be empty' },
        { status: 400 }
      );
    }

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
    const jsonContent = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonContent);

    console.log(`Extracted ${result.flashcards.length} flashcards from ${fileName}`);

    return NextResponse.json({
      flashcards: result.flashcards,
      fileName,
    });
  } catch (error) {
    console.error('Error extracting flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to extract flashcards from file' },
      { status: 500 }
    );
  }
}
