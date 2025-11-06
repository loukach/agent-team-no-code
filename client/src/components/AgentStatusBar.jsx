import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Real-time agent status bar with heartbeat indicators
 * Shows continuous visual feedback even when no socket events are arriving
 */
export default function AgentStatusBar({ agents, phase }) {
  const [heartbeat, setHeartbeat] = useState(0);

  // Heartbeat animation - pulses every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeat(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const agentConfigs = {
    progressive: {
      name: 'Progressive Tribune',
      color: '#3B82F6',
      bgColor: 'bg-blue-50',
      icon: '🗞️'
    },
    conservative: {
      name: 'Traditional Post',
      color: '#EF4444',
      bgColor: 'bg-red-50',
      icon: '📰'
    },
    tech: {
      name: 'Digital Daily',
      color: '#A855F7',
      bgColor: 'bg-purple-50',
      icon: '💻'
    }
  };

  const getStatusDisplay = (agent) => {
    if (!agent) return { text: 'Waiting...', color: '#9CA3AF', pulsing: false };

    if (agent.status === 'searching' || agent.action === 'tool_use') {
      return { text: 'Searching Web', color: '#F59E0B', pulsing: true };
    }
    if (agent.status === 'writing' || agent.action === 'writing') {
      return { text: 'Writing Article', color: '#10B981', pulsing: true };
    }
    if (agent.status === 'reading' || agent.action === 'reading') {
      return { text: 'Reading Others', color: '#6366F1', pulsing: true };
    }
    if (agent.status === 'debating' || agent.action === 'debating') {
      return { text: 'Crafting Response', color: '#EC4899', pulsing: true };
    }
    if (agent.status === 'finalizing' || agent.action === 'finalizing') {
      return { text: 'Finalizing', color: '#22C55E', pulsing: true };
    }
    if (agent.status === 'complete') {
      return { text: 'Complete ✓', color: '#10B981', pulsing: false };
    }
    if (agent.status === 'error') {
      return { text: 'Error', color: '#EF4444', pulsing: false };
    }

    return { text: 'Thinking...', color: '#8B5CF6', pulsing: true };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      {/* Phase Indicator */}
      <AnimatePresence>
        {phase && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 pb-4 border-b border-gray-200"
          >
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-2xl"
              >
                🎭
              </motion.div>
              <div>
                <div className="font-bold text-lg text-purple-900">{phase.title}</div>
                <div className="text-sm text-purple-600">{phase.description}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(agentConfigs).map(([agentType, config]) => {
          const agent = agents?.[agentType] || {};
          const status = getStatusDisplay(agent);

          return (
            <motion.div
              key={agentType}
              className={`${config.bgColor} rounded-lg p-3 border-2 transition-all duration-300`}
              style={{ borderColor: agent.status !== 'idle' ? status.color : '#E5E7EB' }}
              animate={{
                scale: status.pulsing && heartbeat % 2 === 0 ? 1.02 : 1,
                boxShadow: status.pulsing
                  ? `0 0 20px ${status.color}40`
                  : '0 1px 3px rgba(0,0,0,0.1)'
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Agent Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: config.color }}>
                    {config.name}
                  </div>
                </div>
                {/* Heartbeat Indicator */}
                {status.pulsing && (
                  <motion.div
                    key={heartbeat}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                )}
              </div>

              {/* Status Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: status.color }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: agent.status === 'idle' ? '10%' : agent.status === 'complete' ? '100%' : '75%',
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Status Text */}
              <div className="text-xs font-medium" style={{ color: status.color }}>
                {status.text}
              </div>

              {/* Current Action Preview */}
              {agent.action && agent.status !== 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-gray-600 line-clamp-2 italic"
                >
                  {typeof agent.action === 'string' ? agent.action.substring(0, 50) : ''}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⚙️
          </motion.div>
          <span className="font-medium">
            Agents are {phase?.title?.includes('Phase 2') ? 'debating' : 'researching'}...
          </span>
        </div>
      </div>
    </div>
  );
}
