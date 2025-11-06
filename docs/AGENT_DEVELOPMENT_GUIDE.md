# Claude Agent SDK - Development Guide

**Library:** `claude-agent-sdk` (Python) and `@anthropic-ai/claude-agent-sdk` (TypeScript/Node.js)
**Version:** Python 0.1.6+, TypeScript/Node.js 1.0.0+
**Purpose:** Complete technical reference for building AI agents using Claude Agent SDK
**Last Updated:** November 2025

> **Important:** This guide covers both the **Claude Agent SDK** Python library (`pip install claude-agent-sdk`)
> and the TypeScript/Node.js library (`npm install @anthropic-ai/claude-agent-sdk`).
> This is NOT about Claude Code or any CLI tools - we use the SDK programmatically.

---

## Table of Contents

1. [Quick Start - Python](#quick-start-python)
2. [Quick Start - TypeScript/Node.js](#quick-start-typescript-nodejs)
3. [Core Concepts](#core-concepts)
4. [System Prompt Guidelines](#system-prompt-guidelines)
5. [Concurrent Agent Execution](#concurrent-agent-execution)
6. [Agent Design Patterns](#agent-design-patterns)
7. [Tool Selection Strategy](#tool-selection-strategy)
8. [Error Handling](#error-handling)
9. [Cost Management](#cost-management)
10. [Platform Considerations](#platform-considerations)
11. [Production Checklist](#production-checklist)
12. [Official Patterns Reference](#official-patterns-reference)

---

## Quick Start - Python

### Installation

```bash
# Install the Claude Agent SDK
pip install claude-agent-sdk

# Set your API key
export ANTHROPIC_API_KEY="your-key-here"
```

### Minimal Example

```python
import asyncio
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are a helpful assistant.",
        max_turns=3,
        max_budget_usd=0.05
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("What is 2+2?")
        async for message in client.receive_response():
            print(message)

asyncio.run(main())
```

---

## Quick Start - TypeScript/Node.js

### Installation

```bash
# Install the Claude Agent SDK for TypeScript/Node.js
npm install @anthropic-ai/claude-agent-sdk

# Set your API key
export ANTHROPIC_API_KEY="your-key-here"
```

### ⚠️ CRITICAL: Model Naming Convention

**The TypeScript/Node.js SDK requires simple model names for web backend deployment:**

```javascript
// ✅ CORRECT - Works in web backends without CLI spawning
const options = {
  model: 'sonnet',  // or 'opus', 'haiku'
  // ...
}

// ❌ WRONG - These cause CLI process spawning (exits with code 1)
const options = {
  model: 'claude-3-5-sonnet-latest',     // DON'T USE
  model: 'claude-3-5-sonnet-20241022',   // DON'T USE
  model: 'claude-3-sonnet',              // DON'T USE
  // ...
}
```

**Why this matters:** Using full model names causes the SDK to spawn a CLI subprocess which immediately exits in web backend environments, resulting in "Claude Code process exited with code 1" errors.

### Minimal Example

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

// Configuration for web backend deployment
const result = query({
  prompt: 'Your question or task here',
  options: {
    model: 'sonnet',           // MUST use simple names!
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTurns: 1,
    cwd: process.cwd(),        // Provide working directory
    settingSources: [],        // Disable filesystem settings
  }
});

// Process streaming responses
for await (const message of result) {
  if (message.type === 'result') {
    console.log('Result:', message.result);
    console.log('Cost:', message.total_cost_usd);
  }
}
```

### Web Backend Integration Pattern

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runAgent(systemPrompt, userPrompt) {
  const result = query({
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    options: {
      model: 'sonnet',              // Simple name only!
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTurns: 1,                  // Single turn for API-like behavior
      cwd: process.cwd(),           // Required for proper initialization
      settingSources: [],           // Avoid filesystem dependencies
    }
  });

  let finalResult = null;
  let totalCost = 0;

  for await (const msg of result) {
    if (msg.type === 'result') {
      finalResult = msg.result || msg.content || msg.text;
      totalCost = msg.total_cost_usd || 0;
    } else if (msg.type === 'assistant' && msg.content) {
      // Handle assistant messages
      for (const block of msg.content) {
        if (block.type === 'text') {
          finalResult = block.text;
        }
      }
    }
  }

  return { result: finalResult, cost: totalCost };
}
```

### Web Backend with WebSearch Tool

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runAgentWithWebSearch(systemPrompt, userPrompt) {
  const result = query({
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    options: {
      model: 'sonnet',                  // Simple name only!
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTurns: 5,                      // Multi-turn for web research + analysis
      cwd: process.cwd(),
      settingSources: [],
      allowedTools: ['WebSearch'],      // CRITICAL: Enable web search
    }
  });

  let finalResult = null;
  let totalCost = 0;

  for await (const msg of result) {
    if (msg.type === 'result') {
      finalResult = msg.result || msg.content || msg.text;
      totalCost = msg.total_cost_usd || 0;
    } else if (msg.type === 'assistant' && msg.content) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          finalResult = block.text;
        }
      }
    }
  }

  return { result: finalResult, cost: totalCost };
}
```

**WebSearch Configuration Notes:**
- Requires `allowedTools: ['WebSearch']` in options
- Requires `maxTurns >= 3` (typically 5) for: search → analyze → respond
- Cost increases ~7x compared to single-turn without tools
- Use when agents need real-time information
- Agents autonomously decide when to search

### Real-Time Progress Tracking Pattern

When using tools like WebSearch, agent operations can take 30-60 seconds. Provide users with real-time feedback by capturing SDK streaming messages:

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runAgentWithProgressTracking(systemPrompt, userPrompt, progressCallback) {
  const result = query({
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    options: {
      model: 'sonnet',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTurns: 5,
      cwd: process.cwd(),
      settingSources: [],
      allowedTools: ['WebSearch']
    }
  });

  let finalResult = null;
  let totalCost = 0;

  for await (const msg of result) {
    // Track tool usage (e.g., WebSearch)
    if (msg.type === 'assistant' && msg.content) {
      for (const block of msg.content) {
        if (block.type === 'tool_use') {
          progressCallback({
            action: 'tool_use',
            tool: block.name,
            input: block.input,
            message: `Using ${block.name}...`
          });
        } else if (block.type === 'text') {
          finalResult = block.text;
          progressCallback({
            action: 'writing',
            message: 'Writing response...',
            preview: block.text.substring(0, 100)
          });
        }
      }
    }

    // Track tool results
    else if (msg.type === 'tool_result') {
      progressCallback({
        action: 'tool_result',
        message: 'Received research results...'
      });
    }

    // Final result
    else if (msg.type === 'result') {
      finalResult = msg.result || msg.content || msg.text;
      totalCost = msg.total_cost_usd || 0;
      progressCallback({
        action: 'finalizing',
        message: 'Finalizing...'
      });
    }
  }

  return { result: finalResult, cost: totalCost };
}

// Usage example
await runAgentWithProgressTracking(
  systemPrompt,
  userPrompt,
  (progress) => {
    console.log(`[${progress.action}] ${progress.message}`);
    if (progress.tool) console.log(`  Tool: ${progress.tool}`);
    if (progress.preview) console.log(`  Preview: ${progress.preview}`);
  }
);
```

**Progress Event Types:**
- `tool_use` - Agent is using a tool (shows tool name and input)
- `tool_result` - Agent received results from tool
- `writing` - Agent is generating response text (shows preview)
- `finalizing` - Agent is completing the response

**Benefits:**
- Users see real-time updates during long operations
- Transparency into agent decision-making
- Better debugging and monitoring
- Improved user confidence (not appearing "stuck")

### Parallel Agent Execution

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runMultipleAgents(topic) {
  const agents = [
    { name: 'Analyst', prompt: 'Analyze this topic analytically' },
    { name: 'Creative', prompt: 'Approach this topic creatively' },
    { name: 'Critic', prompt: 'Critique this topic objectively' }
  ];

  // Run all agents in parallel
  const results = await Promise.all(
    agents.map(agent => runSingleAgent(agent.name, agent.prompt, topic))
  );

  return results;
}

async function runSingleAgent(name, systemPrompt, topic) {
  const result = query({
    prompt: `${systemPrompt}: ${topic}`,
    options: {
      model: 'sonnet',  // Always use simple model names!
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTurns: 1,
      cwd: process.cwd(),
      settingSources: []
    }
  });

  let output = null;
  for await (const msg of result) {
    if (msg.type === 'result') {
      output = msg.result;
    }
  }

  return { name, output };
}
```

---

## Core Concepts

### What is Claude Agent SDK?

The **Claude Agent SDK** is a Python/TypeScript library that enables you to:
- Build autonomous AI agents programmatically
- Give Claude access to tools (file operations, web search, bash commands)
- Create multi-agent systems
- Control costs and execution flow

### Key Components

```python
from claude_agent_sdk import (
    ClaudeSDKClient,      # Main client for agent interaction
    ClaudeAgentOptions,   # Configuration object
    AssistantMessage,     # Message types
    UserMessage,
    ResultMessage,
    TextBlock,           # Content blocks
    ToolUseBlock,
    # Exceptions
    CLIConnectionError,
    ProcessError
)
```

### How It Works

1. **You provide:** System prompt, tools, and query
2. **Claude decides:** Which tools to use and how
3. **SDK manages:** Tool execution, context, and responses

---

## System Prompt Guidelines

### Critical Discovery: Format Matters More Than Length

**✅ WORKS - Single-line prompts (up to 300+ chars):**
```python
system_prompt = "You are an analytical agent specialized in breaking down complex problems systematically. You use logic, data, and structured analysis to provide comprehensive solutions."
```

**❌ FAILS - Multi-line prompts with newlines:**
```python
# This will cause timeout in concurrent execution on Windows
system_prompt = """You are an analytical agent.

Your approach:
- Break down problems
- Use logic and data"""
```

### Platform-Specific Issue

On **Windows**, subprocess communication breaks when system prompts contain:
- Newline characters (`\n`)
- Special formatting (bullets •, emojis 🔍)
- Multi-paragraph structure

### Workarounds for Complex Instructions

**Option 1: Use semicolons for structure**
```python
system_prompt = "You are an agent with three goals: (1) Analyze problems systematically; (2) Use data-driven approaches; (3) Provide clear recommendations."
```

**Option 2: Detailed instructions in first query**
```python
# Short system prompt
options = ClaudeAgentOptions(
    system_prompt="You are a research specialist."
)

# Detailed instructions in query
await client.query("""You are a research specialist. Follow these steps:
1. Gather relevant information
2. Analyze patterns
3. Draw conclusions

Task: [actual task here]""")
```

---

## Concurrent Agent Execution

### Requirements for Running Multiple Agents

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
import asyncio

# REQUIRED configuration for concurrent agents
options = ClaudeAgentOptions(
    system_prompt="Single-line prompt here",      # No newlines!
    permission_mode='bypassPermissions',          # CRITICAL for concurrency
    max_turns=3,
    max_budget_usd=0.05
)
```

### Concurrent Execution Pattern

```python
async def run_multiple_agents():
    """Run 4 agents concurrently."""

    async def run_agent(agent_id: int, role: str):
        options = ClaudeAgentOptions(
            system_prompt=f"You are agent {agent_id} specialized in {role}.",
            permission_mode='bypassPermissions',  # Required!
            allowed_tools=["Read", "Write"],
            max_turns=3,
            max_budget_usd=0.05
        )

        async with ClaudeSDKClient(options=options) as client:
            await client.query("Solve this problem...")
            results = []
            async for msg in client.receive_response():
                results.append(msg)
            return results

    # Run all agents in parallel
    results = await asyncio.gather(
        run_agent(1, "analysis"),
        run_agent(2, "creativity"),
        run_agent(3, "implementation"),
        run_agent(4, "validation")
    )

    return results
```

### Concurrency Limits

- **Tested:** 4-5 concurrent agents work reliably
- **Windows:** Requires single-line prompts
- **Cost:** Scales linearly (4 agents × $0.05 = $0.20 max)

---

## Agent Design Patterns

### Pattern 1: Competitive (Parallel)

Multiple agents solve the same problem independently:

```python
async def competitive_agents(problem: str):
    agents = [
        ("Analytical", ["Read", "Grep"]),
        ("Creative", ["Write"]),
        ("Practical", ["Bash", "Read"])
    ]

    tasks = []
    for name, tools in agents:
        options = ClaudeAgentOptions(
            system_prompt=f"You are the {name} agent.",
            allowed_tools=tools,
            permission_mode='bypassPermissions'
        )
        tasks.append(run_agent_with_options(options, problem))

    return await asyncio.gather(*tasks)
```

### Pattern 2: Pipeline (Sequential)

Each agent builds on the previous:

```python
async def pipeline_agents(initial_input: str):
    # Agent 1: Research
    research_result = await run_agent("Research", ["WebSearch"], initial_input)

    # Agent 2: Analysis (uses research)
    analysis_result = await run_agent("Analysis", ["Write"], research_result)

    # Agent 3: Implementation (uses analysis)
    final_result = await run_agent("Implementation", ["Bash"], analysis_result)

    return final_result
```

### Pattern 3: Synthesis (Parallel + Sequential)

Multiple agents work, then moderator synthesizes:

```python
async def synthesis_pattern(problem: str):
    # Phase 1: Parallel execution
    agent_results = await competitive_agents(problem)

    # Phase 2: Synthesis
    moderator_options = ClaudeAgentOptions(
        system_prompt="You synthesize multiple perspectives into one solution.",
        allowed_tools=[],  # No tools needed
        permission_mode='bypassPermissions'
    )

    synthesis_prompt = f"Problem: {problem}\n\nSolutions:\n"
    for name, solution in agent_results:
        synthesis_prompt += f"{name}: {solution}\n"

    async with ClaudeSDKClient(options=moderator_options) as client:
        await client.query(synthesis_prompt)
        # ... collect response
```

---

## Tool Selection Strategy

### Available Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| `Read` | Read files | Accessing existing code/data |
| `Write` | Create files | Generating solutions |
| `Edit` | Modify files | Updating existing content |
| `Bash` | Run commands | Testing, execution |
| `Grep` | Search text | Finding patterns |
| `Glob` | Find files | Locating resources |
| `WebSearch` | Search online | Current information |
| `WebFetch` | Get web pages | Retrieving documentation |

### Tool Selection by Agent Role

```python
# Research Agent - Information gathering
research_tools = ["Read", "Grep", "WebSearch", "WebFetch"]

# Creative Agent - Content generation
creative_tools = ["Write"]

# Implementation Agent - Building solutions
implementation_tools = ["Write", "Edit", "Bash"]

# Testing Agent - Validation
testing_tools = ["Read", "Bash"]

# Synthesis Agent - Pure reasoning
synthesis_tools = []  # No tools, focuses on analysis
```

---

## Error Handling

### Robust Multi-Agent Error Handling

```python
from claude_agent_sdk import CLIConnectionError, ProcessError

async def run_agent_safe(name: str, options: ClaudeAgentOptions, query: str):
    """Run agent with comprehensive error handling."""
    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(query)
            results = []
            async for msg in client.receive_response():
                results.append(msg)
            return {"name": name, "results": results, "error": None}

    except CLIConnectionError as e:
        return {"name": name, "results": None, "error": f"Connection: {e}"}
    except ProcessError as e:
        return {"name": name, "results": None, "error": f"Process error: {e.exit_code}"}
    except Exception as e:
        return {"name": name, "results": None, "error": f"Unexpected: {e}"}

# Use in multi-agent system
results = await asyncio.gather(
    run_agent_safe("Agent1", options1, query1),
    run_agent_safe("Agent2", options2, query2),
    run_agent_safe("Agent3", options3, query3)
)

# Process results, handling failures gracefully
successful = [r for r in results if r["error"] is None]
failed = [r for r in results if r["error"] is not None]
```

### TypeScript/Node.js - Graceful Refusal Handling

Agents may refuse to complete tasks or return non-JSON responses. Handle these gracefully:

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runAgentWithRefusalHandling(systemPrompt, userPrompt) {
  const result = query({
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    options: {
      model: 'sonnet',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTurns: 5,
      cwd: process.cwd(),
      settingSources: [],
      allowedTools: ['WebSearch']
    }
  });

  let finalResult = null;
  let totalCost = 0;

  for await (const msg of result) {
    if (msg.type === 'result') {
      finalResult = msg.result || msg.content || msg.text || JSON.stringify(msg);
      totalCost = msg.total_cost_usd || 0;
    } else if (msg.type === 'assistant' && msg.content) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          finalResult = block.text;
        }
      }
    }
  }

  // Try to parse JSON, handle refusals gracefully
  let response;
  try {
    const jsonMatch = finalResult.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      response = JSON.parse(jsonMatch[0]);
    } else {
      // No JSON found - treat as refusal or explanation
      response = {
        refused: true,
        explanation: finalResult.trim()
      };
    }
  } catch (parseError) {
    // JSON parsing failed - show raw response
    response = {
      refused: true,
      explanation: finalResult.trim()
    };
  }

  return { response, cost: totalCost };
}
```

**Partial Failure Pattern:**
```javascript
// Run multiple agents, allowing individual failures
const [result1, result2, result3] = await Promise.all([
  runAgent('agent1', prompt).catch(err => ({
    error: true,
    message: err.message
  })),
  runAgent('agent2', prompt).catch(err => ({
    error: true,
    message: err.message
  })),
  runAgent('agent3', prompt).catch(err => ({
    error: true,
    message: err.message
  }))
]);

// Process results - some may have succeeded, some failed
const successful = [result1, result2, result3].filter(r => !r.error);
const failed = [result1, result2, result3].filter(r => r.error);
```

---

## Cost Management

### Configuration

```python
ClaudeAgentOptions(
    max_turns=3,              # Limit conversation depth
    max_budget_usd=0.05,      # Cap spending per agent
)
```

### Cost Calculation

```
Total Cost = (num_agents × max_budget_per_agent) + overhead

Example:
4 agents × $0.05 = $0.20 maximum
Typical actual: ~$0.10-0.15
```

### Cost Tracking

```python
from claude_agent_sdk import ResultMessage

async with ClaudeSDKClient(options=options) as client:
    await client.query("Task")
    total_cost = 0.0

    async for msg in client.receive_response():
        if isinstance(msg, ResultMessage) and msg.total_cost_usd:
            total_cost = msg.total_cost_usd

    print(f"Agent cost: ${total_cost:.4f}")
```

---

## Platform Considerations

### Windows-Specific

**Required Setup:**
```python
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
```

**Known Issues:**
- Multi-line system prompts cause timeouts
- Special characters may break initialization
- Use Windows Terminal for ANSI colors

### macOS/Linux

- Generally more robust subprocess handling
- May support multi-line prompts (untested)
- Native UTF-8 support

**Recommendation:** Use single-line prompts for cross-platform compatibility

---

## Production Checklist

### Pre-Deployment

- [ ] System prompts are single-line (no `\n`)
- [ ] `permission_mode='bypassPermissions'` for concurrent agents
- [ ] `max_turns` configured
- [ ] `max_budget_usd` set
- [ ] Error handling implemented
- [ ] UTF-8 encoding configured (Windows)
- [ ] Tested on target platform

### Code Template

```python
"""Production-ready agent configuration."""

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
import sys
import asyncio

# Platform setup
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class ProductionAgent:
    def __init__(self, name: str, role: str, tools: list):
        self.name = name

        # Single-line prompt (required for Windows concurrency)
        self.options = ClaudeAgentOptions(
            system_prompt=f"You are {name} specializing in {role}.",
            allowed_tools=tools,
            max_turns=3,
            max_budget_usd=0.05,
            permission_mode='bypassPermissions'
        )

    async def execute(self, task: str):
        """Execute with error handling."""
        try:
            async with ClaudeSDKClient(options=self.options) as client:
                await client.query(task)
                results = []
                async for msg in client.receive_response():
                    results.append(msg)
                return (self.name, results, None)
        except Exception as e:
            return (self.name, None, str(e))
```

---

## Official Patterns Reference

### Basic Usage Patterns

```python
# Pattern 1: Simple Query
from claude_agent_sdk import query

async for message in query(prompt="Your question here"):
    # Process response
    pass

# Pattern 2: Configured Client
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="Your role",
    allowed_tools=["Read", "Write"],
    max_turns=5
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("Your task")
    async for message in client.receive_response():
        # Process response
        pass
```

### Message Handling

```python
from claude_agent_sdk import (
    AssistantMessage,
    UserMessage,
    ResultMessage,
    TextBlock,
    ToolUseBlock
)

async for msg in client.receive_response():
    if isinstance(msg, AssistantMessage):
        for block in msg.content:
            if isinstance(block, TextBlock):
                print(f"Text: {block.text}")
            elif isinstance(block, ToolUseBlock):
                print(f"Tool used: {block.name}")

    elif isinstance(msg, ResultMessage):
        if msg.total_cost_usd:
            print(f"Cost: ${msg.total_cost_usd:.4f}")
```

### Advanced Configuration

```python
ClaudeAgentOptions(
    # Core settings
    system_prompt="Single-line prompt",

    # Tool access
    allowed_tools=["Read", "Write", "Bash"],

    # Execution limits
    max_turns=5,
    max_budget_usd=0.10,

    # Concurrency (required for multiple agents)
    permission_mode='bypassPermissions',

    # Optional settings
    setting_sources=["project"],  # Load project settings
)
```

---

## Quick Reference

### Essential Configuration
```python
ClaudeAgentOptions(
    system_prompt="Single line, no \\n",       # Critical for Windows
    permission_mode='bypassPermissions',       # Required for concurrent
    max_turns=3,                              # Limit depth
    max_budget_usd=0.05,                      # Cap costs
    allowed_tools=["Read", "Write"]           # Tool access
)
```

### Import Pattern
```python
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    CLIConnectionError,
    ProcessError
)
```

### Async Pattern
```python
import asyncio

async def main():
    # Agent code here
    pass

asyncio.run(main())  # Or use anyio.run(main)
```

---

## Summary

**Three Critical Rules:**

1. **System prompts must be single-line** (no `\n` on Windows)
2. **Concurrent agents require `permission_mode='bypassPermissions'`**
3. **Always implement error handling**

**Remember:** We use `claude-agent-sdk` Python library exclusively. This is programmatic agent building, not CLI interaction.

---

**See Also:**
- `docs/06_competitive_agents_experiment.md` - Multi-agent example
- Official GitHub: [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)