import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Request, Response, NextFunction } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = join(__dirname, '..', 'logs');
const LOG_PATH = join(LOG_DIR, 'admin-audit.log');

async function ensureLogDir() {
  if (!existsSync(LOG_DIR)) await mkdir(LOG_DIR, { recursive: true });
}

// Records who changed what, when, and the outcome. Append-only, one JSON
// line per action — easy to grep/ship to a log aggregator later.
export function auditLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    // Only log actual writes; GETs are noise here (morgan covers those).
    if (req.method === 'GET') return;
    const entry = {
      ts: new Date().toISOString(),
      admin: req.admin?.username ?? 'unknown',
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
      ip: req.ip,
    };
    ensureLogDir()
      .then(() => appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8'))
      .catch(e => console.error('[audit log error]', e));
  });
  next();
}
