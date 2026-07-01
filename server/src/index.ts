import 'dotenv/config';
import { createApp } from './app.js';
import { useJsonFallback } from './db.js';

// ---- Fail fast on missing/weak secrets ----
// A silent fallback to a hardcoded dev secret is a real production risk:
// it lets the server boot "successfully" while issuing forgeable JWTs.
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('✗ JWT_SECRET is missing or too short (need 32+ random chars). Refusing to start.');
  process.exit(1);
}

if (!useJsonFallback()) {
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.startsWith('__')) {
    console.error('✗ USE_JSON_FALLBACK=false but DB_PASSWORD is missing/placeholder. Refusing to start.');
    process.exit(1);
  }
}

if (IS_PROD && (process.env.ADMIN_PASSWORD === 'admin123' || !process.env.ADMIN_PASSWORD)) {
  console.error('✗ ADMIN_PASSWORD is missing or still the default ("admin123") in production. Refusing to start.');
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`✓ Server listening on http://localhost:${PORT}`);
  console.log(`  Mode: ${useJsonFallback() ? 'JSON fallback (no DB needed)' : 'SQL Server via Knex'}`);
});
