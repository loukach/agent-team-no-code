# Enhanced Agent Visibility - Implementation Summary

## What We Built

A comprehensive visibility system that exposes the complete inner workings of each AI agent during simulations, focusing on understanding agent behavior and inter-agent dynamics.

## Critical Fixes Applied

### 0. Server Crash Prevention (CRITICAL)
**Problem**: Server crashed immediately after agents started, killing all simulations
**Root Cause**: SDK emits `system` message type at initialization with no handler
**Solution**:
- Added `system` message type handler
- Wrapped all message processing in try/catch blocks
- Graceful error handling with user feedback via socket events

**Code**: `server/agents.js:272-275, 496-507`

This fix was essential for any simulation to complete successfully.

## Key Improvements

### 1. Complete Conversation Flow Capture

**Backend Enhancements** (`server/agents.js`):
- Raw message logging from Claude SDK
- Full conversation history tracking
- Turn-by-turn message capture
- Input/output recording for every exchange

**New Event Types Emitted**:
- `prompt` - Initial prompts sent to agents (system + user message)
- `input` - User messages (deduplicated to prevent SDK loop artifacts)
- `turn_start` - Beginning of each conversation turn
- `thinking` - Agent's reasoning and response formulation
- `tool_use` - When agent requests to use a tool (real-time from stream events)
- `web_search` - Specific search queries with parameters
- `response` - Final agent responses with cost/tokens
- `conversation_summary` - Complete session overview
- `error` - Error events with context

### 2. Enhanced Activity Logger Component

**File**: `client/src/components/ActivityLogger.jsx`

**Features**:
- Expandable/collapsible per-agent sections
- Filter by activity type
- "Show Raw Data" toggle for full prompts/responses
- Export to JSON functionality
- Color-coded activity types with icons
- Turn number tracking
- Millisecond-precision timestamps

**Special Visualizations**:
- **Conversation Summary Cards**: Highlighted overview showing total turns, messages, duration, cost, and warnings (e.g., max turns hit)
- **Turn Markers**: Clear visual separation between conversation turns
- **Tool Usage Details**: Expanded view of tool inputs/outputs
- **Search Results**: Pretty display of web search queries and results

### 3. Three-Mode Viewing System

Users can switch between:
1. **Visual Orchestration** - Animated flow diagram
2. **Message Log** - Chronological text feed
3. **Detailed Activity** - Complete transparency (NEW!)

### 4. Post-Simulation Persistence

**Key Feature**: Activities remain visible after simulation completes

**Implementation**:
- Activities stored in React state throughout lifecycle
- Collapsible "View Agent Activity" section in results
- Contains full activity log with all captured events
- Survives page re-renders (but not refresh)

## What's Now Visible

### Input & Prompts
- ✅ Exact system prompts sent to Claude
- ✅ User instructions and context
- ✅ Per-turn prompt content

### Thinking & Reasoning
- ✅ Agent's response formulation
- ✅ Turn-by-turn thinking progression
- ✅ Text content before final parsing

### Tool Usage
- ✅ Which tools were requested (WebSearch, WebFetch)
- ✅ Exact tool parameters/inputs
- ✅ Complete tool outputs/results
- ✅ Tool IDs for request/response matching

### Web Searches
- ✅ Search queries (exact text)
- ✅ Search results (titles, URLs, snippets)
- ✅ Number of results found

### Output & Results
- ✅ Raw responses from Claude
- ✅ Parsed JSON articles
- ✅ Parse errors and fallback handling

### Performance & Metadata
- ✅ Turn numbers
- ✅ Timestamps (millisecond precision)
- ✅ Cost per agent
- ✅ Token usage (input/output)
- ✅ Duration metrics
- ✅ Max turns warnings

### Error Handling
- ✅ Max turns detection
- ✅ Permission denials
- ✅ Parsing failures
- ✅ Tool failures
- ✅ Server crash prevention (system message handling)
- ✅ Graceful error recovery with try/catch boundaries

## Technical Implementation Details

### Critical SDK Configuration

**Enable Partial Messages** (Required for tool visibility):
```javascript
const result = query({
  prompt: fullPrompt,
  options: {
    includePartialMessages: true, // ✅ CRITICAL for tool visibility
    // ... other options
  }
});
```

**Handle System Messages** (Required to prevent crashes):
```javascript
if (msg.type === 'system') {
  console.log(`System initialized with ${msg.tools?.length || 0} tools`);
  continue;
}
```

**Error Boundaries** (Required for stability):
```javascript
for await (const msg of result) {
  try {
    // ... message processing
  } catch (msgError) {
    console.error('Error:', msgError);
    io.emit('agent:activity', { type: 'error', error: msgError.message });
  }
}
```

**Message Deduplication** (Required for clean logs):
```javascript
let seenUserMessages = new Set();
const messageId = msg.uuid || JSON.stringify(msg.message);
if (!seenUserMessages.has(messageId)) {
  seenUserMessages.add(messageId);
  // emit once
}
```

## Architecture

### Data Flow

```
Claude SDK → Backend Agent Loop → Socket.io Events → Frontend State → UI Components
```

### Event Structure

Each activity event contains:
```javascript
{
  agent: 'progressive',           // Agent identifier
  newspaper: 'The Progressive Tribune',
  type: 'web_search',             // Activity type
  message: 'Human-readable description',
  timestamp: 1699360000000,       // Millisecond precision
  turnNumber: 2,                  // Which conversation turn

  // Type-specific fields:
  prompt: '...',                  // For input/prompt types
  response: '...',                // For thinking/response types
  tool: 'WebSearch',              // For tool_use types
  toolInput: {...},               // Tool parameters
  toolOutput: {...},              // Tool results
  searchQuery: '...',             // Search query text
  searchResults: [...],           // Search result array
  summary: {...}                  // For conversation_summary
}
```

### State Management

**SimulationPage.jsx**:
- `activities` state array stores all events
- Populated via `agent:activity` socket listener
- Cleared on new simulation start
- Persists through simulation completion
- Available in results view

## Usage Guide

### During Simulation

1. Start a simulation with any topic
2. Click "Detailed Activity" button
3. Watch real-time activity stream
4. Toggle "Show Raw Data" for full prompts/responses
5. Use filters to focus on specific activity types

### After Simulation

1. View newspaper results as usual
2. Click "View Agent Activity" collapsible section
3. Review complete conversation history
4. Export log to JSON if needed
5. Use for debugging, analysis, or learning

### Exporting Data

Click "Export Log" button to download:
- Complete JSON file
- All activity events
- Full metadata
- Filename: `agent-log-{timestamp}.json`

## Real-World Examples

### Detecting Max Turns Issue

**Before**: Agent returned garbled JSON, unclear why
**Now**: Conversation summary shows "⚠️ Reached maximum turns limit" with full turn history showing what agent was stuck on

### Understanding Search Strategy

**Before**: Unknown what the agent researched
**Now**: See exact queries like "Dubai chocolate trend 2024" → "pistachio shortage Dubai chocolate" showing research progression

### Tool Permission Denials

**Before**: Silent failures, agent adapts mysteriously
**Now**: See "WebFetch denied for URL X" → "Falling back to WebSearch" showing adaptation strategy

## Technical Details

### Performance Impact

- ~100-500KB data per simulation
- 500-1000 events typical
- Minimal socket overhead
- Efficient React rendering with Framer Motion

### Browser Compatibility

- Modern browsers only (ES6+)
- Uses native details/summary elements
- CSS Grid for layouts
- Tested on Chrome/Edge

### Storage Limitations

- Not persisted to database (by design)
- Lost on page refresh (by design)
- Can be exported before closing
- Keeps memory footprint manageable

## Future Enhancements

### Potential Additions

1. **Streaming to File**: Auto-save to local filesystem
2. **Replay Mode**: Step through simulation playback
3. **Comparison View**: Side-by-side agent analysis
4. **Statistics Dashboard**: Aggregate metrics over time
5. **Search/Filter**: Find specific events quickly
6. **Timeline View**: Chronological visualization
7. **Database Storage**: Optional persistence

### Not Implemented (By Choice)

- ❌ Real-time performance metrics (cost focus)
- ❌ Database storage (memory-only for now)
- ❌ Advanced analytics (out of scope)
- ❌ Custom activity plugins (YAGNI)

## Testing Checklist

To verify the implementation:

1. ✅ Start a simulation
2. ✅ Switch to "Detailed Activity" view
3. ✅ See turn markers and activity events
4. ✅ Toggle "Show Raw Data"
5. ✅ View full prompts and responses
6. ✅ See web search queries and results
7. ✅ Wait for simulation to complete
8. ✅ Check results page has "View Agent Activity" section
9. ✅ Expand it to see full activity log
10. ✅ Export log to JSON
11. ✅ Verify file contains all events

## All Issues Resolved ✅

### Issue Resolution Summary

1. **Server Crash (CRITICAL)**: ✅ Fixed with system message handler
2. **Duplicate Input Messages**: ✅ Fixed with UUID-based deduplication
3. **No Tool Visibility**: ✅ Fixed with `includePartialMessages: true`
4. **Missing Debate Results**: ✅ Fixed with proper message content access
5. **Timing Confusion**: ✅ Clarified (correct behavior, not a bug)

### Current Status

**All Simulations Now**:
- Complete successfully without crashes
- Show real-time tool usage
- Capture complete conversation flow
- Display debate results
- Provide clean, deduplicated activity logs

## Conclusion

This implementation provides complete transparency into agent behavior without overwhelming the user. The progressive disclosure approach (3 view modes + collapsible sections + raw data toggle) ensures users can drill down to exactly the level of detail they need.

**Goal Achieved**: "Understand agent behavior and how agents work together" ✅

Users can now:
- See exact inputs and outputs
- Understand thinking processes
- Track tool usage patterns (real-time)
- Debug failures effectively (with error events)
- Learn from agent strategies
- Export data for analysis
- Run simulations reliably without crashes