import { query } from '@anthropic-ai/claude-agent-sdk';
import { config } from './config.js';

/**
 * Creates a heartbeat interval that emits status updates every 3 seconds
 * Returns a cleanup function to stop the heartbeat
 */
function createHeartbeat(agent, newspaper, io, statusText = 'Working...') {
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    io.emit('agent:progress', {
      agent,
      newspaper: newspaper.name,
      action: 'active',
      message: `${statusText} ${'.'.repeat(counter % 4)}`,
      heartbeat: true
    });
  }, 3000);

  return () => clearInterval(interval);
}

const NEWSPAPERS = {
  progressive: {
    name: 'The Progressive Tribune',
    tagline: 'Question Everything',
    personality: 'Always question power structures, champion underdog perspectives, focus on social justice and inequality',
    style: 'Provocative headlines with emotional appeal, focus on human impact and systemic issues',
    tone: 'Passionate, activist, challenging'
  },
  conservative: {
    name: 'The Traditional Post',
    tagline: 'Trusted Since 1887',
    personality: 'Preserve institutions, emphasize stability and order, skeptical of rapid change',
    style: 'Measured tone, data-driven analysis, focus on economic impacts and traditional values',
    tone: 'Authoritative, cautious, traditional'
  },
  tech: {
    name: 'The Digital Daily',
    tagline: "Tomorrow's News Today",
    personality: 'Everything is disruption, focus on innovation and future trends, relentlessly optimistic about technology',
    style: 'Buzzword-heavy, forward-looking, focus on technological solutions and Silicon Valley perspective',
    tone: 'Enthusiastic, futuristic, techno-optimist'
  }
};

function createSystemPrompt(newspaper, topic) {
  // Single-line format for Windows compatibility
  return `You are the editor of ${newspaper.name}, a newspaper with a distinct editorial voice. Your editorial stance: ${newspaper.personality}. Your writing style: ${newspaper.style}. Your tone: ${newspaper.tone}. RESEARCH PROCESS: 1) Use WebSearch to find recent articles and information about "${topic}" on web sources you identify with 2) Analyze findings through your editorial lens but without changing facts  3) Write from your unique perspective. IMPORTANT: take a bold stance, challenge mainstream narratives and ai-slop, be provocative but professional. Provide ONLY: 1) A compelling headline (max 80 characters), 2) A lead paragraph (2-3 sentences), 3) List of source URLs you used. Format your response as JSON: {"headline": "Your headline here", "story": "Your lead paragraph here", "sources": ["url1", "url2"]}`;
}

async function runDebateAgent(newspaperType, topic, otherAgents, io) {
  console.log(`[DEBATE ${newspaperType.toUpperCase()}] Reading other perspectives...`);
  const newspaper = NEWSPAPERS[newspaperType];

  // Emit reading event
  io.emit('agent:reading', {
    agent: newspaperType,
    newspaper: newspaper.name,
    message: `${newspaper.name} is reading the other perspectives...`
  });

  if (!config.anthropic.apiKey) {
    return null;
  }

  try {
    // Build the debate prompt showing the other perspectives
    const otherPerspectives = Object.entries(otherAgents)
      .filter(([_, data]) => data && !data.error && !data.refused)
      .map(([name, data]) => {
        const otherNewspaper = NEWSPAPERS[name];
        return `${otherNewspaper.name}: "${data.headline}"`;
      })
      .join('\n');

    if (!otherPerspectives) {
      return null; // No valid perspectives to debate
    }

    const debatePrompt = `You are the editor of ${newspaper.name}. You just published your headline about "${topic}". Now you've read what the other newspapers wrote:

${otherPerspectives}

Write a SHORT rebuttal (2-3 sentences max) responding to ONE specific point from the other headlines that you strongly disagree with. Be provocative and defend your perspective. Format as JSON: {"rebuttal": "Your 2-3 sentence response here", "targetNewspaper": "name of newspaper you're responding to"}`;

    const result = query({
      prompt: debatePrompt,
      options: {
        model: config.anthropic.model,
        apiKey: config.anthropic.apiKey,
        maxTurns: 2, // Shorter for debate
        cwd: process.cwd(),
        settingSources: [],
        allowedTools: [], // No tools needed for debate
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
            // Emit debate writing progress
            io.emit('agent:debating', {
              agent: newspaperType,
              newspaper: newspaper.name,
              message: `${newspaper.name} is writing a rebuttal...`
            });
          }
        }
      }
    }

    if (!finalResult) {
      return null;
    }

    // Parse JSON response
    let response;
    try {
      const jsonMatch = finalResult.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        return null;
      }
    } catch (parseError) {
      console.log(`[DEBATE ${newspaperType.toUpperCase()}] JSON parse error:`, parseError.message);
      return null;
    }

    console.log(`[DEBATE ${newspaperType.toUpperCase()}] Completed - Cost: $${totalCost.toFixed(4)}`);

    // Emit debate completion
    io.emit('agent:debate-complete', {
      agent: newspaperType,
      newspaper: newspaper.name,
      rebuttal: response.rebuttal,
      target: response.targetNewspaper
    });

    return {
      rebuttal: response.rebuttal,
      targetNewspaper: response.targetNewspaper,
      cost: totalCost
    };
  } catch (error) {
    console.error(`[DEBATE ${newspaperType.toUpperCase()}] ERROR:`, error.message);
    return null;
  }
}

async function runSingleAgent(newspaperType, topic, io) {
  console.log(`[AGENT ${newspaperType.toUpperCase()}] Starting...`);
  const newspaper = NEWSPAPERS[newspaperType];

  // Emit thinking event
  io.emit('agent:thinking', {
    agent: newspaperType,
    newspaper: newspaper.name,
    message: `${newspaper.name} is analyzing the story...`
  });

  // Check if API key is configured
  if (!config.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your .env file.');
  }

  // Start heartbeat for continuous UI updates
  const stopHeartbeat = createHeartbeat(
    newspaperType,
    newspaper,
    io,
    `${newspaper.name} is researching`
  );

  try {
    const systemPrompt = createSystemPrompt(newspaper, topic);

    // Use the Agent SDK with proper configuration for web backend
    const result = query({
      prompt: `${systemPrompt}

Write a news article about: ${topic}

Remember to format your response as JSON with "headline", "story", and "sources" fields.`,
      options: {
        model: config.anthropic.model, // Use 'sonnet' from config
        apiKey: config.anthropic.apiKey, // Provide API key directly
        maxTurns: 5, // Allow multiple turns for web research
        cwd: process.cwd(),
        settingSources: [], // Don't load from filesystem
        allowedTools: ['WebSearch'], // Enable web search capability
      }
    });

    let finalResult = null;
    let totalCost = 0;
    let lastEmitTime = Date.now();

    // Collect messages from the agent with real-time progress
    for await (const msg of result) {
      // Emit detailed progress events
      if (msg.type === 'assistant' && msg.content) {
        // Handle assistant messages - emit progress for each action
        for (const block of msg.content) {
          if (block.type === 'text') {
            finalResult = block.text;
            // Emit thinking/writing progress
            io.emit('agent:progress', {
              agent: newspaperType,
              newspaper: newspaper.name,
              action: 'writing',
              message: `${newspaper.name} is writing the article...`,
              preview: block.text.substring(0, 100)
            });
          } else if (block.type === 'tool_use') {
            // Emit tool usage (e.g., WebSearch)
            const toolName = block.name || 'unknown';
            const toolInput = block.input ? JSON.stringify(block.input).substring(0, 100) : '';
            io.emit('agent:progress', {
              agent: newspaperType,
              newspaper: newspaper.name,
              action: 'tool_use',
              tool: toolName,
              message: `${newspaper.name} is using ${toolName}...`,
              details: toolInput
            });
          }
        }
      } else if (msg.type === 'tool_result') {
        // Emit tool result received
        io.emit('agent:progress', {
          agent: newspaperType,
          newspaper: newspaper.name,
          action: 'tool_result',
          message: `${newspaper.name} received research results...`
        });
      } else if (msg.type === 'result') {
        // Extract the final result
        finalResult = msg.result || msg.content || msg.text || JSON.stringify(msg);
        totalCost = msg.total_cost_usd || 0;

        // Emit final processing
        io.emit('agent:progress', {
          agent: newspaperType,
          newspaper: newspaper.name,
          action: 'finalizing',
          message: `${newspaper.name} is finalizing the article...`
        });
      }
    }

    if (!finalResult) {
      throw new Error('No result received from agent');
    }

    // Parse JSON response - or handle non-JSON gracefully
    let response;
    try {
      // Try to extract JSON from the response
      const jsonMatch = finalResult.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        // No JSON found - treat as refusal/explanation
        console.log(`${newspaper.name} provided non-JSON response (likely refusal):`, finalResult.substring(0, 200));
        response = {
          headline: `${newspaper.name} Declined`,
          story: finalResult.trim(),
          refused: true
        };
      }
    } catch (parseError) {
      // JSON parsing failed - still show the content
      console.log(`${newspaper.name} JSON parse error, displaying raw response:`, parseError.message);
      response = {
        headline: `${newspaper.name} Response`,
        story: finalResult.trim(),
        refused: true
      };
    }

    console.log(`[AGENT ${newspaperType.toUpperCase()}] Completed - Cost: $${totalCost.toFixed(4)}`);

    // Stop heartbeat
    stopHeartbeat();

    return {
      headline: response.headline,
      story: response.story,
      sources: response.sources || [],
      cost: totalCost,
      refused: response.refused || false
    };
  } catch (error) {
    // Stop heartbeat on error
    stopHeartbeat();

    console.error(`[AGENT ${newspaperType.toUpperCase()}] ERROR:`, error.message);
    throw new Error(`Failed to generate ${newspaper.name} perspective: ${error.message}`);
  }
}

export async function runNewsroomSimulation(topic, io) {
  console.log(`[SIMULATION START] Topic: ${topic}`);
  io.emit('simulation:start', { topic });

  try {
    // PHASE 1: Independent Research
    console.log('[PHASE 1] Starting independent research...');
    io.emit('phase:change', {
      phase: 1,
      title: 'Phase 1: Independent Research',
      description: 'Each newsroom researches the topic independently'
    });

    const [progressive, conservative, tech] = await Promise.all([
      runSingleAgent('progressive', topic, io).catch(err => {
        console.error('[AGENT ERROR] Progressive:', err.message);
        return {
          headline: 'The Progressive Tribune - Error',
          story: `Agent encountered an error: ${err.message}`,
          cost: 0,
          error: true
        };
      }),
      runSingleAgent('conservative', topic, io).catch(err => {
        console.error('[AGENT ERROR] Conservative:', err.message);
        return {
          headline: 'The Traditional Post - Error',
          story: `Agent encountered an error: ${err.message}`,
          cost: 0,
          error: true
        };
      }),
      runSingleAgent('tech', topic, io).catch(err => {
        console.error('[AGENT ERROR] Tech:', err.message);
        return {
          headline: 'The Digital Daily - Error',
          story: `Agent encountered an error: ${err.message}`,
          cost: 0,
          error: true
        };
      })
    ]);

    console.log('[PHASE 1] All agents completed initial research');

    // Emit completion for each (including errors/refusals)
    io.emit('agent:complete', { agent: 'progressive', ...progressive, phase: 1 });
    io.emit('agent:complete', { agent: 'conservative', ...conservative, phase: 1 });
    io.emit('agent:complete', { agent: 'tech', ...tech, phase: 1 });

    // PHASE 2: Agent Debate (if no major errors)
    const hasValidResults = [progressive, conservative, tech].filter(r => !r.error).length >= 2;

    let debate = { progressive: null, conservative: null, tech: null };

    if (hasValidResults) {
      console.log('[PHASE 2] Starting agent debate...');
      io.emit('phase:change', {
        phase: 2,
        title: 'Phase 2: Agent Debate',
        description: 'Each newsroom reads and responds to the others'
      });

      // Each agent reads the other two and provides a rebuttal
      const [progressiveDebate, conservativeDebate, techDebate] = await Promise.all([
        runDebateAgent('progressive', topic, { conservative, tech }, io).catch(err => {
          console.error('[DEBATE ERROR] Progressive:', err.message);
          return null;
        }),
        runDebateAgent('conservative', topic, { progressive, tech }, io).catch(err => {
          console.error('[DEBATE ERROR] Conservative:', err.message);
          return null;
        }),
        runDebateAgent('tech', topic, { progressive, conservative }, io).catch(err => {
          console.error('[DEBATE ERROR] Tech:', err.message);
          return null;
        })
      ]);

      debate = {
        progressive: progressiveDebate,
        conservative: conservativeDebate,
        tech: techDebate
      };

      console.log('[PHASE 2] Debate completed');
    } else {
      console.log('[PHASE 2] Skipping debate due to errors in Phase 1');
      io.emit('phase:skip', {
        phase: 2,
        reason: 'Too many errors in initial research'
      });
    }

    const debateCost = (debate.progressive?.cost || 0) + (debate.conservative?.cost || 0) + (debate.tech?.cost || 0);
    const totalCost = (progressive.cost || 0) + (conservative.cost || 0) + (tech.cost || 0) + debateCost;

    const result = {
      progressive: {
        name: NEWSPAPERS.progressive.name,
        tagline: NEWSPAPERS.progressive.tagline,
        headline: progressive.headline,
        story: progressive.story,
        sources: progressive.sources || [],
        refused: progressive.refused || false,
        error: progressive.error || false,
        debate: debate.progressive
      },
      conservative: {
        name: NEWSPAPERS.conservative.name,
        tagline: NEWSPAPERS.conservative.tagline,
        headline: conservative.headline,
        story: conservative.story,
        sources: conservative.sources || [],
        refused: conservative.refused || false,
        error: conservative.error || false,
        debate: debate.conservative
      },
      tech: {
        name: NEWSPAPERS.tech.name,
        tagline: NEWSPAPERS.tech.tagline,
        headline: tech.headline,
        story: tech.story,
        sources: tech.sources || [],
        refused: tech.refused || false,
        error: tech.error || false,
        debate: debate.tech
      },
      cost: totalCost
    };

    console.log('[SIMULATION COMPLETE] Emitting results to client...');
    io.emit('simulation:complete', result);
    console.log('[SIMULATION COMPLETE] Results emitted successfully');
    return result;
  } catch (error) {
    console.error('[SIMULATION ERROR]', error);
    io.emit('simulation:error', { error: error.message });
    throw error;
  }
}