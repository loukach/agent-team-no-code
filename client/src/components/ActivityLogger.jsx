import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivityLogger({ activities = [] }) {
  const [expandedAgents, setExpandedAgents] = useState({
    progressive: true,
    conservative: true,
    tech: true
  });
  const [filter, setFilter] = useState('all');
  const [showRawData, setShowRawData] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  // Group activities by agent
  const groupedActivities = activities.reduce((acc, activity) => {
    const agent = activity.agent || 'system';
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(activity);
    return acc;
  }, {});

  const getActivityIcon = (type) => {
    const icons = {
      'input': '📥',
      'prompt': '📝',
      'turn_start': '🔄',
      'response': '💬',
      'tool_use': '🔧',
      'tool_result': '📦',
      'web_search': '🔍',
      'thinking': '🤔',
      'writing': '✍️',
      'reading': '👁️',
      'debating': '⚔️',
      'conversation_summary': '📊',
      'error': '❌',
      'complete': '✅',
      'cost': '💰',
      'timing': '⏱️'
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    const colors = {
      'input': 'text-cyan-600',
      'prompt': 'text-blue-600',
      'turn_start': 'text-teal-600',
      'response': 'text-green-600',
      'tool_use': 'text-purple-600',
      'tool_result': 'text-violet-600',
      'web_search': 'text-indigo-600',
      'thinking': 'text-amber-600',
      'conversation_summary': 'text-slate-700',
      'error': 'text-red-600',
      'complete': 'text-emerald-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const renderActivity = (activity) => {
    // Special rendering for conversation summary
    if (activity.type === 'conversation_summary' && activity.summary) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-2 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border-2 border-slate-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <span className="font-bold text-slate-800">Conversation Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Total Turns:</strong> {activity.summary.totalTurns}</div>
            <div><strong>Messages:</strong> {activity.summary.totalMessages}</div>
            <div><strong>Duration:</strong> {(activity.summary.duration / 1000).toFixed(1)}s</div>
            <div><strong>Cost:</strong> ${activity.summary.cost.toFixed(6)}</div>
            {activity.summary.hitMaxTurns && (
              <div className="col-span-2 text-amber-700 font-semibold">
                ⚠️ Reached maximum turns limit
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    // Special rendering for turn start
    if (activity.type === 'turn_start') {
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-2 p-2 bg-teal-50 rounded border-l-4 border-teal-500"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{getActivityIcon(activity.type)}</span>
            <span className="font-semibold text-teal-800">
              Turn {activity.turnNumber} Starting
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex items-start gap-2">
          <span className="text-lg">{getActivityIcon(activity.type)}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${getActivityColor(activity.type)}`}>
                  {activity.type.replace(/_/g, ' ').toUpperCase()}
                </span>
                {activity.turnNumber && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                    Turn {activity.turnNumber}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>

            {activity.message && (
              <p className="text-sm text-gray-700 mt-1">{activity.message}</p>
            )}

            {/* Show tool details */}
            {activity.tool && (
              <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                <strong>Tool:</strong> {activity.tool}
                {activity.toolInput && (
                  <div className="mt-1">
                    <strong>Input:</strong>
                    <pre className="mt-1 p-1 bg-white rounded overflow-x-auto">
                      {JSON.stringify(activity.toolInput, null, 2)}
                    </pre>
                  </div>
                )}
                {activity.toolOutput && (
                  <div className="mt-1">
                    <strong>Output:</strong>
                    <pre className="mt-1 p-1 bg-white rounded overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(activity.toolOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Show prompt */}
            {activity.prompt && showRawData && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <strong>Prompt:</strong>
                <pre className="mt-1 p-1 bg-white rounded whitespace-pre-wrap break-words">
                  {activity.prompt}
                </pre>
              </div>
            )}

            {/* Show response */}
            {activity.response && showRawData && (
              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                <strong>Response:</strong>
                <pre className="mt-1 p-1 bg-white rounded whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                  {activity.response}
                </pre>
              </div>
            )}

            {/* Show search results */}
            {activity.searchQuery && (
              <div className="mt-2 p-2 bg-indigo-50 rounded text-xs">
                <strong>Search Query:</strong> {activity.searchQuery}
                {activity.searchResults && (
                  <div className="mt-1">
                    <strong>Results:</strong>
                    <ul className="mt-1 space-y-1">
                      {activity.searchResults.map((result, idx) => (
                        <li key={idx} className="p-1 bg-white rounded">
                          <a href={result.url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline">
                            {result.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Show cost */}
            {activity.cost && (
              <div className="mt-1 text-xs text-gray-500">
                Cost: ${activity.cost.toFixed(6)}
              </div>
            )}

            {/* Show timing */}
            {activity.duration && (
              <div className="mt-1 text-xs text-gray-500">
                Duration: {activity.duration}ms
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Agent Activity Log</h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="all">All Activities</option>
            <option value="prompt">Prompts</option>
            <option value="response">Responses</option>
            <option value="tool_use">Tool Usage</option>
            <option value="web_search">Web Searches</option>
            <option value="thinking">Thinking</option>
            <option value="error">Errors</option>
          </select>
          <button
            onClick={() => setShowRawData(!showRawData)}
            className={`px-3 py-1 text-sm rounded ${
              showRawData
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </button>
          <button
            onClick={() => {
              const log = JSON.stringify(activities, null, 2);
              const blob = new Blob([log], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `agent-log-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Export Log
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(groupedActivities).map(([agent, agentActivities]) => {
          // Filter activities if needed
          const filteredActivities = filter === 'all'
            ? agentActivities
            : agentActivities.filter(a => a.type === filter);

          if (filteredActivities.length === 0) return null;

          const isExpanded = expandedAgents[agent];
          const agentColor = {
            progressive: 'bg-blue-600',
            conservative: 'bg-red-600',
            tech: 'bg-purple-600',
            system: 'bg-gray-600'
          }[agent] || 'bg-gray-600';

          return (
            <div key={agent} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedAgents(prev => ({
                  ...prev,
                  [agent]: !prev[agent]
                }))}
                className="w-full px-4 py-2 bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${agentColor}`} />
                  <span className="font-medium capitalize">{agent}</span>
                  <span className="text-sm text-gray-500">
                    ({filteredActivities.length} activities)
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-gray-50 space-y-2">
                      {filteredActivities.map((activity, idx) => (
                        <div key={idx}>
                          {renderActivity(activity)}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}