# Agent Visibility Requirements Analysis

## Current Problems Identified

### 1. Error Objects Stored as Stories
Some simulations show error/result objects being stored as story content instead of proper articles:
- This masks failures
- Loses valuable debugging info
- Poor user experience

### 2. Missing Conversation Flow
We don't capture:
- Individual message exchanges with Claude
- Turn-by-turn progression
- What Claude "thought" before responding
- Tool use requests and results in detail

### 3. Limited Error Context
When things fail, we don't know:
- Which tools were requested
- Which tools were denied/blocked
- Why max turns was hit
- What was the agent trying to do

### 4. No Performance Metrics
Missing:
- Per-turn timing
- API latency vs local processing
- Cache hit rates
- Token efficiency metrics

## Proposed Information to Expose

### Level 1: User-Facing (Always Visible)
High-level progress that's useful for end users:

- [ ] **Phase indicators** (Research, Debate, Complete)
- [ ] **Agent status** (Thinking, Searching, Writing)
- [ ] **Progress percentage** (estimated)
- [ ] **Web searches performed** (query text + result count)
- [ ] **Cost accumulation** (real-time)
- [ ] **Errors and warnings** (user-friendly)

### Level 2: Developer/Debug Mode (Toggle)
Technical details for debugging and understanding:

#### Per-Turn Information
- [ ] **Turn number** (1-5)
- [ ] **Prompt sent** (full text)
- [ ] **Response received** (full text before parsing)
- [ ] **Token counts** (input/output per turn)
- [ ] **Cost per turn**
- [ ] **Duration** (API time + processing time)
- [ ] **Cache statistics** (creation, hits, misses)

#### Tool Usage
- [ ] **Tool name** (WebSearch, WebFetch, etc)
- [ ] **Tool input** (full parameters)
- [ ] **Tool output** (full results)
- [ ] **Tool success/failure**
- [ ] **Permission denials** (which tools were blocked)

#### Search Details
- [ ] **Search query** (exact text)
- [ ] **Number of results**
- [ ] **Result titles and URLs**
- [ ] **Snippets/descriptions**
- [ ] **Search latency**

#### Model Behavior
- [ ] **Model used** (Sonnet, Haiku for different turns)
- [ ] **Max turns hit** (yes/no)
- [ ] **Stop reason** (end_turn, max_tokens, etc)
- [ ] **Refusals** (content policy blocks)

#### Response Parsing
- [ ] **Raw response** (before JSON parsing)
- [ ] **Parsed result** (after JSON parsing)
- [ ] **Parse errors** (if JSON invalid)
- [ ] **Fallback handling** (how errors were handled)

### Level 3: Advanced Analytics (Export/Logs)
Data for post-simulation analysis:

- [ ] **Complete message stream** (all SDK messages)
- [ ] **Cache usage patterns**
- [ ] **Cost breakdown** (per model, per turn, per tool)
- [ ] **Performance metrics** (P50, P95, P99 latencies)
- [ ] **Error frequencies**
- [ ] **Token efficiency** (output tokens per input token)

## Specific Issues from Recent Simulations

### Issue 1: Max Turns Error (IndieCampers - Conservative)
**What happened:**
- Agent hit 5-turn limit
- Returned error object instead of article
- Error stored as story in database
- User saw garbled JSON on frontend

**What we should have captured:**
- Which turn failed
- What was the agent trying to do on turn 5
- Why didn't it complete earlier
- What tools were used in each turn
- Full conversation history

### Issue 2: Permission Denials (Dubai Chocolate - Progressive)
**What happened:**
- WebFetch tool was denied 3 times
- Agent tried to fetch from specific URLs
- Had to fall back to WebSearch
- This context was lost

**What we should have captured:**
- Which URLs were requested
- Why they were denied
- How the agent adapted
- What alternative approach worked

### Issue 3: Cache Usage Patterns
**What we see:**
- cache_creation_input_tokens: 3268
- cache_read_input_tokens: 25284
- This suggests heavy caching, but we don't know:
  - What's being cached
  - Why cache hits are so high
  - If this is optimal

## UI/UX Considerations

### Real-Time Display
Should we show this information:
- **During simulation** (live updates)?
- **After simulation** (post-mortem)?
- **On demand** (expandable sections)?

### Information Density
- Too much info = overwhelming
- Too little = not helpful
- Need progressive disclosure

### Export Formats
- JSON (structured data)
- Markdown (human-readable)
- CSV (analytics)
- Timeline view (chronological)

## Technical Implementation Questions

### Storage
1. **Should we store activity logs in database?**
   - Pros: Persistent, can review old simulations
   - Cons: Database size, query complexity

2. **Should we stream to files?**
   - Pros: Don't lose data if browser closes
   - Cons: File management, disk space

3. **Should we keep in memory only?**
   - Pros: Fast, simple
   - Cons: Lost on refresh/navigation

### Performance Impact
1. **How much data are we talking about?**
   - Estimated: 500-1000 events per simulation
   - Size: ~100-500KB per simulation

2. **Will this slow down the simulation?**
   - Socket emission overhead
   - Frontend rendering cost
   - State update frequency

### Privacy/Security
1. **Should prompts be logged?**
   - They contain instructions/strategy
   - Might reveal "trade secrets"

2. **Should responses be logged?**
   - Full text might be large
   - Could contain sensitive topics

## Recommendations for Discussion

Let's decide on:
1. **Priority levels** - What do we implement first?
2. **Display strategy** - How do we show this without overwhelming?
3. **Storage strategy** - Where/how do we persist this data?
4. **Performance budget** - What's acceptable overhead?
5. **User personas** - Who needs what level of detail?

## Example Use Cases

### Use Case 1: Debug Max Turns Error
**User wants:** Why did the agent hit max turns?
**Needs to see:**
- Full conversation history
- What the agent was stuck on
- Which tools it tried
- Error messages per turn

### Use Case 2: Optimize Costs
**User wants:** Reduce cost per simulation
**Needs to see:**
- Cost breakdown by turn
- Which models were used where
- Token usage patterns
- Cache efficiency

### Use Case 3: Improve Search Quality
**User wants:** Better research quality
**Needs to see:**
- What queries were made
- What results were found
- Which results were used
- What was ignored

### Use Case 4: Content Quality Analysis
**User wants:** Understand why one agent wrote better
**Needs to see:**
- Reasoning/thinking process
- Sources consulted
- Number of iterations
- Alternative drafts considered

## Next Steps

1. **Review this document together**
2. **Prioritize requirements**
3. **Decide on implementation approach**
4. **Build iteratively**