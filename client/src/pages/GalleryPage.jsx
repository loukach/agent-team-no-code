import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSimulations } from '../utils/api';

export default function GalleryPage() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulations()
      .then((sims) => {
        setSimulations(sims);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch simulations:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-2">Simulation Gallery</h1>
          <p className="text-gray-600">
            Explore all newsroom simulations
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : simulations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((sim) => (
              <Link
                key={sim.id}
                to={`/sim/${sim.id}`}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <h3 className="font-bold text-gray-900 mb-4 text-lg">
                  {sim.topic}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="font-semibold text-blue-700 text-xs mb-1">
                      The Progressive Tribune
                    </p>
                    <p className="text-gray-700">{sim.progressive_headline}</p>
                  </div>

                  <div className="border-l-4 border-red-500 pl-3">
                    <p className="font-semibold text-red-700 text-xs mb-1">
                      The Traditional Post
                    </p>
                    <p className="text-gray-700">{sim.conservative_headline}</p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-3">
                    <p className="font-semibold text-purple-700 text-xs mb-1">
                      The Digital Daily
                    </p>
                    <p className="text-gray-700">{sim.tech_headline}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  {new Date(sim.created_at * 1000).toLocaleDateString()} •
                  €{sim.cost?.toFixed(4) || '0.0000'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">
              No simulations in the gallery yet.
            </p>
            <Link
              to="/simulation"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Run First Simulation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
