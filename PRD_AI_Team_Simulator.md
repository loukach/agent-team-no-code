# Product Requirements Document: AI Team Simulator

## Product Vision
A delightful web-based playground where AI enthusiasts can create, watch, and learn from teams of AI agents working together on creative challenges.

## Problem Statement
AI enthusiasts want to understand and experiment with AI agents but:
- Current tools are too technical or enterprise-focused
- Single-chat interfaces hide the potential of multi-agent collaboration
- There's no fun, visual way to see how AI agents could work as teams
- Learning about AI agents feels like work instead of play

## Target Customer
**Primary:** AI enthusiasts (non-technical) who are curious about AI capabilities and want to experiment without coding
**Secondary:** Tech professionals looking for a fun way to explore multi-agent patterns

## Opportunity
Create the first entertainment-focused AI agent simulator that makes learning about multi-agent systems as engaging as playing a game.

## Success Metrics
1. **User Delight** (Primary)
   - Session duration > 10 minutes
   - Users share creations on social media
   - Users return for multiple sessions

2. **Learning Outcomes** (Secondary)
   - Users can articulate when multi-agent helps vs. single agent
   - Users discover unexpected agent behaviors
   - Users feel more confident about AI capabilities

## Solution Overview

### Core Experience: "The AI Newsroom"
Users become the publisher of AI-powered newspapers:
1. Select a news event
2. Deploy 3 competing newsroom teams (different editorial styles)
3. Watch agents collaborate in real-time (editor, reporters, designers)
4. See three different newspapers emerge
5. Share the results

### Key Features

**MVP (Weeks 1-4)**
- Pre-configured newsroom with 3 newspaper styles
- Real-time visualization of agent conversations
- Animated newspaper generation
- One-click sharing to social media

**V2 (Weeks 5-8)**
- Additional scenarios (Startup Builder, Future Lab)
- Agent personality customization
- Cost transparency dashboard
- Session replay and highlights

**Future**
- Custom scenario creator
- Agent marketplace
- Multiplayer competitions
- API for developers

## User Journey

1. **Discover** - Lands on site, sees demo video of agents creating newspapers
2. **Start** - Clicks "Run Your Newsroom" (no signup required)
3. **Configure** - Chooses news event and newspaper styles (30 seconds)
4. **Watch** - Sees agents discussing, debating, creating (3-5 minutes)
5. **Delight** - Views final newspapers side-by-side
6. **Share** - Downloads video or shares link with results
7. **Learn** - Sees cost breakdown and agent effectiveness metrics
8. **Return** - Comes back to try different scenarios

## Design Principles

1. **Show, Don't Hide** - Make agent thinking visible and entertaining
2. **Fast to First Delight** - Under 60 seconds to see agents working
3. **Learn Through Play** - Education embedded in entertainment
4. **Share-Worthy Moments** - Every session creates something worth showing others
5. **Transparent Costs** - Always show API costs to build understanding

## Technical Approach

- **Frontend:** React 19 + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express.js + Socket.io for real-time updates
- **Database:** SQLite (sql.js) for persistent storage
- **AI:** Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **Hosting:** Render.com with shared API key

## Constraints & Assumptions

**Constraints:**
- API costs must be transparent to users
- Must work without user accounts initially
- Total session cost should be < $0.50
- Must load in < 3 seconds

**Assumptions:**
- Users will wait 3-5 minutes to see results
- Visual representation of agents adds to engagement
- People want to see AI disagreement/debate
- Sharing results is important for viral growth

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API costs too high | Show costs upfront, limit session length |
| Agents produce inappropriate content | Pre-configured scenarios, content filters |
| Too slow/boring to watch | Speed controls, highlight reel mode |
| Single agent works just as well | Make this a learning moment, not a failure |

---

## Pre-FAQs

### Why would someone use this instead of Claude directly?

**Short answer:** Claude is a tool for getting answers. AI Newsroom Simulator is entertainment that happens to be educational.

**Long answer:** When you use Claude directly, you're having a conversation. With AI Newsroom Simulator, you're watching a show where AI agents are the characters. You see different perspectives clash, watch collaborative creation happen, and get multiple outputs from the same input. It's the difference between reading about perspectives and watching them debate in real-time.

### What if multi-agent systems don't actually work better?

**This is a feature, not a bug.** The product helps users discover when multi-agent systems add value and when they don't. If users learn that single agents work better for most tasks, that's valuable knowledge delivered through entertainment.

### How is this different from AutoGPT/AgentGPT?

Those tools focus on task completion and automation. AI Team Simulator focuses on the **spectacle** of agents working together. We're not trying to be productive - we're trying to be delightful and educational.

### Why newspapers as the first scenario?

Newspapers are perfect because:
- Everyone understands the output (a front page)
- Natural team structure (editor, reporters, etc.)
- Different editorial styles are immediately visible
- Creates shareable, visual artifacts
- Demonstrates bias and perspective clearly

### Won't this get expensive?

The app uses a shared API key with rate limiting (1 simulation per user per 24h) and daily budget controls (€0.50/day). Each simulation costs ~€0.015-0.02. Cost transparency is part of the learning experience - users see exactly how much each simulation costs.

### What's the business model?

Phase 1: Free with shared API key and rate limiting (1 simulation per user per 24h)
Phase 2: Premium scenarios and features ($5/month)
Phase 3: Team/Education licenses for schools and companies

### How do you prevent inappropriate content?

- Pre-configured scenarios with guardrails
- Content filtering on outputs
- No user-generated prompts in MVP
- Flag and review system for shared content

### Why would this go viral on LinkedIn?

Three reasons:
1. **Visual and unique** - Nobody has seen AI agents work like this
2. **Thought-provoking** - Raises questions about AI collaboration
3. **Shareable insights** - "Look how 3 AI newspapers covered the same story"

### What if Anthropic changes their API pricing?

The application uses Claude Agent SDK with budget controls built in. If costs increase, we can:
- Adjust daily budget limits
- Implement more aggressive rate limiting
- Potentially support multiple providers in the future
Cost transparency is part of the learning experience.

### How do you measure if users are actually learning?

- Post-session quiz (optional): "Which approach worked better?"
- Behavior tracking: Do users try different team configurations?
- Sharing patterns: Are users explaining what they learned when sharing?
- Return usage: Do users come back to test hypotheses?

---

## Success Vision (6 Months)

- 10,000 AI enthusiasts have run newsroom simulations
- 500+ simulations shared on LinkedIn/Twitter weekly
- Users intuitively understand when to use multi vs. single agents
- "AI Team Simulator" becomes the go-to demo for explaining agent systems
- Expansion to 5 different scenarios beyond newsrooms
- Lucas has multiple viral LinkedIn posts showing innovations

## Next Steps

1. Build MVP newsroom in 2-3 weeks
2. Test with 10 beta users
3. Launch on Product Hunt
4. Create LinkedIn demo video
5. Iterate based on usage patterns
6. Add second scenario based on user requests