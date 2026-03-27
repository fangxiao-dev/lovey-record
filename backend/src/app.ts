import express from 'express';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import commandRoutes from './routes/commands';
import queryRoutes from './routes/queries';

const app = express();

app.use(express.json());

// Health check (public, no auth required)
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Auth middleware — attach user from x-wx-openid header for all routes below
app.use(authMiddleware);

app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

// Error handler — must be last middleware
app.use(errorHandler);

export default app;
