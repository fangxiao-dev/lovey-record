import express from 'express';

const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Routes will be mounted here in later phases

export default app;
