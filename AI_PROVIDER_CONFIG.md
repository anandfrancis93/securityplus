# AI Provider Configuration Guide

This application supports multiple AI providers for generating quiz questions. You can easily switch between Google Gemini and xAI Grok.

## Supported Providers

### 1. Google Gemini (Default)
- **Model**: Gemini 2.5 Flash Lite
- **Pricing**: $0.0375 per 1M input tokens, $0.15 per 1M output tokens
- **Best for**: Cost-effective, fast responses

### 2. xAI Grok 4 Fast
- **Models**:
  - `grok-4-fast-reasoning`: Better for complex questions (default)
  - `grok-4-fast-non-reasoning`: Faster responses
- **Pricing**: $0.20 per 1M input tokens, $0.50 per 1M output tokens
- **Best for**: Higher quality reasoning, better question generation

## Configuration

### Step 1: Set Environment Variables

Add the following to your `.env.local` file:

#### For Gemini (Default):
```env
# No need to set NEXT_PUBLIC_AI_PROVIDER, defaults to 'gemini'
GOOGLE_API_KEY=your-gemini-api-key-here
```

#### For Grok:
```env
NEXT_PUBLIC_AI_PROVIDER=grok
XAI_API_KEY=your-xai-api-key-here
# or
GROK_API_KEY=your-xai-api-key-here
```

### Step 2: Get API Keys

#### Google Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Copy the API key

#### xAI Grok API Key:
1. Go to [xAI Developer Portal](https://x.ai/api)
2. Sign up for an account
3. Generate an API key
4. Copy the API key

## Switching Providers

To switch between providers, simply update the `NEXT_PUBLIC_AI_PROVIDER` in your `.env.local`:

```env
# Use Gemini
NEXT_PUBLIC_AI_PROVIDER=gemini

# Use Grok
NEXT_PUBLIC_AI_PROVIDER=grok
```

Then restart your development server:
```bash
npm run dev
```

## Cost Comparison

Based on 1000 quiz questions (approximately):
- **Gemini**: ~$0.05 - $0.10 total
- **Grok**: ~$0.30 - $0.50 total

Grok is more expensive but may provide better quality questions with improved reasoning.

## Troubleshooting

### Error: "GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required"
- Ensure you have set the `GOOGLE_API_KEY` in your `.env.local` file
- Make sure the `.env.local` file is in the root directory

### Error: "GROK_API_KEY or XAI_API_KEY environment variable is required"
- Ensure you have set either `GROK_API_KEY` or `XAI_API_KEY` in your `.env.local`
- Verify your API key is valid

### Error: "Grok API error: 401"
- Your xAI API key is invalid or expired
- Check your account at [x.ai](https://x.ai/api)

### Error: "Grok API error: 429"
- You've hit the rate limit
- Wait a few minutes or upgrade your xAI plan

## Advanced Configuration

### Using Different Grok Models

The adapter automatically chooses between reasoning and non-reasoning models based on the use case. To force a specific model, modify `lib/ai-providers/grok.ts`:

```typescript
// Force non-reasoning model for faster responses
const model = 'grok-4-fast-non-reasoning';

// Force reasoning model for better quality
const model = 'grok-4-fast-reasoning';
```

## Notes

- The application will automatically fall back to Gemini if the configured provider fails to initialize
- Provider information is logged to the console on startup
- Both providers are configured to return JSON-formatted quiz questions
- The unified interface ensures no code changes are needed when switching providers