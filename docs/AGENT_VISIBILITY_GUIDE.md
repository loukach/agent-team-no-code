# Agent Visibility System Guide

## Overview

The AI Newsroom Simulator now includes comprehensive visibility into what each agent is doing during the simulation. This guide explains the new features and how to use them.

## Features Added

### 1. **Detailed Activity Logger Component**
Located at: `client/src/components/ActivityLogger.jsx`

This new component provides:
- Real-time display of all agent activities
- Collapsible sections for each agent (Progressive, Conservative, Tech)
- Filter options (All, Prompts, Responses, Tool Usage, Web Searches, Thinking, Errors)
- Raw data viewing toggle
- Export functionality for activity logs (JSON format)
- Color-coded activity types with icons
- Timestamp precision to milliseconds

### 2. **Enhanced Backend Event Emissions**
Located at: `server/agents.js`

The backend now emits detailed `agent:activity` events with:
- **Prompts**: Full system prompts and user prompts sent to Claude
- **Responses**: Complete responses from Claude including JSON parsing
- **Tool Usage**: Detailed information about WebSearch tool calls
- **Search Queries**: Exact search terms used
- **Search Results**: Parsed results from web searches
- **Token Usage**: Input and output token counts
- **Costs**: Real-time cost tracking per agent
- **Timing**: Duration of each operation
- **Turn Counts**: Number of conversation turns with Claude
- **Error Details**: Full error messages and stack traces

### 3. **Three View Modes in Simulation Page**

#### Visual Orchestration Mode
- Original animated visualization
- Shows agent connections and flow
- Real-time status updates

#### Message Log Mode
- Chronological list of agent messages
- Shows debates and interactions
- Simplified text-based view

#### Detailed Activity Mode (NEW)
- Full ActivityLogger component
- Complete visibility into agent internals
- Export and filtering capabilities

## How to Use

### Running a Simulation with Full Visibility

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to the Simulation page** and enter a topic

3. **During simulation, toggle between view modes**:
   - Click "Visual Orchestration" for the animated view
   - Click "Message Log" for chronological messages
   - Click "Detailed Activity" for complete agent transparency

4. **In Detailed Activity mode, you can**:
   - Toggle "Show Raw Data" to see full prompts and responses
   - Use the filter dropdown to focus on specific activity types
   - Click agent names to collapse/expand their sections
   - Click "Export Log" to download a JSON file of all activities

## Activity Types Explained

### Prompt (📝 Blue)
- Shows the exact prompt sent to Claude
- Includes system prompts and user instructions
- Visible when "Show Raw Data" is enabled

### Response (💬 Green)
- Complete response from Claude
- Includes parsed JSON for articles
- Shows token usage and costs

### Tool Use (🔧 Purple)
- WebSearch tool invocations
- Shows tool name and input parameters

### Web Search (🔍 Indigo)
- Specific search queries
- Lists search results with titles and URLs

### Thinking (🤔 Yellow)
- Agent's intermediate reasoning
- Turn-by-turn conversation flow

### Writing (✍️ Gray)
- Article composition progress
- Preview of content being generated

### Error (❌ Red)
- Error messages and stack traces
- Failed operations and retries

### Complete (✅ Emerald)
- Final results and summaries
- Cost totals and timing

## Data Structure

Each activity event contains:
```javascript
{
  agent: 'progressive',           // Agent identifier
  newspaper: 'The Progressive Tribune',
  type: 'web_search',             // Activity type
  message: 'Searching for: "topic"',
  timestamp: 1699360000000,       // Unix timestamp

  // Optional fields depending on type:
  prompt: '...',                  // Full prompt text
  response: '...',                // Full response text
  tool: 'WebSearch',              // Tool name
  toolInput: {...},               // Tool parameters
  toolOutput: {...},              // Tool results
  searchQuery: '...',             // Search query
  searchResults: [...],           // Search results array
  cost: 0.0015,                   // Cost in USD
  tokenUsage: {                   // Token counts
    input: 1000,
    output: 500
  },
  duration: 2500                  // Duration in ms
}
```

## Export Format

The exported JSON file contains:
- Complete array of all activities
- Preserves chronological order
- Includes all metadata
- Can be analyzed offline or in other tools

## Performance Considerations

- Activities are stored in React state during simulation
- Large simulations may generate hundreds of events
- Export functionality allows clearing state after download
- Filter options help focus on relevant information

## Future Enhancements

Potential additions to consider:
1. Real-time activity streaming to file
2. Activity replay functionality
3. Comparison view between agents
4. Statistical analysis dashboard
5. Custom activity type plugins

## Troubleshooting

If activities aren't showing:
1. Check browser console for errors
2. Ensure WebSocket connection is active
3. Verify backend is emitting events
4. Check that API key has sufficient permissions

## Technical Implementation

### Frontend
- React hooks for state management
- Socket.io for real-time updates
- Framer Motion for animations
- Tailwind CSS for styling

### Backend
- Enhanced Claude Agent SDK integration
- Socket.io event emission
- Detailed message parsing
- Cost and token tracking

This visibility system provides complete transparency into the AI agents' decision-making process, making it easier to understand, debug, and improve the simulation system.