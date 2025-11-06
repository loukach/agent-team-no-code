import { motion, AnimatePresence } from 'framer-motion';

const AgentNode = ({
  agent,
  position,
  status,
  action,
  isDebating,
  rebuttal,
  color
}) => {
  const getAvatar = () => {
    const avatars = {
      progressive: '🗞️',
      conservative: '📰',
      tech: '💻',
      orchestrator: '🎭'
    };
    return avatars[agent] || '📄';
  };

  const getStatusAnimation = () => {
    if (status === 'searching') {
      return {
        scale: [1, 1.1, 1],
        transition: { duration: 1, repeat: Infinity }
      };
    }
    if (status === 'writing') {
      return {
        y: [0, -5, 0],
        transition: { duration: 1.5, repeat: Infinity }
      };
    }
    if (status === 'debating') {
      return {
        rotate: [-5, 5, -5],
        transition: { duration: 0.5, repeat: Infinity }
      };
    }
    return {};
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height
      }}
      animate={getStatusAnimation()}
    >
      {/* Agent Card */}
      <motion.div
        className="relative bg-white rounded-xl shadow-lg border-2 p-4 h-full"
        style={{
          borderColor: color,
          background: `linear-gradient(135deg, white 0%, ${color}10 100%)`
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {/* Avatar */}
        <div className="text-4xl text-center mb-2">
          {getAvatar()}
        </div>

        {/* Name */}
        <h3
          className="font-bold text-center text-sm mb-2"
          style={{ color }}
        >
          {agent === 'orchestrator' ? 'Editor-in-Chief' :
           agent === 'progressive' ? 'Progressive Tribune' :
           agent === 'conservative' ? 'Traditional Post' :
           'Digital Daily'}
        </h3>

        {/* Status Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            className="h-2 rounded-full"
            style={{
              background: status === 'idle' ? '#9CA3AF' :
                        status === 'searching' ? '#F59E0B' :
                        status === 'writing' ? '#10B981' :
                        status === 'reading' ? '#6366F1' :
                        status === 'debating' ? '#EC4899' :
                        '#3B82F6'
            }}
            animate={{
              width: status === 'idle' ? '10%' : '100%'
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Current Action */}
        {action && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-gray-600 text-center line-clamp-2"
          >
            {action.replace(/[🔍📥✍️✅👁️💬]/g, '').trim()}
          </motion.p>
        )}

        {/* Status Indicator */}
        {status !== 'idle' && (
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full"
            style={{
              background: status === 'searching' ? '#F59E0B' :
                        status === 'writing' ? '#10B981' :
                        status === 'reading' ? '#6366F1' :
                        status === 'debating' ? '#EC4899' :
                        '#3B82F6'
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
          />
        )}
      </motion.div>

      {/* Speech Bubble for Debates */}
      <AnimatePresence>
        {isDebating && rebuttal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: -40 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border-2 border-orange-400 p-3 w-64 z-10"
            style={{ bottom: '100%' }}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
            <p className="text-xs italic text-gray-700">{rebuttal}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WebSearch Animation */}
      <AnimatePresence>
        {status === 'searching' && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: position.width / 2,
                  y: position.height,
                  opacity: 1
                }}
                animate={{
                  y: position.height + 100,
                  opacity: 0,
                  x: position.width / 2 + (i - 1) * 30
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgentNode;