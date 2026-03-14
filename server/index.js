import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import milestoneRoutes from './routes/milestones.js';
import submissionRoutes from './routes/submissions.js';
import escrowRoutes from './routes/escrow.js';
import pfiRoutes from './routes/pfi.js';
import { startDeadlineEnforcer } from './services/deadlineEnforcer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/pfi', pfiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Resolve mongodb+srv:// to direct mongodb:// using DNS-over-HTTPS.
 * This bypasses local DNS issues (e.g. university/corporate networks
 * blocking MongoDB Atlas SRV records).
 */
async function resolveSrvUri(srvUri) {
  if (!srvUri.startsWith('mongodb+srv://')) return srvUri;

  const url = new URL(srvUri.replace('mongodb+srv://', 'https://'));
  const srvHost = url.hostname;
  const dbPath = url.pathname || '/';
  const existingParams = url.search ? url.search.slice(1) : '';

  // Resolve SRV records via Google DNS-over-HTTPS
  const srvRes = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${srvHost}&type=SRV`).then(r => r.json());
  if (!srvRes.Answer) throw new Error(`No SRV records found for ${srvHost}`);

  const hosts = srvRes.Answer
    .filter(a => a.type === 33)
    .map(a => { const p = a.data.split(' '); return `${p[3].replace(/\.$/, '')}:${p[2]}`; })
    .join(',');

  // Resolve TXT records (contains authSource, replicaSet, etc.)
  const txtRes = await fetch(`https://dns.google/resolve?name=${srvHost}&type=TXT`).then(r => r.json());
  const txtParams = txtRes.Answer
    ?.filter(a => a.type === 16)
    .map(a => a.data.replace(/"/g, ''))
    .join('&') || '';

  // Build params — merge TXT params with existing URI params, add tls=true
  const allParams = ['tls=true', txtParams, existingParams].filter(Boolean).join('&');
  const auth = url.username ? `${url.username}:${url.password}@` : '';
  const directUri = `mongodb://${auth}${hosts}${dbPath}?${allParams}`;

  console.log(`🔗 Resolved SRV → direct connection (${srvRes.Answer.filter(a => a.type === 33).length} hosts)`);
  return directUri;
}

// MongoDB Connection
(async () => {
  try {
    const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autonomous-agent';
    const uri = await resolveSrvUri(rawUri);
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
    startDeadlineEnforcer();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB error:', err);
  }
})();

