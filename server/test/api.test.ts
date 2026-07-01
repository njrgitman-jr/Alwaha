import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Force a safe, deterministic test environment before importing the app:
// JSON-fallback mode (no SQL Server needed) with a fixed admin login.
process.env.NODE_ENV = 'test';
process.env.USE_JSON_FALLBACK = 'true';
process.env.JWT_SECRET = 'test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.UPLOAD_DIR_OVERRIDE = join(tmpdir(), `alwaha-test-uploads-${Date.now()}`);

let app: import('express').Express;

beforeAll(async () => {
  const { createApp } = await import('../src/app.js');
  app = createApp();
});

describe('public API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mode).toBe('json-fallback');
  });

  it('GET /api/categories returns a list', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/packages returns a list', async () => {
    const res = await request(app).get('/api/packages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/packages/:slug 404s for an unknown slug', async () => {
    const res = await request(app).get('/api/packages/does-not-exist-xyz');
    expect(res.status).toBe(404);
  });

  it('GET /api/settings returns an object', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
  });
});

describe('auth', () => {
  it('rejects bad credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'test-password-123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });
});

describe('admin routes require auth', () => {
  it('rejects unauthenticated access to admin packages', async () => {
    const res = await request(app).get('/api/admin/packages');
    expect(res.status).toBe(401);
  });

  it('allows access with a valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'test-password-123' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/packages')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('image upload pipeline', () => {
  it('rejects non-image files even with a spoofed extension', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'test-password-123' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/admin/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not actually an image'), 'fake.png');
    expect(res.status).toBe(400);
  });

  it('accepts a real PNG and re-encodes it to webp', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'test-password-123' });
    const token = login.body.token;

    // 1x1 transparent PNG
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const png = Buffer.from(pngBase64, 'base64');

    const res = await request(app)
      .post('/api/admin/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', png, 'tiny.png');

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\.webp$/);
  });
});

describe('pagination (opt-in, backward compatible)', () => {
  it('returns a plain array when no ?page is given', async () => {
    const res = await request(app).get('/api/packages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns a paginated envelope when ?page is given', async () => {
    const res = await request(app).get('/api/packages?page=1&pageSize=2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(2);
    expect(res.body.items.length).toBeLessThanOrEqual(2);
  });
});
