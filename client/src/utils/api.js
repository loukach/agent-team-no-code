const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchSimulations() {
  const response = await fetch(`${API_URL}/api/simulations`);
  if (!response.ok) throw new Error('Failed to fetch simulations');
  return response.json();
}

export async function fetchSimulation(id) {
  const response = await fetch(`${API_URL}/api/simulation/${id}`);
  if (!response.ok) throw new Error('Failed to fetch simulation');
  return response.json();
}

export async function runSimulation(topic, fingerprint) {
  const response = await fetch(`${API_URL}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, fingerprint }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Simulation failed');
  }

  return response.json();
}

export async function fetchBudget() {
  const response = await fetch(`${API_URL}/api/budget`);
  if (!response.ok) throw new Error('Failed to fetch budget');
  return response.json();
}
