import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { useJsonFallback } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

app.use(cors({
  origin: [
    CLIENT_ORIGIN,
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
    'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175',
  ],
}));
app.use(express.json({ limit: '2mb' }));

// Serve uploaded images
app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: useJsonFallback() ? 'json-fallback' : 'sql-server' });
});

app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server error]', err);
  const msg = typeof err?.message === 'string' ? err.message : 'حدث خطأ في الخادم';
  res.status(err?.status ?? 500).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log(`  Mode: ${useJsonFallback() ? 'JSON fallback (no DB needed)' : 'SQL Server via Knex'}`);
});
