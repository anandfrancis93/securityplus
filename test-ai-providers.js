/**
 * Test script for AI providers
 * Run with: node test-ai-providers.js
 */

require('dotenv').config({ path: '.env.local' });

async function testProviders() {
  console.log('Testing AI Providers...\n');

  // Test current provider from environment
  const currentProvider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini';
  console.log(`Current provider setting: ${currentProvider}`);

  // Import the provider modules
  const { createAIProvider } = require('./lib/ai-providers');

  try {
    // Test the current provider
    console.log('\n--- Testing Current Provider ---');
    const provider = createAIProvider();
    const info = provider.getProviderInfo();
    const pricing = provider.getPricingInfo();

    console.log(`Provider: ${info.name}`);
    console.log(`Model: ${info.model}`);
    console.log(`Pricing: $${pricing.input}/${pricing.unit} (input), $${pricing.output}/${pricing.unit} (output)`);

    // Test generation
    console.log('\nGenerating test content...');
    const testPrompt = `Generate a simple JSON object with one field called "test" that contains the value "success". Return only valid JSON.`;

    const response = await provider.generateContent(testPrompt, {
      temperature: 0.5,
      maxOutputTokens: 100
    });

    console.log('Response:', response);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      console.log('Parsed JSON:', parsed);
      console.log('✅ Provider test successful!');
    } catch (e) {
      console.log('⚠️ Response is not valid JSON, but provider is working');
    }

  } catch (error) {
    console.error('❌ Error testing provider:', error.message);
    console.error('\nMake sure you have set the required API keys in .env.local:');
    if (currentProvider === 'gemini') {
      console.error('- GOOGLE_API_KEY=your-key-here');
    } else if (currentProvider === 'grok') {
      console.error('- XAI_API_KEY=your-key-here (or GROK_API_KEY)');
    }
  }

  // Show how to test different providers
  console.log('\n--- How to Test Different Providers ---');
  console.log('1. For Gemini (default):');
  console.log('   Remove or comment out NEXT_PUBLIC_AI_PROVIDER in .env.local');
  console.log('   Set GOOGLE_API_KEY=your-gemini-api-key');
  console.log('');
  console.log('2. For Grok:');
  console.log('   Set NEXT_PUBLIC_AI_PROVIDER=grok in .env.local');
  console.log('   Set XAI_API_KEY=your-xai-api-key');
}

// Run the test
testProviders().catch(console.error);