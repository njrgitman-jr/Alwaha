import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../auth.js';
import {
  deleteAccessory, deleteCategory, deletePackage,
  getAccessories, getCategories, getPackages, getSettings,
  findAdminByUsername, updateAdminPassword,
  updateSettings, upsertAccessory, upsertCategory, upsertPackage,
} from '../store.js';
import { useJsonFallback } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = join(__dirname, '..', '..', 'public', 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = (extname(file.originalname) || '.bin').toLowerCase();
      cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مدعوم - يرجى رفع صورة'));
  },
});

const router = Router();
router.use(requireAuth);

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
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم تحميل ملف' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
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
