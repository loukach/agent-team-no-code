import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { nanoid } from 'nanoid';

import { config } from './config.js';
import {
  saveSimulation,
  getSimulations,
  getSimulationById,
  checkRateLimit,
  updateRateLimit,
  getDailyBudget,
  updateDailyBudget
} from './database.js';
import { runNewsroomSimulation } from './agents.js';
import { getFingerprintFromRequest } from './rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.nodeEnv === 'development'
      ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
      : '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: config.nodeEnv === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
    : '*'
}));
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'client', 'dist')));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

// Get all simulations
app.get('/api/simulations', async (req, res) => {
  try {
    const simulations = await getSimulations(20);
    res.json(simulations);
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// Get single simulation
app.get('/api/simulation/:id', async (req, res) => {
  try {
    const simulation = await getSimulationById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json(simulation);
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

// Get budget status
app.get('/api/budget', async (req, res) => {
  try {
    const budget = await getDailyBudget();
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Run simulation
app.post('/api/simulate', async (req, res) => {
  try {
    const { topic, fingerprint } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Generate fingerprint
    const fingerprintHash = fingerprint || getFingerprintFromRequest(req);

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(fingerprintHash);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: rateLimitCheck.message
      });
    }

    // Check daily budget
    const budgetStatus = await getDailyBudget();
    if (budgetStatus.remaining <= 0) {
      return res.status(503).json({
        error: 'Daily budget exceeded',
        message: 'The daily budget has been reached. Please try again tomorrow.'
      });
    }

    // Generate unique ID
    const simulationId = nanoid(10);

    // Run simulation
    const result = await runNewsroomSimulation(topic, io);

    // Save to database
    const simulation = {
      id: simulationId,
      topic,
      progressive: result.progressive,
      conservative: result.conservative,
      tech: result.tech,
      cost: result.cost,
      fingerprint_hash: fingerprintHash
    };

    await saveSimulation(simulation);

    // Update rate limit
    await updateRateLimit(fingerprintHash);

    // Update budget
    await updateDailyBudget(result.cost);

    // Return result
    res.json({
      id: simulationId,
      topic,
      result,
      cost: result.cost
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Simulation failed', message: error.message });
  }
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   AI Newsroom Simulator - Backend     ║
╚════════════════════════════════════════╝

Server running on: http://localhost:${config.port}
Environment: ${config.nodeEnv}
Database: ${config.database.path}
Anthropic Key: ${config.anthropic.apiKey ? '✅ Connected' : '❌ Not configured'}

API Endpoints:
  GET  /api/health
  GET  /api/simulations
  GET  /api/simulation/:id
  GET  /api/budget
  POST /api/simulate

WebSocket: Ready for real-time updates
  `);
});

export default app;
