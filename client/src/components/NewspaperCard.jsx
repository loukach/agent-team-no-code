import { motion } from 'framer-motion';

const newspaperStyles = {
  progressive: {
    color: 'text-progressive',
    border: 'progressive-newspaper',
    taglineColor: 'text-blue-600'
  },
  conservative: {
    color: 'text-conservative',
    border: 'conservative-newspaper',
    taglineColor: 'text-red-600'
  },
  tech: {
    color: 'text-tech',
    border: 'tech-newspaper',
    taglineColor: 'text-purple-600'
  }
};

export default function NewspaperCard({ newspaper, type }) {
  const style = newspaperStyles[type];

  if (!newspaper) {
    return (
      <div className={`newspaper-card ${style.border} animate-pulse`}>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  // Determine if this is a refused/error state
  const isRefused = newspaper.refused === true;
  const isError = newspaper.error === true;
  const isNonStandard = isRefused || isError;

  // Use muted styling for refused/error states
  const cardBorder = isNonStandard ? 'border-gray-300 bg-gray-50' : style.border;
  const nameColor = isNonStandard ? 'text-gray-600' : style.color;
  const taglineColor = isNonStandard ? 'text-gray-500' : style.taglineColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`newspaper-card ${cardBorder} ${isNonStandard ? 'opacity-90' : ''}`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className={`text-2xl font-bold ${nameColor}`}>
            {newspaper.name}
          </h2>
          {isRefused && (
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
              Editorial Guidelines
            </span>
          )}
          {isError && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
              Error
            </span>
          )}
        </div>
        <p className={`text-sm italic ${taglineColor}`}>
          {newspaper.tagline}
        </p>
      </div>

      <div className="border-t-2 border-gray-200 pt-4">
        <h3 className={`text-xl font-bold mb-3 leading-tight ${isNonStandard ? 'text-gray-700' : ''}`}>
          {newspaper.headline}
        </h3>
        <p className={`leading-relaxed mb-4 ${isNonStandard ? 'text-gray-600 text-sm' : 'text-gray-700'}`}>
          {newspaper.story}
        </p>

        {/* Display sources if available */}
        {newspaper.sources && newspaper.sources.length > 0 && !isNonStandard && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">SOURCES:</p>
            <ul className="text-xs space-y-1">
              {newspaper.sources.map((source, idx) => (
                <li key={idx} className="text-blue-600 hover:text-blue-800 truncate">
                  <a href={source} target="_blank" rel="noopener noreferrer" className="underline">
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Display debate/rebuttal if available */}
        {newspaper.debate && newspaper.debate.rebuttal && !isNonStandard && (
          <div className="mt-4 pt-3 border-t-2 border-orange-300 bg-orange-50 -mx-4 -mb-4 p-4 rounded-b">
            <div className="flex items-start gap-2">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-700 mb-1">
                  EDITORIAL RESPONSE TO {newspaper.debate.targetNewspaper?.toUpperCase() || 'COMPETING VIEWS'}:
                </p>
                <p className="text-sm text-gray-800 leading-relaxed italic">
                  "{newspaper.debate.rebuttal}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
