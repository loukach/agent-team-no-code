import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Anthropic Claude Agent SDK configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'sonnet', // Agent SDK uses simple model names (sonnet, opus, haiku)
    maxTurns: parseInt(process.env.MAX_TURNS) || 5, // Increased for web research
    maxBudgetPerAgent: parseFloat(process.env.MAX_BUDGET_PER_AGENT) || 0.10, // Increased for web search
  },

  // Budget controls
  budget: {
    dailyLimit: parseFloat(process.env.DAILY_BUDGET) || 2.00, // Increased for web research
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || join(__dirname, '..', 'data', 'simulations.db'),
  },

  // Rate limiting
  rateLimit: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 1,
  },
};
