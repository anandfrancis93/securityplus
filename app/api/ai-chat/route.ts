import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { GrokProvider } from '@/lib/ai-providers/grok';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get Grok API key from environment
    const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!grokApiKey) {
      console.error('Grok API key not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Initialize Grok provider
    const grokProvider = new GrokProvider(grokApiKey);

    // Build conversation history for Grok
    const grokMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Add system prompt for Security+ context
    const systemPrompt = `You are an AI assistant specialized in CompTIA Security+ certification topics. You are knowledgeable about cybersecurity concepts, network security, cryptography, risk management, and all topics covered in the Security+ exam.

When answering questions:
- Provide clear, accurate, and helpful explanations
- Use examples when appropriate to illustrate concepts
- Be concise but thorough
- If the question is about Security+ topics, provide exam-relevant information
- For general questions, provide helpful and accurate answers
- Always maintain a professional and educational tone`;

    // Call Grok API with conversation history
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...grokMessages
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', response.status, error);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message.content;

    return NextResponse.json({
      message: aiMessage,
      usage: data.usage
    });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
