import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { useJsonFallback } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp() {
  const NODE_ENV = process.env.NODE_ENV ?? 'development';
  const IS_PROD = NODE_ENV === 'production';

  const app = express();
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

  const allowedOrigins = IS_PROD
    ? [CLIENT_ORIGIN]
    : [
        CLIENT_ORIGIN,
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175',
      ];

  app.use(helmet());
  app.use(morgan(IS_PROD ? 'combined' : 'dev', {
    skip: () => process.env.NODE_ENV === 'test',
  }));
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '2mb' }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', generalLimiter);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'محاولات تسجيل دخول كثيرة جداً، حاول مرة أخرى بعد قليل' },
  });
  app.use('/api/auth/login', loginLimiter);

  app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads'), {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }));

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

  return app;
}