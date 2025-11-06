import { useState } from 'react';

export default function TopicSelector({ onSubmit, disabled }) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter any news topic or current event..."
          disabled={disabled}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          autoFocus
        />
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={disabled || !topic.trim()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {disabled ? 'Running Simulation...' : 'Start Newsroom Simulation'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-3 text-center">
        Watch three AI newsrooms research and cover this story with their unique perspectives
      </p>
    </form>
  );
}
