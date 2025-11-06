// Test different model names
import { query } from '@anthropic-ai/claude-agent-sdk';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing different model names...\n');

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}`);
  try {
    const result = query({
      prompt: 'Respond with exactly: {"status": "ok"}',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: modelName,
        cwd: process.cwd(),
        settingSources: [],
        maxTurns: 1,
      }
    });

    for await (const msg of result) {
      if (msg.type === 'result') {
        console.log('✅ Success! Result:', msg.result);
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

// Test without model (use default)
async function testNoModel() {
  console.log('Testing without model (use default)');
  try {
    const result = query({
      prompt: 'Respond with exactly: {"status": "ok"}',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        cwd: process.cwd(),
        settingSources: [],
        maxTurns: 1,
      }
    });

    for await (const msg of result) {
      if (msg.type === 'system') {
        console.log('System message model:', msg.model);
      }
      if (msg.type === 'result') {
        console.log('✅ Success! Result:', msg.result);
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function runTests() {
  // Test no model first (to see what default is)
  await testNoModel();
  console.log('---');

  // Test various model names
  const models = [
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet',
    'claude-3-sonnet',
    'claude-sonnet',
    'sonnet',
    'claude-3-opus-latest',
    'claude-3-opus',
    'claude-opus',
    'opus',
    'claude-3-haiku',
    'claude-haiku',
    'haiku',
  ];

  for (const model of models) {
    await testModel(model);
    console.log('---');
  }
}

runTests().catch(console.error);