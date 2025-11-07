# Claude SDK Message Analysis

## What We Expected vs What We Got

### Expected (from raw Anthropic API)
The raw Anthropic API emits detailed streaming messages:
- `message_start` - Conversation begins
- `content_block_start` - Text or tool use begins
- `content_block_delta` - Incremental text
- `tool_use` - Tool request with parameters
- `tool_result` - Tool output
- `message_delta` - Message updates
- `message_stop` - Message complete

### What `@anthropic-ai/claude-agent-sdk` Actually Emits
Based on actual implementation and testing:

**CRITICAL**: The SDK emits a `system` message type at initialization that MUST be handled to prevent server crashes.

1. **`system` type** (NEW - CRITICAL DISCOVERY)
   - Emitted ONCE at start of query
   - Contains: Tool initialization info (`msg.tools` array)
   - Purpose: SDK initialization notification
   - **MUST be handled** - unhandled will crash server
   - Fix: Add handler that logs and continues

2. **`user` type** (lines 26-97 in test log)
   - Emitted MULTIPLE times (9x per agent!)
   - Contains: No useful data in our case
   - Turn number always 0
   - Problem: SDK re-emits user messages during tool loops
   - Fix: Deduplicate using UUID or message hash

3. **`stream_event` type** (NEW - with includePartialMessages: true)
   - Emitted during message generation
   - Contains: `event` object with streaming data
   - Types: `content_block_start`, `content_block_delta`, `message_start`
   - Critical for tool visibility
   - Fix: Enable `includePartialMessages: true`

4. **`assistant` type** (with includePartialMessages: true)
   - Emitted for complete assistant messages
   - Contains: `msg.message.content[]` array with blocks
   - Blocks can be `type: 'text'` or `type: 'tool_use'`
   - **Key**: Access via `msg.message.content` NOT `msg.content`
   - Fix: Iterate through content blocks to find tool usage

5. **`result` type** (lines 100-113, 134-147, 167-181 in test log)
   - Emitted ONCE at the end
   - Contains: Final response text, cost, token usage, errors
   - Has `response` field with complete answer
   - Summary of entire conversation

### Tool Usage Now Visible ✅

**With `includePartialMessages: true`**:
- ✅ Tool use events via `stream_event` and `assistant` messages
- ✅ Tool names, IDs, and input parameters
- ✅ Search queries visible
- ✅ Real-time tool initiation
- ✅ Turn-by-turn tracking

**Note**: Tool results are still abstracted - only metadata visible, not full search result content. The SDK processes results internally and incorporates them into final responses.

## Root Causes of Issues (ALL RESOLVED ✅)

### Issue 0: Server Crash During Simulation (CRITICAL)
**Why**: SDK emits `system` message type at initialization, no handler existed
**Impact**: Server crashed immediately, killing all simulations
**Fix**: Added `system` message handler with try/catch error boundaries

### Issue 1: Multiple "input 0" lines
**Why**: SDK emits `user` messages every time it loops (for tool use)
**Fix**: Track seen message IDs using Set, deduplicate based on UUID

### Issue 2: No tool usage visible
**Why**: Missing `includePartialMessages: true` configuration option
**Fix**: Enable `includePartialMessages: true` and handle `stream_event` messages
**Alternative Explored**: Parsing response text (no longer needed)

### Issue 3: Debate prompt after conversation summary
**Why**: Debate is Phase 2, separate `query()` call - this is CORRECT behavior
**Fix**: None needed - understanding was the issue, not implementation

### Issue 4: Debate results missing
**Why**: Debate phase wasn't emitting activities with correct content access
**Fix**: Enable `includePartialMessages: true` and use `msg.message?.content` access pattern

## SDK Architecture Understanding

```
query() function
  ↓
Internal loop {
  1. Send user message
  2. Get assistant response
  3. If tool needed:
     a. Execute tool internally
     b. Send tool result back
     c. Get next assistant response
  4. Repeat until done
}
  ↓
Return single 'result' message
```

**We only see**:
- Multiple `user` messages (one per loop iteration)
- Single `result` message (final output)

**We don't see**:
- Individual assistant messages
- Tool use requests
- Tool results
- Intermediate thinking

## Implications for Visibility

### What We CAN Show
- Initial prompt sent
- Final response received
- Total cost and tokens
- Whether max turns was hit
- Final parsed result

### What We CANNOT Show (with current SDK)
- Turn-by-turn conversation
- Tool requests in real-time
- Search queries as they happen
- Tool results as they arrive
- Intermediate thinking

## Possible Solutions

### Option 1: Accept SDK Limitations
- Show only prompt + final response
- Add text parsing to infer tool usage
- Focus on debate phase visibility

### Option 2: Use Raw Anthropic API
- Bypass `query()` function
- Use `@anthropic-ai/sdk` directly
- Implement tool handling ourselves
- Get full message streaming

### Option 3: Hybrid Approach
- Keep SDK for simplicity
- Add verbose logging to SDK internals
- Parse response text for research clues
- Focus visibility on debate dynamics

### Option 4: Patch the SDK
- Fork `claude-agent-sdk`
- Add event emitters for tool usage
- Submit PR back to Anthropic
- Most work, best result

## Resolution Status: ✅ ALL ISSUES RESOLVED

**What We Achieved**:
1. ✅ Fixed duplicate `user` messages via UUID deduplication
2. ✅ Properly capture debate responses with `includePartialMessages: true`
3. ✅ Full tool visibility via stream events and content blocks
4. ✅ Server stability with system message handler and error boundaries
5. ✅ Complete conversation flow capture for all phases

**No Further Changes Needed**: The SDK provides all necessary visibility when configured correctly with `includePartialMessages: true` and proper message type handling.

## Key Learnings

1. **Always handle ALL message types**: SDK can emit unexpected types like `system`
2. **Enable partial messages**: `includePartialMessages: true` is critical for tool visibility
3. **Access patterns matter**: Use `msg.message.content` not `msg.content` for assistant messages
4. **Deduplicate intelligently**: SDK re-emits messages during loops, use UUID tracking
5. **Error boundaries essential**: Wrap all async message processing in try/catch