import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initScheduledJobs } from './jobs/scheduler.js';

import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import worldRoutes from './routes/worldRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import growthRoutes from './routes/growthRoutes.js';
import surpriseRoutes from './routes/surpriseRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'iPET: An Interactive Emotional Companion Dialogue System (ACL 2025)',
    timestamp: new Date().toISOString()
  });
});

// Register Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/surprises', surpriseRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/roadmap', roadmapRoutes);

// Connect DB & start server
async function startServer() {
  await connectDB();
  initScheduledJobs();

  app.listen(PORT, () => {
    console.log(`🚀 iPET Backend Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
