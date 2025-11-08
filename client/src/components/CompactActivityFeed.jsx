import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CompactActivityFeed - Displays agent activity in a compact, inline format
 * Shows below each agent card with expandable event details
 */
export default function CompactActivityFeed({ activities = [], agentType, agentName }) {
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const containerRef = useRef(null);

  // Debug logging
  console.log(`[CompactActivityFeed] ${agentName} - ${activities.length} activities`, activities);

  // Auto-scroll to latest activity
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activities]);

  const toggleEventExpansion = (timestamp) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timestamp)) {
        newSet.delete(timestamp);
      } else {
        newSet.add(timestamp);
      }
      return newSet;
    });
  };

  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getEventIcon = (type) => {
    const icons = {
      prompt: '📝',
      input: '📥',
      turn_start: '🔄',
      tool_use: '🔧',
      tool_result: '📥',
      web_search: '🔍',
      reading_agent: '👁️',
      thinking: '✍️',
      response: '📤',
      conversation_summary: '📊',
      error: '⚠️'
    };
    return icons[type] || '⚙️';
  };

  const getEventColor = (type) => {
    const colors = {
      prompt: 'text-blue-600',
      input: 'text-gray-600',
      turn_start: 'text-purple-600',
      tool_use: 'text-orange-600',
      tool_result: 'text-green-700',
      web_search: 'text-green-600',
      reading_agent: 'text-purple-700',
      thinking: 'text-indigo-600',
      response: 'text-blue-700',
      conversation_summary: 'text-gray-700',
      error: 'text-red-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getCompactMessage = (activity) => {
    // User-friendly, informative messages that tell a story
    switch (activity.type) {
      case 'prompt':
        return '🎯 Agent starts researching';
      case 'input':
        // Hide internal "input" events - they're redundant with turn_start
        return null; // Will be filtered out
      case 'turn_start':
        // Skip turn markers - the actual searches tell the story better
        return null; // Will be filtered out
      case 'tool_use':
        // Don't show generic "Using WebSearch" - the search query below is more informative
        return null; // Will be filtered out
      case 'tool_result':
        // Show a preview of what was found
        if (activity.searchResults && activity.searchResults.length > 0) {
          return `✅ Discovered ${activity.searchResults.length} relevant sources`;
        }
        return '✅ Data retrieved successfully';
      case 'web_search':
        // Combine the action and query in one line
        return `🔍 Searching: ${activity.searchQuery || 'unknown query'}`;
      case 'reading_agent':
        // Show which agent is being read
        return `👁️ Reading ${activity.targetNewspaper}'s article`;
      case 'thinking':
        return '✍️ Synthesizing findings into article';
      case 'response':
        return `✅ Research complete (cost: $${activity.cost?.toFixed(4) || '0'})`;
      case 'conversation_summary':
        return `📊 Total: ${activity.summary?.totalTurns || 0} iterations, $${activity.summary?.cost?.toFixed(4) || '0'}`;
      case 'error':
        return `❌ Error: ${activity.error?.substring(0, 30) || 'Unknown'}`;
      default:
        return activity.message?.substring(0, 50) || 'Activity';
    }
  };

  const renderEventDetails = (activity) => {
    const details = [];

    if (activity.turnNumber !== undefined) {
      details.push({ label: 'Turn', value: activity.turnNumber });
    }
    if (activity.tool) {
      details.push({ label: 'Tool', value: activity.tool });
    }
    if (activity.toolId) {
      details.push({ label: 'Tool ID', value: activity.toolId });
    }
    if (activity.searchQuery) {
      details.push({ label: 'Query', value: activity.searchQuery });
    }

    // Display reading_agent details
    if (activity.targetNewspaper) {
      details.push({ label: 'Reading', value: activity.targetNewspaper });
    }
    if (activity.headline) {
      details.push({ label: 'Their Headline', value: activity.headline, long: true });
    }

    // Display search results in a user-friendly way
    if (activity.searchResults && activity.searchResults.length > 0) {
      const resultsDisplay = activity.searchResults.map((result, idx) =>
        `${idx + 1}. ${result.title}\n   ${result.url}`
      ).join('\n\n');
      details.push({ label: 'Search Results', value: resultsDisplay, long: true });
    }

    // Display raw tool output if no parsed results
    if (activity.toolOutput && !activity.searchResults) {
      const outputStr = typeof activity.toolOutput === 'string'
        ? activity.toolOutput
        : JSON.stringify(activity.toolOutput, null, 2);
      details.push({ label: 'Tool Output', value: outputStr, long: true });
    }

    if (activity.cost) {
      details.push({ label: 'Cost', value: `$${activity.cost.toFixed(6)}` });
    }
    if (activity.prompt) {
      details.push({ label: 'Prompt', value: activity.prompt, long: true });
    }
    if (activity.response) {
      details.push({ label: 'Response', value: activity.response, long: true });
    }
    if (activity.toolInput) {
      details.push({ label: 'Input', value: JSON.stringify(activity.toolInput, null, 2), long: true });
    }
    if (activity.summary) {
      details.push({ label: 'Summary', value: JSON.stringify(activity.summary, null, 2), long: true });
    }

    return details;
  };

  if (activities.length === 0) {
    return (
      <div className="compact-activity-feed">
        <div className="text-xs text-gray-400 italic px-3 py-2">
          No activity yet...
        </div>
      </div>
    );
  }

  return (
    <div className="compact-activity-feed border-t border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          📊 Activity ({activities.length})
        </span>
      </div>

      {/* Events Container - Grows with content */}
      <div
        ref={containerRef}
        className="events-container overflow-y-auto"
        style={{ maxHeight: `${Math.min(600, Math.max(300, activities.length * 40))}px` }}
      >
        <AnimatePresence>
          {activities.map((activity, idx) => {
            const compactMsg = getCompactMessage(activity);

            // Skip events that return null (like redundant tool_use when we have web_search)
            if (!compactMsg) return null;

            const isExpanded = expandedEvents.has(activity.timestamp);
            const details = renderEventDetails(activity);
            const hasDetails = details.length > 0;

            return (
              <motion.div
                key={`${activity.timestamp}-${idx}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`event-card border-b border-gray-100 ${hasDetails ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => hasDetails && toggleEventExpansion(activity.timestamp)}
              >
                {/* Compact View */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className={`text-base ${getEventColor(activity.type)}`}>
                    {getEventIcon(activity.type)}
                  </span>
                  <span className={`text-xs flex-1 ${getEventColor(activity.type)}`}>
                    {compactMsg}
                  </span>
                  <span className="text-xs text-gray-400">
                    {getRelativeTime(activity.timestamp)}
                  </span>
                  {hasDetails && (
                    <span className="text-xs text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-2 pl-9"
                  >
                    <div className="bg-white border border-gray-200 rounded p-2 text-xs">
                      {details.map((detail, detailIdx) => (
                        <div key={detailIdx} className="mb-1 last:mb-0">
                          <span className="font-semibold text-gray-700">{detail.label}:</span>{' '}
                          {detail.long ? (
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                              {detail.value}
                            </pre>
                          ) : (
                            <span className="text-gray-600">{detail.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
