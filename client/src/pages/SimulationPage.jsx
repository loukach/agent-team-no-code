import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopicSelector from '../components/TopicSelector';
import AgentDebate from '../components/AgentDebate';
import AgentOrchestrationCanvas from '../components/AgentOrchestrationCanvas';
import AgentStatusBar from '../components/AgentStatusBar';
import NewspaperCard from '../components/NewspaperCard';
import ShareButton from '../components/ShareButton';
import ActivityLogger from '../components/ActivityLogger';
import CompactActivityFeed from '../components/CompactActivityFeed';
import { runSimulation } from '../utils/api';
import { socket, connectSocket, disconnectSocket } from '../utils/socket';
import { useMessageQueue } from '../hooks/useMessageQueue';

export default function SimulationPage() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [topic, setTopic] = useState('');
  const { messages, enqueueMessage, clearMessages } = useMessageQueue();
  const [result, setResult] = useState(null);
  const [simulationId, setSimulationId] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(null);
  const [viewMode, setViewMode] = useState('visual'); // 'visual', 'text', or 'detailed'
  const [activities, setActivities] = useState([]);
  const [agentStates, setAgentStates] = useState({
    progressive: { status: 'idle', action: '' },
    conservative: { status: 'idle', action: '' },
    tech: { status: 'idle', action: '' }
  });
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect socket once on mount, register all event listeners
  useEffect(() => {
    // Connect to WebSocket server
    connectSocket();

    console.log('[SimulationPage] Socket connected, registering event listeners');

    socket.on('simulation:start', (data) => {
      console.log('[Socket Event] simulation:start', data);
      enqueueMessage({
        agent: 'system',
        newspaper: 'System',
        message: `Starting simulation for: ${data.topic}`,
        timestamp: Date.now()
      });
      // Reset agent states
      setAgentStates({
        progressive: { status: 'active', action: 'Initializing...' },
        conservative: { status: 'active', action: 'Initializing...' },
        tech: { status: 'active', action: 'Initializing...' }
      });
    });

    socket.on('agent:thinking', (data) => {
      enqueueMessage(data);
      updateAgentState(data.agent, 'active', data.message);
    });

    socket.on('phase:change', (data) => {
      setPhase(data);
      enqueueMessage({
        agent: 'system',
        newspaper: 'System',
        message: `📍 ${data.title}`,
        description: data.description,
        isPhaseChange: true,
        timestamp: Date.now()
      });
    });

    socket.on('phase:skip', (data) => {
      enqueueMessage({
        agent: 'system',
        newspaper: 'System',
        message: `⏭️ Skipping Phase ${data.phase}`,
        description: data.reason,
        isPhaseChange: true,
        timestamp: Date.now()
      });
    });

    socket.on('agent:reading', (data) => {
      enqueueMessage({
        agent: data.agent,
        newspaper: data.newspaper,
        message: `👁️ ${data.message}`,
        action: 'reading',
        timestamp: Date.now()
      });
      updateAgentState(data.agent, 'reading', data.message);
    });

    socket.on('agent:debating', (data) => {
      enqueueMessage({
        agent: data.agent,
        newspaper: data.newspaper,
        message: `💬 ${data.message}`,
        action: 'debating',
        timestamp: Date.now()
      });
      updateAgentState(data.agent, 'debating', data.message);
    });

    socket.on('agent:debate-complete', (data) => {
      enqueueMessage({
        agent: data.agent,
        newspaper: data.newspaper,
        message: `✅ ${data.newspaper} responds to ${data.target}`,
        rebuttal: data.rebuttal,
        action: 'debate-complete',
        timestamp: Date.now()
      });
      updateAgentState(data.agent, 'complete', 'Response complete');
    });

    socket.on('agent:progress', (data) => {
      // Add detailed progress updates with icons
      const actionIcon = {
        tool_use: '🔍',
        tool_result: '📥',
        writing: '✍️',
        finalizing: '✅'
      }[data.action] || '⚙️';

      enqueueMessage({
        agent: data.agent,
        newspaper: data.newspaper,
        message: `${actionIcon} ${data.message}`,
        action: data.action,
        tool: data.tool,
        details: data.details,
        preview: data.preview,
        timestamp: Date.now()
      });

      // Update agent state based on action
      updateAgentState(data.agent, data.action, data.message);
    });

    // NEW: Listen for detailed activity events
    socket.on('agent:activity', (data) => {
      console.log('[Socket Event] agent:activity', data);
      setActivities(prev => [...prev, data]);
    });

    socket.on('agent:complete', (data) => {
      enqueueMessage({
        agent: data.agent,
        newspaper: `${data.agent.charAt(0).toUpperCase() + data.agent.slice(1)} Complete`,
        message: `Headline ready: "${data.headline}"`,
        timestamp: Date.now()
      });
      updateAgentState(data.agent, 'complete', 'Article complete');
    });

    socket.on('simulation:complete', (data) => {
      console.log('[Socket Event] simulation:complete', data);
      setResult(data);
      setRunning(false);
      // Mark all agents as complete
      setAgentStates({
        progressive: { status: 'complete', action: '' },
        conservative: { status: 'complete', action: '' },
        tech: { status: 'complete', action: '' }
      });
    });

    socket.on('simulation:error', (data) => {
      console.log('[Socket Event] simulation:error', data);
      setError(data.error);
      setRunning(false);
    });

    // Cleanup: remove event listeners but DON'T disconnect socket
    // (socket stays connected for the entire session)
    return () => {
      console.log('[SimulationPage] Cleaning up event listeners (keeping socket connected)');
      socket.off('simulation:start');
      socket.off('phase:change');
      socket.off('phase:skip');
      socket.off('agent:thinking');
      socket.off('agent:reading');
      socket.off('agent:debating');
      socket.off('agent:debate-complete');
      socket.off('agent:progress');
      socket.off('agent:activity');
      socket.off('agent:complete');
      socket.off('simulation:complete');
      socket.off('simulation:error');
      // DON'T call disconnectSocket() - let socket stay alive
    };
  }, [enqueueMessage]); // enqueueMessage is now memoized, won't cause re-renders

  const updateAgentState = (agent, status, action) => {
    if (!['progressive', 'conservative', 'tech'].includes(agent)) return;

    setAgentStates(prev => ({
      ...prev,
      [agent]: { status, action }
    }));
  };

  const handleSubmit = async (selectedTopic) => {
    setTopic(selectedTopic);
    setRunning(true);
    clearMessages();
    setActivities([]); // Clear previous activities
    setResult(null);
    setError(null);
    setPhase(null);
    setAgentStates({
      progressive: { status: 'idle', action: '' },
      conservative: { status: 'idle', action: '' },
      tech: { status: 'idle', action: '' }
    });

    try {
      const fingerprint = `${navigator.userAgent}-${Date.now()}`;
      const response = await runSimulation(selectedTopic, fingerprint);
      setSimulationId(response.id);
    } catch (err) {
      setError(err.message);
      setRunning(false);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setTopic('');
    clearMessages();
    setActivities([]);
    setResult(null);
    setSimulationId(null);
    setError(null);
    setPhase(null);
    setAgentStates({
      progressive: { status: 'idle', action: '' },
      conservative: { status: 'idle', action: '' },
      tech: { status: 'idle', action: '' }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Newsroom Simulator</h1>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Home
          </button>
        </div>

        {/* Topic Selector */}
        {!running && !result && (
          <div className="mb-8">
            <TopicSelector onSubmit={handleSubmit} disabled={running} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">Error:</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-red-600 hover:text-red-800 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Running State */}
        {running && (
          <div className="max-w-6xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Newsrooms are working on: <span className="text-blue-600">{topic}</span>
            </h2>

            {/* Phase Indicator */}
            {phase && (
              <div className="mb-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border-2 border-indigo-300">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg font-bold text-indigo-900">{phase.title}</span>
                  <span className="text-sm text-indigo-700">• {phase.description}</span>
                </div>
              </div>
            )}

            {/* Live Agent Activity Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Progressive Tribune */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-blue-500">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900">The Progressive Tribune</h3>
                  <p className="text-xs text-blue-600 italic">"Question Everything"</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agentStates.progressive === 'working' ? 'bg-yellow-100 text-yellow-800' :
                      agentStates.progressive === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {agentStates.progressive === 'working' ? '⚙️ Working...' :
                       agentStates.progressive === 'completed' ? '✅ Complete' :
                       '⏳ Waiting'}
                    </span>
                  </div>
                </div>
                <CompactActivityFeed
                  activities={activities.filter(a => a.agent === 'progressive')}
                  agentType="progressive"
                  agentName="The Progressive Tribune"
                />
              </div>

              {/* Traditional Post */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-red-500">
                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                  <h3 className="text-lg font-bold text-red-900">The Traditional Post</h3>
                  <p className="text-xs text-red-600 italic">"Trusted Since 1887"</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agentStates.conservative === 'working' ? 'bg-yellow-100 text-yellow-800' :
                      agentStates.conservative === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {agentStates.conservative === 'working' ? '⚙️ Working...' :
                       agentStates.conservative === 'completed' ? '✅ Complete' :
                       '⏳ Waiting'}
                    </span>
                  </div>
                </div>
                <CompactActivityFeed
                  activities={activities.filter(a => a.agent === 'conservative')}
                  agentType="conservative"
                  agentName="The Traditional Post"
                />
              </div>

              {/* Digital Daily */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-purple-500">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900">The Digital Daily</h3>
                  <p className="text-xs text-purple-600 italic">"Tomorrow's News Today"</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agentStates.tech === 'working' ? 'bg-yellow-100 text-yellow-800' :
                      agentStates.tech === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {agentStates.tech === 'working' ? '⚙️ Working...' :
                       agentStates.tech === 'completed' ? '✅ Complete' :
                       '⏳ Waiting'}
                    </span>
                  </div>
                </div>
                <CompactActivityFeed
                  activities={activities.filter(a => a.agent === 'tech')}
                  agentType="tech"
                  agentName="The Digital Daily"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2 text-center">
              Three Perspectives on: {topic}
            </h2>
            <p className="text-center text-gray-600 mb-2">
              Cost: €{result.cost.toFixed(4)}
            </p>

            {/* Summary of Results */}
            {(() => {
              const successful = [result.progressive, result.conservative, result.tech].filter(n => !n.refused && !n.error).length;
              const refused = [result.progressive, result.conservative, result.tech].filter(n => n.refused).length;
              const errors = [result.progressive, result.conservative, result.tech].filter(n => n.error).length;

              return (
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-600">
                    {successful} of 3 newspapers covered this story
                    {refused > 0 && <span> · {refused} declined due to editorial guidelines</span>}
                    {errors > 0 && <span> · {errors} encountered errors</span>}
                  </p>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <NewspaperCard
                newspaper={result.progressive}
                type="progressive"
                activities={activities.filter(a => a.agent === 'progressive')}
              />
              <NewspaperCard
                newspaper={result.conservative}
                type="conservative"
                activities={activities.filter(a => a.agent === 'conservative')}
              />
              <NewspaperCard
                newspaper={result.tech}
                type="tech"
                activities={activities.filter(a => a.agent === 'tech')}
              />
            </div>


            <div className="mb-8">
              <ShareButton
                simulation={{
                  topic,
                  progressive: result.progressive,
                  conservative: result.conservative,
                  tech: result.tech,
                }}
              />
            </div>

            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Run Another Simulation
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
