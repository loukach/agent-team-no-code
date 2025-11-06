import initSqlJs from 'sql.js';
import { config } from './config.js';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import crypto from 'crypto';

// Ensure data directory exists
try {
  mkdirSync(dirname(config.database.path), { recursive: true });
} catch (err) {
  // Directory already exists
}

// Initialize sql.js
let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  // Try to load existing database file
  let data;
  try {
    data = readFileSync(config.database.path);
  } catch (err) {
    // New database
    data = null;
  }

  if (data) {
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  // Initialize database schema
  db.run(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      topic TEXT NOT NULL,
      progressive_headline TEXT,
      progressive_story TEXT,
      conservative_headline TEXT,
      conservative_story TEXT,
      tech_headline TEXT,
      tech_story TEXT,
      cost REAL DEFAULT 0,
      fingerprint_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      fingerprint_hash TEXT PRIMARY KEY,
      last_run_at INTEGER,
      run_count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS budget_tracking (
      date TEXT PRIMARY KEY,
      total_cost REAL DEFAULT 0,
      simulation_count INTEGER DEFAULT 0
    );
  `);

  return db;
}

// Initialize database immediately
const dbPromise = initDb();

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(config.database.path, buffer);
  }
}

export async function ensureDb() {
  if (!db) {
    db = await dbPromise;
  }
  return db;
}

export async function saveSimulation(simulation) {
  await ensureDb();

  try {
    db.run(`
      INSERT INTO simulations (
        id, topic, progressive_headline, progressive_story,
        conservative_headline, conservative_story,
        tech_headline, tech_story, cost, fingerprint_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      simulation.id,
      simulation.topic,
      simulation.progressive.headline,
      simulation.progressive.story,
      simulation.conservative.headline,
      simulation.conservative.story,
      simulation.tech.headline,
      simulation.tech.story,
      simulation.cost,
      simulation.fingerprint_hash
    ]);
    saveDb();
  } catch (error) {
    console.error('Error saving simulation:', error);
  }
}

export async function getSimulations(limit = 20) {
  await ensureDb();

  try {
    const stmt = db.prepare(`
      SELECT * FROM simulations
      ORDER BY created_at DESC
      LIMIT ?
    `);
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Error getting simulations:', error);
    return [];
  }
}

export async function getSimulationById(id) {
  await ensureDb();

  try {
    const stmt = db.prepare('SELECT * FROM simulations WHERE id = ?');
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  } catch (error) {
    console.error('Error getting simulation:', error);
    return null;
  }
}

export async function checkRateLimit(fingerprintHash) {
  await ensureDb();

  try {
    const stmt = db.prepare('SELECT * FROM rate_limits WHERE fingerprint_hash = ?');
    stmt.bind([fingerprintHash]);
    let record = null;
    if (stmt.step()) {
      record = stmt.getAsObject();
    }
    stmt.free();

    if (!record) {
      return { allowed: true, remaining: 1 };
    }

    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastRun = now - record.last_run_at;
    const windowSeconds = config.rateLimit.windowMs / 1000;

    if (timeSinceLastRun < windowSeconds) {
      const remainingSeconds = windowSeconds - timeSinceLastRun;
      return {
        allowed: false,
        remainingSeconds,
        message: `You can run another simulation in ${Math.ceil(remainingSeconds / 3600)} hours`
      };
    }

    return { allowed: true, remaining: 1 };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, remaining: 1 };
  }
}

export async function updateRateLimit(fingerprintHash) {
  await ensureDb();

  try {
    const now = Math.floor(Date.now() / 1000);
    db.run(`
      INSERT INTO rate_limits (fingerprint_hash, last_run_at, run_count)
      VALUES (?, ?, 1)
    `, [fingerprintHash, now]);
    saveDb();
  } catch (error) {
    // Handle duplicate key - update instead
    try {
      const now = Math.floor(Date.now() / 1000);
      db.run(`
        UPDATE rate_limits SET last_run_at = ?, run_count = run_count + 1
        WHERE fingerprint_hash = ?
      `, [now, fingerprintHash]);
      saveDb();
    } catch (err) {
      console.error('Error updating rate limit:', err);
    }
  }
}

export async function getDailyBudget() {
  await ensureDb();

  try {
    const today = new Date().toISOString().split('T')[0];
    const stmt = db.prepare('SELECT * FROM budget_tracking WHERE date = ?');
    stmt.bind([today]);
    let record = null;
    if (stmt.step()) {
      record = stmt.getAsObject();
    }
    stmt.free();

    return {
      date: today,
      totalCost: record?.total_cost || 0,
      simulationCount: record?.simulation_count || 0,
      remaining: config.budget.dailyLimit - (record?.total_cost || 0)
    };
  } catch (error) {
    console.error('Error getting daily budget:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      totalCost: 0,
      simulationCount: 0,
      remaining: config.budget.dailyLimit
    };
  }
}

export async function updateDailyBudget(cost) {
  await ensureDb();

  try {
    const today = new Date().toISOString().split('T')[0];
    db.run(`
      INSERT INTO budget_tracking (date, total_cost, simulation_count)
      VALUES (?, ?, 1)
    `, [today, cost]);
    saveDb();
  } catch (error) {
    // Handle duplicate key - update instead
    try {
      const today = new Date().toISOString().split('T')[0];
      db.run(`
        UPDATE budget_tracking
        SET total_cost = total_cost + ?, simulation_count = simulation_count + 1
        WHERE date = ?
      `, [cost, today]);
      saveDb();
    } catch (err) {
      console.error('Error updating daily budget:', err);
    }
  }
}

export default { ensureDb };
