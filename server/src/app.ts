import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { useJsonFallback } from './db.js';
import { getImage } from './imageStore.js';

export function createApp() {
  const NODE_ENV = process.env.NODE_ENV ?? 'development';
  const IS_PROD = NODE_ENV === 'production';

  const app = express();
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

  // Render (and most PaaS hosts) sit behind a reverse proxy, so Express needs
  // to trust the X-Forwarded-For header it sets — otherwise express-rate-limit
  // can't tell real client IPs apart and throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  if (IS_PROD) app.set('trust proxy', 1);

  // CLIENT_ORIGIN can be a single URL or a comma-separated list, so staging +
  // production (and any other known frontend URL) can all be allowed without
  // juggling one env var every time a new one shows up.
  const explicitOrigins = CLIENT_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

  const allowedOrigins = IS_PROD
    ? explicitOrigins
    : [
        ...explicitOrigins,
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175',
      ];

  app.use(helmet());
  app.use(morgan(IS_PROD ? 'combined' : 'dev', {
    skip: () => process.env.NODE_ENV === 'test',
  }));
  app.use(cors({
    origin(origin, callback) {
      // Same-origin / non-browser requests (curl, server-to-server) send no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In production, also allow any Vercel preview/staging deployment whose
      // URL starts with this project's name (e.g. alwaha.vercel.app,
      // alwaha-staging.vercel.app, alwaha-git-<branch>-<user>.vercel.app),
      // so new preview URLs don't require an env var update each time —
      // without opening this up to unrelated Vercel-hosted sites.
      if (IS_PROD && /^https:\/\/alwaha[a-z0-9-]*\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  }));
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

  // Images are stored in the DB (see src/imageStore.ts), not on local disk —
  // Render's filesystem is ephemeral and wipes public/uploads on every
  // redeploy/restart. This route keeps the same /uploads/<filename> URL
  // shape the client already expects, but streams bytes from the DB.
  app.get('/uploads/:filename', async (req, res) => {
    try {
      const image = await getImage(req.params.filename);
      if (!image) return res.status(404).end();
      res.setHeader('Content-Type', image.mime);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(image.data);
    } catch (err) {
      console.error('[image serve error]', err);
      res.status(500).end();
    }
  });

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