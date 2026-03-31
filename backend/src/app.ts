import express from 'express';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import commandRoutes from './routes/commands';
import queryRoutes from './routes/queries';
import devRoutes from './routes/dev';

const app = express();

const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = new Set(rawOrigins.split(',').map(s => s.trim()));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-wx-openid');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());

// Health check (public, no auth required)
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Dev-only routes (public, no auth required, unavailable in production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

// Auth middleware — attach user from x-wx-openid header for all routes below
app.use(authMiddleware);

app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

// Error handler — must be last middleware
app.use(errorHandler);

export default app;
