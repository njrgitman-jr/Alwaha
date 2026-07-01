import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { getAccessories, getApprovedReviews, getCategories, getPackages, getSettings, createReview } from '../store.js';

const router = Router();

// Pagination is opt-in: only kicks in when ?page is actually supplied,
// so the existing client (which expects a plain array) keeps working
// unchanged. Once the catalog grows, the client can switch to passing
// ?page=&pageSize= and start reading { items, total, page, pageSize }.
function paginate<T>(all: T[], req: import('express').Request) {
  const hasPage = typeof req.query.page === 'string';
  if (!hasPage) return all;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const start = (page - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
  };
}

router.get('/settings', async (_req, res) => {
  res.json(await getSettings());
});

router.get('/categories', async (_req, res) => {
  res.json(await getCategories());
});

router.get('/packages', async (req, res) => {
  const all = await getPackages();
  const cat = typeof req.query.category === 'string' ? req.query.category : null;
  const filtered = cat ? all.filter(p => p.category_slug === cat) : all;
  res.json(paginate(filtered, req));
});

router.get('/packages/:slug', async (req, res) => {
  const p = (await getPackages()).find(x => x.slug === req.params.slug);
  if (!p) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(p);
});

router.get('/accessories', async (req, res) => {
  const all = await getAccessories();
  const cat = typeof req.query.category === 'string' ? req.query.category : null;
  const filtered = cat ? all.filter(a => a.category_slug === cat) : all;
  res.json(paginate(filtered, req));
});

// ---- reviews ----

router.get('/reviews', async (req, res) => {
  const itemType = req.query.item_type;
  const slug = req.query.item_slug;
  if (itemType !== 'package' && itemType !== 'accessory') {
    return res.status(400).json({ error: 'item_type غير صالح' });
  }
  if (typeof slug !== 'string' || !slug) {
    return res.status(400).json({ error: 'item_slug مطلوب' });
  }
  res.json(await getApprovedReviews(itemType, slug));
});

// Reviews are public-write, so they're the one place on this router worth
// throttling harder than the general /api limiter — a handful per hour per
// IP is plenty for a real customer, not enough to spam the moderation queue.
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة جداً، حاول مرة أخرى لاحقاً' },
});

const ReviewSchema = z.object({
  item_type: z.enum(['package', 'accessory']),
  item_slug: z.string().min(1),
  customer_name: z.string().trim().min(1, 'الاسم مطلوب').max(100),
  rating: z.number().min(1).max(10),
  comment: z.string().trim().max(1000).nullable().optional(),
});

router.post('/reviews', reviewLimiter, async (req, res) => {
  const parsed = ReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' });

  const { item_type, item_slug } = parsed.data;
  const exists = item_type === 'package'
    ? (await getPackages({ includeHidden: true })).some(p => p.slug === item_slug)
    : (await getAccessories({ includeHidden: true })).some(a => a.slug === item_slug);
  if (!exists) return res.status(404).json({ error: 'المنتج غير موجود' });

  const review = await createReview({
    item_type, item_slug,
    customer_name: parsed.data.customer_name,
    rating: parsed.data.rating,
    comment: parsed.data.comment?.trim() || null,
  });
  res.status(201).json({ ok: true, review });
});

export default router;
