import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.USE_JSON_FALLBACK = 'true';
process.env.JWT_SECRET = 'test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.UPLOAD_DIR_OVERRIDE = join(tmpdir(), `smoke-uploads-${Date.now()}`);

let app: import('express').Express;
let token: string;
let slug: string;
let reviewId: number;

beforeAll(async () => {
  const { createApp } = await import('../src/app.js');
  app = createApp();
  const login = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'test-password-123' });
  token = login.body.token;
  const pkgs = await request(app).get('/api/packages');
  slug = pkgs.body[0].slug;
});

describe('reviews feature smoke test', () => {
  it('rejects review for nonexistent product', async () => {
    const res = await request(app).post('/api/reviews').send({
      item_type: 'package', item_slug: 'does-not-exist', customer_name: 'X', rating: 5, comment: null,
    });
    expect(res.status).toBe(404);
  });

  it('accepts a public review submission, unapproved by default', async () => {
    const res = await request(app).post('/api/reviews').send({
      item_type: 'package', item_slug: slug, customer_name: 'أحمد', rating: 9, comment: 'ممتاز جداً',
    });
    expect(res.status).toBe(201);
    expect(res.body.review.approved).toBe(false);
    reviewId = res.body.review.id;
  });

  it('does not show pending review in public list', async () => {
    const res = await request(app).get(`/api/reviews?item_type=package&item_slug=${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.find((r: any) => r.id === reviewId)).toBeUndefined();
  });

  it('blocks unauthenticated access to admin reviews list', async () => {
    const res = await request(app).get('/api/admin/reviews');
    expect(res.status).toBe(401);
  });

  it('shows pending review to admin', async () => {
    const res = await request(app).get('/api/admin/reviews').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const r = res.body.find((r: any) => r.id === reviewId);
    expect(r).toBeTruthy();
    expect(r.approved).toBe(false);
  });

  it('approves the review', async () => {
    const res = await request(app).put(`/api/admin/reviews/${reviewId}/approve`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('shows approved review in public list and updates package rating aggregate', async () => {
    const res = await request(app).get(`/api/reviews?item_type=package&item_slug=${slug}`);
    expect(res.body.find((r: any) => r.id === reviewId)).toBeTruthy();

    const pkg = await request(app).get(`/api/packages/${slug}`);
    expect(pkg.body.rating_value).toBe(9);
    expect(pkg.body.rating_count).toBe(1);
  });

  it('rejects out-of-range rating', async () => {
    const res = await request(app).post('/api/reviews').send({
      item_type: 'package', item_slug: slug, customer_name: 'Y', rating: 15, comment: null,
    });
    expect(res.status).toBe(400);
  });

  it('admin deletes the review and public/aggregate reflect it', async () => {
    const del = await request(app).delete(`/api/admin/reviews/${reviewId}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/reviews?item_type=package&item_slug=${slug}`);
    expect(after.body.find((r: any) => r.id === reviewId)).toBeUndefined();

    const pkg = await request(app).get(`/api/packages/${slug}`);
    expect(pkg.body.rating_value).toBeNull();
    expect(pkg.body.rating_count).toBe(0);
  });
});
