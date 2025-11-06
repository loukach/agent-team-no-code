import { motion, AnimatePresence } from 'framer-motion';

const agentColors = {
  progressive: 'bg-blue-50 border-l-4 border-blue-500',
  conservative: 'bg-red-50 border-l-4 border-red-500',
  tech: 'bg-purple-50 border-l-4 border-purple-500'
};

export default function AgentDebate({ messages }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
      <AnimatePresence>
        {messages.map((msg, index) => {
          // Phase change messages get special styling
          if (msg.isPhaseChange) {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300"
              >
                <p className="font-bold text-lg text-purple-900">{msg.message}</p>
                {msg.description && (
                  <p className="text-sm text-purple-700 mt-1">{msg.description}</p>
                )}
              </motion.div>
            );
          }

          // Regular agent messages
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded ${agentColors[msg.agent] || 'bg-gray-100'}`}
            >
              <p className="font-semibold text-sm mb-1">{msg.newspaper}</p>
              <p className="text-gray-700">{msg.message}</p>

              {/* Show rebuttal if available */}
              {msg.rebuttal && (
                <div className="mt-2 text-sm bg-white bg-opacity-70 p-3 rounded border-l-4 border-orange-500">
                  <span className="font-semibold text-orange-700">Rebuttal: </span>
                  <span className="text-gray-800">{msg.rebuttal}</span>
                </div>
              )}

              {/* Show tool details if available */}
              {msg.tool && (
                <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
                  <span className="font-semibold">Tool: {msg.tool}</span>
                  {msg.details && <span className="ml-2 text-gray-600">{msg.details}</span>}
                </div>
              )}

              {/* Show preview if available */}
              {msg.preview && (
                <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded italic text-gray-600">
                  {msg.preview}...
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Agent orchestration will appear here...
        </div>
      )}
    </div>
  );
}
