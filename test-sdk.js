// Test script to understand Claude Agent SDK behavior
import { query } from '@anthropic-ai/claude-agent-sdk';

console.log('Testing Claude Agent SDK configurations...\n');

// Test 1: Minimal configuration
async function test1_minimal() {
  console.log('Test 1: Minimal configuration');
  try {
    const result = query({
      prompt: 'Say "Hello World" and nothing else.',
    });

    for await (const msg of result) {
      console.log('Message type:', msg.type);
      if (msg.type === 'result') {
        console.log('Result:', msg.result || msg);
      }
    }
  } catch (error) {
    console.error('Test 1 Error:', error.message);
  }
  console.log('---\n');
}

// Test 2: With API key in options
async function test2_withApiKey() {
  console.log('Test 2: With API key in options');
  try {
    const result = query({
      prompt: 'Say "Hello World" and nothing else.',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      }
    });

    for await (const msg of result) {
      console.log('Message type:', msg.type);
      if (msg.type === 'result') {
        console.log('Result:', msg.result || msg);
      }
    }
  } catch (error) {
    console.error('Test 2 Error:', error.message);
  }
  console.log('---\n');
}

// Test 3: With model specified
async function test3_withModel() {
  console.log('Test 3: With model and API key');
  try {
    const result = query({
      prompt: 'Say "Hello World" and nothing else.',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-latest',
      }
    });

    for await (const msg of result) {
      console.log('Message type:', msg.type);
      if (msg.type === 'result') {
        console.log('Result:', msg.result || msg);
      }
    }
  } catch (error) {
    console.error('Test 3 Error:', error.message);
  }
  console.log('---\n');
}

// Test 4: With cwd and empty settings
async function test4_withCwd() {
  console.log('Test 4: With cwd and empty settings');
  try {
    const result = query({
      prompt: 'Say "Hello World" and nothing else.',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-latest',
        cwd: process.cwd(),
        settingSources: [],
      }
    });

    for await (const msg of result) {
      console.log('Message type:', msg.type);
      if (msg.type === 'result') {
        console.log('Result:', msg.result || msg);
      }
    }
  } catch (error) {
    console.error('Test 4 Error:', error.message);
  }
  console.log('---\n');
}

// Test 5: Log all message details
async function test5_detailed() {
  console.log('Test 5: Detailed message logging');
  try {
    const result = query({
      prompt: 'Write a JSON object with a single field "test" set to "success".',
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-latest',
        cwd: process.cwd(),
        settingSources: [],
        maxTurns: 1,
      }
    });

    for await (const msg of result) {
      console.log('Full message:', JSON.stringify(msg, null, 2));
    }
  } catch (error) {
    console.error('Test 5 Error:', error.message);
    console.error('Stack:', error.stack);
  }
  console.log('---\n');
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Run tests sequentially
async function runTests() {
  console.log('API Key available:', !!process.env.ANTHROPIC_API_KEY);
  console.log('Starting tests...\n');

  await test1_minimal();
  await test2_withApiKey();
  await test3_withModel();
  await test4_withCwd();
  await test5_detailed();

  console.log('Tests complete.');
}

runTests().catch(console.error);