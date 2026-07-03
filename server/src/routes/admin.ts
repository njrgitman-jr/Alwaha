import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { requireAuth } from '../auth.js';
import { auditLog } from '../auditLog.js';
import {
  deleteAccessory, deleteCategory, deletePackage,
  getAccessories, getCategories, getPackages, getSettings,
  findAdminByUsername, updateAdminPassword,
  updateSettings, upsertAccessory, upsertCategory, upsertPackage,
  getAllReviews, approveReview, deleteReview,
} from '../store.js';
import { useJsonFallback } from '../db.js';
import { saveImage } from '../imageStore.js';

// SVG is deliberately NOT allowed: it's XML and can carry embedded
// <script>, making it a stored-XSS vector once served back from
// /uploads. Raster formats only.
const ALLOWED_EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Use memory storage so we can sniff the real file content (magic
// bytes) before anything touches disk. Trusting the client-supplied
// `mimetype`/extension alone (the previous approach) is spoofable —
// a renamed/relabeled malicious file would have sailed through.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const router = Router();
router.use(requireAuth);
router.use(auditLog);

// ---- categories ----
const CategorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'يجب أن يحوي أحرف إنجليزية صغيرة وأرقام و - فقط'),
  title: z.string().min(1),
  description: z.string().default(''),
  icon: z.string().default('💧'),
  image_url: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

router.get('/categories', async (_req, res) => res.json(await getCategories({ includeHidden: true })));
router.put('/categories/:slug', async (req, res) => {
  const parsed = CategorySchema.safeParse({ ...req.body, slug: req.params.slug });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  await upsertCategory({ ...parsed.data, image_url: parsed.data.image_url ?? null });
  res.json({ ok: true });
});
router.delete('/categories/:slug', async (req, res) => {
  await deleteCategory(req.params.slug);
  res.json({ ok: true });
});

// ---- packages ----
const PackageSchema = z.object({
  slug: z.string().min(1),
  category_slug: z.string().min(1),
  name: z.string().min(1),
  price_new: z.number().nonnegative(),
  price_old: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('JD'),
  badge: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  components: z.array(z.string()).default([]),
  gifts: z.array(z.string()).default([]),
  display_order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

router.get('/packages', async (_req, res) => res.json(await getPackages({ includeHidden: true })));
router.put('/packages/:slug', async (req, res) => {
  const parsed = PackageSchema.safeParse({ ...req.body, slug: req.params.slug });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  await upsertPackage({
    ...parsed.data,
    price_old: parsed.data.price_old ?? null,
    badge: parsed.data.badge ?? null,
    warranty: parsed.data.warranty ?? null,
    image_url: parsed.data.image_url ?? null,
  });
  res.json({ ok: true });
});
router.delete('/packages/:slug', async (req, res) => {
  await deletePackage(req.params.slug);
  res.json({ ok: true });
});

// ---- accessories ----
const AccessorySchema = z.object({
  slug: z.string().min(1),
  category_slug: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().default('JD'),
  note: z.string().nullable().optional(),
  free_shipping: z.boolean().default(false),
  image_url: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

router.get('/accessories', async (_req, res) => res.json(await getAccessories({ includeHidden: true })));
router.put('/accessories/:slug', async (req, res) => {
  const parsed = AccessorySchema.safeParse({ ...req.body, slug: req.params.slug });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  await upsertAccessory({
    ...parsed.data,
    note: parsed.data.note ?? null,
    image_url: parsed.data.image_url ?? null,
  });
  res.json({ ok: true });
});
router.delete('/accessories/:slug', async (req, res) => {
  await deleteAccessory(req.params.slug);
  res.json({ ok: true });
});

// ---- settings ----
router.get('/settings', async (_req, res) => res.json(await getSettings()));
router.put('/settings', async (req, res) => {
  const parsed = z.record(z.string(), z.string()).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  await updateSettings(parsed.data);
  res.json({ ok: true });
});

// ---- upload ----
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم تحميل ملف' });

  // Sniff the actual bytes — the client-supplied mimetype/extension is
  // not trustworthy on its own.
  const detected = await fileTypeFromBuffer(req.file.buffer);
  if (!detected || !ALLOWED_EXT_BY_MIME[detected.mime]) {
    return res.status(400).json({ error: 'نوع الملف غير مدعوم - يرجى رفع صورة (PNG, JPG, WEBP, GIF)' });
  }

  // Re-encode through sharp rather than storing the uploaded bytes
  // as-is. This: (1) caps dimensions so a 12MP phone photo doesn't
  // ship to every visitor, (2) recompresses to a sane size budget,
  // (3) converts everything to .webp for consistent, small output,
  // and (4) strips EXIF/metadata, which incidentally also discards
  // any non-image data smuggled inside image metadata fields.
  let optimized: Buffer;
  try {
    optimized = await sharp(req.file.buffer)
      .rotate() // respect EXIF orientation before stripping metadata
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return res.status(400).json({ error: 'فشل معالجة الصورة - الملف قد يكون تالفاً' });
  }

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  try {
    await saveImage(filename, 'image/webp', optimized);
  } catch {
    return res.status(500).json({ error: 'فشل حفظ الملف' });
  }

  const url = `/uploads/${filename}`;
  res.json({ url, filename });
});

// ---- reviews (moderation) ----
router.get('/reviews', async (_req, res) => res.json(await getAllReviews()));
router.put('/reviews/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id غير صالح' });
  await approveReview(id);
  res.json({ ok: true });
});
router.delete('/reviews/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id غير صالح' });
  await deleteReview(id);
  res.json({ ok: true });
});

// ---- change password ----
router.post('/change-password', async (req, res) => {
  if (useJsonFallback()) {
    return res.status(400).json({
      error: 'تغيير كلمة المرور غير متاح في الوضع التجريبي (JSON). فعّل قاعدة البيانات أولاً.',
    });
  }
  const schema = z.object({ current: z.string().min(1), next: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  const username = req.admin?.username;
  if (!username) return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
  const admin = await findAdminByUsername(username);
  if (!admin) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const ok = await bcrypt.compare(parsed.data.current, admin.password_hash);
  if (!ok) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  const hash = await bcrypt.hash(parsed.data.next, 10);
  await updateAdminPassword(username, hash);
  res.json({ ok: true });
});

export default router;
