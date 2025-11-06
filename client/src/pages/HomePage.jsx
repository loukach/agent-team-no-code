import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchSimulations } from '../utils/api';

export default function HomePage() {
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations()
      .then((sims) => {
        setRecentSimulations(sims.slice(0, 6));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch simulations:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Newsroom Simulator
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Watch three AI-powered newsrooms compete to cover the same story
          </p>
          <Link
            to="/simulation"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Run Your Newsroom
          </Link>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Three Newspapers, Three Perspectives
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md border-t-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-600 mb-2">
                The Progressive Tribune
              </h3>
              <p className="text-sm italic text-gray-600 mb-3">
                "Question Everything"
              </p>
              <p className="text-gray-700">
                Challenges power structures, focuses on social justice and human impact
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border-t-4 border-red-500">
              <h3 className="text-xl font-bold text-red-600 mb-2">
                The Traditional Post
              </h3>
              <p className="text-sm italic text-gray-600 mb-3">
                "Trusted Since 1887"
              </p>
              <p className="text-gray-700">
                Emphasizes stability, traditional values, and economic analysis
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border-t-4 border-purple-500">
              <h3 className="text-xl font-bold text-purple-600 mb-2">
                The Digital Daily
              </h3>
              <p className="text-sm italic text-gray-600 mb-3">
                "Tomorrow's News Today"
              </p>
              <p className="text-gray-700">
                Focuses on innovation, disruption, and technological solutions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Simulations */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Simulations</h2>
            <Link
              to="/gallery"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-6 shadow-md animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : recentSimulations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSimulations.map((sim) => (
                <Link
                  key={sim.id}
                  to={`/sim/${sim.id}`}
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-bold text-gray-900 mb-3">{sim.topic}</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-600 truncate">
                      📰 {sim.progressive_headline}
                    </p>
                    <p className="text-red-600 truncate">
                      📰 {sim.conservative_headline}
                    </p>
                    <p className="text-purple-600 truncate">
                      📰 {sim.tech_headline}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(sim.created_at * 1000).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No simulations yet. Be the first to run one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
