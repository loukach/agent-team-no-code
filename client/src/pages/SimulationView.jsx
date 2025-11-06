import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSimulation } from '../utils/api';
import NewspaperCard from '../components/NewspaperCard';
import ShareButton from '../components/ShareButton';

export default function SimulationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSimulation(id)
      .then((sim) => {
        setSimulation(sim);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || 'Simulation not found'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const newspapers = {
    progressive: {
      name: 'The Progressive Tribune',
      tagline: 'Question Everything',
      headline: simulation.progressive_headline,
      story: simulation.progressive_story,
    },
    conservative: {
      name: 'The Traditional Post',
      tagline: 'Trusted Since 1887',
      headline: simulation.conservative_headline,
      story: simulation.conservative_story,
    },
    tech: {
      name: 'The Digital Daily',
      tagline: "Tomorrow's News Today",
      headline: simulation.tech_headline,
      story: simulation.tech_story,
    },
  };

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
          <h1 className="text-4xl font-bold mb-2">{simulation.topic}</h1>
          <p className="text-gray-600">
            {new Date(simulation.created_at * 1000).toLocaleDateString()} •
            Cost: €{simulation.cost?.toFixed(4) || '0.0000'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <NewspaperCard newspaper={newspapers.progressive} type="progressive" />
          <NewspaperCard newspaper={newspapers.conservative} type="conservative" />
          <NewspaperCard newspaper={newspapers.tech} type="tech" />
        </div>

        <div className="mb-8">
          <ShareButton
            simulation={{
              topic: simulation.topic,
              progressive: newspapers.progressive,
              conservative: newspapers.conservative,
              tech: newspapers.tech,
            }}
          />
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/simulation')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700"
          >
            Run Your Own Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
