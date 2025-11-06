# AI Team Simulator - Implementation Plan

## Project Overview
Build a web-based AI newsroom simulator where users watch three competing AI-powered newspapers cover the same story from different perspectives. Focus on agent debates, clean minimalist design, and social sharing.

## Architecture

### Technology Stack
- **Backend:** Node.js + Express.js
- **Real-time:** Socket.io
- **Database:** SQLite (sql.js - pure JavaScript)
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Animations:** Framer Motion
- **AI:** Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **Hosting:** Render.com (Web Service)

### System Architecture
```
┌─────────────────────────────────────────┐
│         Render.com Web Service          │
├─────────────────────────────────────────┤
│  Express Backend                        │
│  ├── API Key Management                 │
│  ├── Rate Limiting (fingerprinting)     │
│  ├── Session Storage (SQLite)           │
│  ├── Agent Orchestration                │
│  └── WebSocket Server (Socket.io)       │
├─────────────────────────────────────────┤
│  React Frontend (built & served)        │
│  ├── Minimalist UI                      │
│  ├── Live Agent Debates                 │
│  ├── Public Gallery                     │
│  └── LinkedIn Share Features            │
└─────────────────────────────────────────┘
```

### Project Structure
```
ai-newsroom/
├── server/
│   ├── index.js              # Express server & routes
│   ├── agents.js             # Agent orchestration logic
│   ├── rateLimit.js          # Abuse prevention
│   ├── database.js           # SQLite queries
│   └── config.js             # Configuration
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main application
│   │   ├── components/
│   │   │   ├── Newsroom.jsx  # Simulation view
│   │   │   ├── Gallery.jsx   # Public gallery
│   │   │   ├── Newspaper.jsx # Newspaper display
│   │   │   └── Share.jsx     # Sharing components
│   │   └── utils/
│   │       └── socket.js     # Socket.io client
│   └── public/
├── package.json
├── render.yaml               # Render deployment config
└── README.md
```

## Implementation Timeline

### Week 1: Core Functionality (Days 1-7)

#### Days 1-2: Project Setup
**Tasks:**
- Initialize Node.js/Express application
- Set up React frontend with Vite
- Configure Tailwind CSS
- Set up Render.com account and deployment
- Configure environment variables (ANTHROPIC_API_KEY)
- Create basic Express routes
- Test deployment to Render

**Deliverable:** Basic app running on Render.com

#### Days 3-4: Agent System
**Tasks:**
- Design 3 newspaper personalities (Progressive, Conservative, Tech)
- Write system prompts emphasizing disagreement (single-line format for Windows compatibility)
- Implement Claude Agent SDK integration (`@anthropic-ai/claude-agent-sdk`)
- **CRITICAL:** Use simple model names (`sonnet`, `opus`, `haiku`) NOT full versions
- Create parallel agent execution with Promise.all()
- Configure SDK options: `cwd: process.cwd()`, `settingSources: []`, `allowedTools: ['WebSearch']`
- Enable WebSearch capability for real-time research
- Add graceful error handling for refusals (non-JSON responses)
- Add cost tracking from `total_cost_usd` in result messages

**Deliverable:** Working multi-agent debate system with web research capability

#### Days 5-7: Database & Protection
**Tasks:**
- Set up SQLite database schema
- Implement browser fingerprinting (IP + user agent + canvas)
- Create rate limiting logic (1 run per fingerprint per 24h)
- Store simulation results in database
- Add daily budget controls (kill switch at €0.30/day)
- Create cost monitoring dashboard

**Deliverable:** Protected system that stores all simulations

### Week 2: UI & Polish (Days 8-14)

#### Days 8-9: Minimalist UI
**Tasks:**
- Design clean card-based layout
- Implement real-time debate display with detailed progress tracking
- Add real-time progress indicators:
  - 🔍 Tool usage (WebSearch) with query details
  - 📥 Research results received
  - ✍️ Writing with article preview
  - ✅ Finalizing
- Show disagreement highlights
- Add Framer Motion transitions
- Create mobile-responsive design
- Implement Socket.io for live updates with `agent:progress` events

**Deliverable:** Polished, engaging UI with full transparency into agent actions

#### Days 10-11: Newspaper Generation
**Tasks:**
- Design 3 newspaper CSS templates
- Progressive Tribune (bold, colorful)
- Traditional Post (classic, serif fonts)
- Digital Daily (modern, sans-serif)
- Implement front page layout
- Add headline, lead story, bylines
- **Display source URLs** - Clickable links to researched articles
- Handle refusal states with muted styling
- Generate preview images (html2canvas)

**Deliverable:** Beautiful newspaper outputs with source attribution

#### Days 12-14: Gallery & Sharing
**Tasks:**
- Create public gallery page
- Implement individual simulation pages (unique URLs)
- Add LinkedIn share button with pre-filled text
- Generate Open Graph meta tags
- Create preview images for social sharing
- Add "Browse while you wait" feature
- Implement replay functionality

**Deliverable:** Complete sharing system

## Key Features

### 1. Three Newspaper Personalities

```javascript
const newspapers = {
  progressive: {
    name: "The Progressive Tribune",
    tagline: "Question Everything",
    editorPersonality: "Always question power structures, champion underdog perspectives, focus on social justice",
    style: "Provocative headlines, emotional appeal, focus on human impact",
    tone: "Passionate, activist"
  },
  conservative: {
    name: "The Traditional Post",
    tagline: "Trusted Since 1887",
    editorPersonality: "Preserve institutions, emphasize stability and order, skeptical of rapid change",
    style: "Measured tone, data-driven, focus on economic impacts and tradition",
    tone: "Authoritative, cautious"
  },
  tech: {
    name: "The Digital Daily",
    tagline: "Tomorrow's News Today",
    editorPersonality: "Everything is disruption, focus on innovation and future trends, techno-optimist",
    style: "Buzzword-heavy, forward-looking, focus on technological solutions",
    tone: "Enthusiastic, futuristic"
  }
}
```

### 2. Agent Debate System

**Orchestration Pattern:** Parallel + Merge
- All 3 editors receive the same news event
- Each develops their editorial angle independently
- System highlights points of disagreement
- Each produces a front page

**Prompt Engineering for Debates:**
```javascript
const debateSystemPrompt = `
You are the editor of ${newspaper.name}.
Your editorial stance: ${newspaper.editorPersonality}

RESEARCH PROCESS:
1) Use WebSearch to find recent articles about the topic
2) Analyze findings through your editorial lens
3) Write from your unique perspective

IMPORTANT: You MUST disagree with other newspapers' perspectives.
- Challenge mainstream narratives
- Argue passionately for YOUR angle
- Point out what others are missing
- Be provocative but professional

Your goal is to create a headline and lead story that represents
your unique editorial perspective.

Provide your response as JSON with:
- headline: Compelling headline (max 80 chars)
- story: Lead paragraph (2-3 sentences)
- sources: Array of source URLs you researched
`
```

### 3. Rate Limiting Strategy

**Multi-Layer Protection:**
1. **Browser Fingerprinting**
   - Hash of: IP + User Agent + Screen Resolution + Timezone + Canvas
   - Stored in SQLite

2. **Local Storage Flag**
   - Set after first use
   - Check before allowing new run

3. **Server-Side Tracking**
   - One run per fingerprint per 24 hours
   - Show friendly message: "You've already run a simulation today! Browse the gallery or come back tomorrow."

4. **Cost Controls**
   - Daily budget limit (€0.30)
   - Max 500 tokens per agent
   - 60 second timeout
   - Kill switch if budget exceeded

### 4. Cost Optimization

**Current Implementation (with WebSearch):**
- Model: `sonnet` via Claude Agent SDK (simple name required!)
- Max turns: 5 per agent (web research capability)
- Budget per agent: €0.10
- **Enabled tools:** `['WebSearch']` for real-time research
- Cost per simulation: ~€0.08-0.10 (verified in testing)
- Daily budget: €2.00 (~20 simulations)
- 10€ budget = ~100-125 simulations

**SDK Configuration Notes:**
- **MUST use simple model names:** `sonnet`, `opus`, or `haiku`
- **Never use full names like:** `claude-3-5-sonnet-latest`
- Cost tracking via `total_cost_usd` in result messages
- **WebSearch enabled:** Set `allowedTools: ['WebSearch']` in query options
- **Multi-turn required:** Agents need multiple turns for web research + analysis

**Cost Breakdown:**
- Without WebSearch: ~€0.014 per simulation (1 turn, no tools)
- With WebSearch: ~€0.08-0.10 per simulation (5 turns, web research)
- 7x cost increase for real-time research capability

**Future Optimization:**
- Implement caching for recently researched topics
- Add response streaming for better UX
- Consider `haiku` model for certain agents (cost reduction)
- Selective WebSearch: Only enable for topics requiring current information

### 5. Public Gallery & Sharing

**Gallery Features:**
- Homepage shows latest 20 simulations
- Each has unique URL: `/sim/{id}`
- Clickable to view full results
- Shows: news topic, 3 headlines, timestamp

**LinkedIn Sharing:**
```javascript
const generateShareText = (simulation) => `
I just watched 3 AI newsrooms debate ${simulation.topic}! 🤖📰

${simulation.progressive.headline}
${simulation.conservative.headline}
${simulation.tech.headline}

Each AI editor brought a completely different perspective.
Try it yourself: ${simulation.url}

#AI #Journalism #AgenticAI #FutureOfMedia
`
```

**Open Graph Tags:**
```html
<meta property="og:title" content="AI Newspapers Debated: {topic}">
<meta property="og:description" content="3 AI newsrooms, 3 perspectives">
<meta property="og:image" content="/sim/{id}/preview.png">
<meta property="og:url" content="https://ai-newsroom.onrender.com/sim/{id}">
```

## Database Schema

```sql
CREATE TABLE simulations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  topic TEXT NOT NULL,
  progressive_headline TEXT,
  progressive_story TEXT,
  conservative_headline TEXT,
  conservative_story TEXT,
  tech_headline TEXT,
  tech_story TEXT,
  debate_log TEXT,
  cost REAL,
  fingerprint_hash TEXT
);

CREATE TABLE rate_limits (
  fingerprint_hash TEXT PRIMARY KEY,
  last_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 1
);

CREATE TABLE budget_tracking (
  date TEXT PRIMARY KEY,
  total_cost REAL,
  simulation_count INTEGER
);
```

## Render.com Deployment

### Configuration (render.yaml)
```yaml
services:
  - type: web
    name: ai-newsroom
    env: node
    plan: free  # Start with free tier
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false  # Set manually in Render dashboard
      - key: NODE_ENV
        value: production
      - key: DAILY_BUDGET
        value: 0.50
      - key: DATABASE_PATH
        value: /opt/render/project/src/data/simulations.db
```

### Deployment Steps
1. Push code to GitHub repository
2. Connect Render.com to GitHub repo
3. Add ANTHROPIC_API_KEY in Render dashboard (critical: use your Claude API key)
4. Deploy
5. Render will:
   - Install dependencies
   - Build React frontend
   - Start Express server
   - Assign public URL

## User Journey

1. **Land on Homepage**
   - See hero section: "Watch AI Newsrooms Compete"
   - View recent simulations in gallery
   - Click "Run Your Newsroom"

2. **Configure Simulation**
   - Enter any custom news topic in clean input field
   - No restrictions on topic selection
   - See cost estimate (~€0.08-0.10)
   - Click "Start Newsroom Simulation"

3. **Watch Live Debate (Real-Time Progress)**
   - See 3 newspaper cards
   - Real-time agent messages appear with detailed progress:
     - 🔍 "Using WebSearch..." (with search query)
     - 📥 "Received research results..."
     - ✍️ "Writing the article..." (with preview snippet)
     - ✅ "Finalizing the article..."
   - Full transparency into what each agent is doing
   - Disagreement moments highlighted
   - Takes 30-60 seconds (web research + analysis)

4. **View Results**
   - Three newspapers displayed side-by-side
   - Headlines and lead paragraphs
   - **Source URLs** - Clickable links to researched articles
   - Refusals displayed transparently with gray styling
   - "X of 3 newspapers covered" summary
   - Cost breakdown

5. **Share**
   - One-click LinkedIn share
   - Copy unique URL
   - Download image preview
   - Browse gallery

## Design Principles

1. **Clean & Minimalist**
   - White background, ample spacing
   - Focus on content, not chrome
   - Subtle animations only

2. **Emphasize Debate**
   - Highlight disagreements visually
   - Show tension between perspectives
   - Make conflicts interesting

3. **Fast to First Value**
   - < 60 seconds from start to results
   - No signup required
   - One-click experience

4. **Share-Worthy**
   - Beautiful newspaper designs
   - Unique insights worth discussing
   - Easy to share on LinkedIn

## Success Metrics

### Week 1 (MVP Launch)
- [ ] 10 beta users run simulations
- [ ] Average session cost < €0.01
- [ ] No rate limiting bypasses
- [ ] App loads in < 3 seconds

### Week 4 (Public Launch)
- [ ] 100 total simulations run
- [ ] 10+ LinkedIn shares
- [ ] Average session duration > 5 minutes
- [ ] 20+ return visitors

### Month 2
- [ ] 500 total simulations
- [ ] 50+ LinkedIn shares
- [ ] Viral potential demonstrated
- [ ] Cost per simulation optimized

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API costs spiral | Daily budget hard limit, kill switch |
| Users bypass rate limiting | Multi-layer protection (fingerprint + localStorage + IP) |
| Inappropriate content | Pre-configured safe topics, content filtering |
| Slow/boring experience | Speed controls, highlight mode, max 60 seconds |
| Low sharing | Beautiful designs, pre-filled share text, unique insights |
| Render.com free tier limits | Start free, upgrade if successful |

## Future Enhancements (Post-MVP)

### V2 Features
- Additional scenarios (Startup Team, Board of Mentors)
- Agent personality customization
- User accounts (optional)
- Extended debates (longer form articles)

### V3 Features
- Multi-language support
- Custom scenario creator
- Agent marketplace
- Multiplayer competitions

### Monetization Path
- Phase 1: Free with shared API key (current)
- Phase 2: Premium scenarios ($5/month)
- Phase 3: Team/Education licenses
- Phase 4: API for developers

## Next Steps

1. **Before Implementation:**
   - Review and approve this plan
   - Set up Render.com account
   - Generate Anthropic API key from https://console.anthropic.com/
   - Create GitHub repository

2. **Start Implementation:**
   - Day 1: Project setup
   - Follow week-by-week plan
   - Daily check-ins on progress

3. **Launch Preparation:**
   - Test with 5-10 beta users
   - Create demo video for LinkedIn
   - Prepare launch post
   - Monitor costs closely

## References

- PRD: See `PRD_AI_Team_Simulator.md`
- Design inspirations: Linear, Vercel, Stripe (minimalist SaaS)
- Agent frameworks: LangChain, AutoGen (for reference, not dependencies)