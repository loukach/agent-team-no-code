import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentNode from './AgentNode';

const AGENT_POSITIONS = {
  orchestrator: { x: 350, y: 20, width: 150, height: 100 },
  progressive: { x: 100, y: 200, width: 140, height: 140 },
  conservative: { x: 350, y: 200, width: 140, height: 140 },
  tech: { x: 600, y: 200, width: 140, height: 140 }
};

const AGENT_COLORS = {
  orchestrator: '#8B5CF6',
  progressive: '#3B82F6',
  conservative: '#EF4444',
  tech: '#A855F7'
};

export default function AgentOrchestrationView({ messages, phase }) {
  const [agents, setAgents] = useState({
    orchestrator: { status: 'idle', action: '', rebuttal: null },
    progressive: { status: 'idle', action: '', rebuttal: null },
    conservative: { status: 'idle', action: '', rebuttal: null },
    tech: { status: 'idle', action: '', rebuttal: null }
  });
  const [activeConnections, setActiveConnections] = useState([]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.agent && lastMessage.agent !== 'system') {
      const newStatus = getStatusFromAction(lastMessage.action);

      setAgents(prev => ({
        ...prev,
        [lastMessage.agent]: {
          status: newStatus,
          action: lastMessage.message,
          rebuttal: lastMessage.rebuttal || prev[lastMessage.agent].rebuttal
        }
      }));

      // Handle connections
      if (lastMessage.action === 'reading') {
        setActiveConnections(['reading']);
        setTimeout(() => setActiveConnections([]), 2000);
      } else if (lastMessage.action === 'tool_use') {
        setActiveConnections(prev => [...prev, `${lastMessage.agent}-web`]);
        setTimeout(() => {
          setActiveConnections(prev => prev.filter(c => c !== `${lastMessage.agent}-web`));
        }, 3000);
      }
    }

    // Update orchestrator based on phase
    if (phase) {
      setAgents(prev => ({
        ...prev,
        orchestrator: {
          status: 'active',
          action: phase.description,
          rebuttal: null
        }
      }));
    }
  }, [messages, phase]);

  const getStatusFromAction = (action) => {
    if (!action) return 'idle';
    if (action === 'tool_use') return 'searching';
    if (action === 'writing') return 'writing';
    if (action === 'reading') return 'reading';
    if (action === 'debating' || action === 'debate-complete') return 'debating';
    if (action === 'finalizing') return 'finalizing';
    return 'active';
  };

  const ConnectionLine = ({ from, to, isActive }) => {
    const fromPos = AGENT_POSITIONS[from];
    const toPos = AGENT_POSITIONS[to];

    if (!fromPos || !toPos) return null;

    const x1 = fromPos.x + fromPos.width / 2;
    const y1 = fromPos.y + fromPos.height;
    const x2 = toPos.x + toPos.width / 2;
    const y2 = toPos.y;

    const controlY = (y1 + y2) / 2;

    return (
      <motion.path
        d={`M ${x1} ${y1} Q ${x1} ${controlY}, ${x2} ${y2}`}
        fill="none"
        stroke={isActive ? '#F59E0B' : '#E5E7EB'}
        strokeWidth={isActive ? 3 : 2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
        style={{
          strokeDasharray: isActive ? '10 5' : 'none',
          filter: isActive ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' : 'none'
        }}
      >
        {isActive && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="30"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </motion.path>
    );
  };

  const WebCloud = ({ agent }) => {
    const pos = AGENT_POSITIONS[agent];
    if (!pos) return null;

    const x = pos.x + pos.width / 2;
    const y = pos.y + pos.height + 100;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <motion.circle
          cx={x}
          cy={y}
          r="30"
          fill="#E0E7FF"
          stroke="#6366F1"
          strokeWidth="2"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize="24"
          fill="#4F46E5"
        >
          🌐
        </text>
      </motion.g>
    );
  };

  return (
    <div className="relative w-full" style={{ height: '500px' }}>
      {/* SVG for connections */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      >
        {/* Static connections */}
        <ConnectionLine from="orchestrator" to="progressive" isActive={false} />
        <ConnectionLine from="orchestrator" to="conservative" isActive={false} />
        <ConnectionLine from="orchestrator" to="tech" isActive={false} />

        {/* Active connections for reading */}
        {activeConnections.includes('reading') && (
          <>
            <ConnectionLine from="progressive" to="conservative" isActive={true} />
            <ConnectionLine from="conservative" to="tech" isActive={true} />
            <ConnectionLine from="tech" to="progressive" isActive={true} />
          </>
        )}

        {/* Web clouds for searching agents */}
        <AnimatePresence>
          {activeConnections
            .filter(c => c.endsWith('-web'))
            .map(c => {
              const agent = c.replace('-web', '');
              return <WebCloud key={c} agent={agent} />;
            })}
        </AnimatePresence>

        {/* Connection lines to web */}
        {activeConnections
          .filter(c => c.endsWith('-web'))
          .map(c => {
            const agent = c.replace('-web', '');
            const pos = AGENT_POSITIONS[agent];
            if (!pos) return null;

            const x1 = pos.x + pos.width / 2;
            const y1 = pos.y + pos.height;
            const x2 = x1;
            const y2 = y1 + 100;

            return (
              <motion.path
                key={c}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="10"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </motion.path>
            );
          })}
      </svg>

      {/* Agent Nodes */}
      <div className="relative" style={{ zIndex: 1 }}>
        {Object.entries(agents).map(([agentName, agentState]) => (
          <AgentNode
            key={agentName}
            agent={agentName}
            position={AGENT_POSITIONS[agentName]}
            status={agentState.status}
            action={agentState.action}
            isDebating={agentState.status === 'debating'}
            rebuttal={agentState.rebuttal}
            color={AGENT_COLORS[agentName]}
          />
        ))}
      </div>

      {/* Phase Banner */}
      <AnimatePresence>
        {phase && (
          <motion.div
            className="absolute top-4 left-4 right-4 mx-auto max-w-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-lg shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold">{phase.title}</span>
              </div>
              <div className="text-sm text-center opacity-90 mt-1">
                {phase.description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Agent Status</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">Searching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Writing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-gray-600">Reading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-gray-600">Debating</span>
          </div>
        </div>
      </div>
    </div>
  );
}