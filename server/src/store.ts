// Unified data store: either reads/writes SQL Server via Knex, or reads/writes
// db/seed-data.json (runtime copy at db/runtime-data.json) for offline mode.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb, useJsonFallback } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_PATH = join(__dirname, '..', 'db', 'seed-data.json');
const RUNTIME_PATH = join(__dirname, '..', 'db', 'runtime-data.json');

type Settings = Record<string, string>;

export type Category = {
  slug: string; title: string; description: string; icon: string;
  image_url: string | null;
  display_order: number; visible: boolean;
};

export type Package = {
  slug: string; category_slug: string; name: string;
  price_new: number; price_old: number | null; currency: string;
  badge: string | null; warranty: string | null;
  image_url: string | null;
  components: string[]; gifts: string[];
  display_order: number; visible: boolean;
  rating_value?: number | null; rating_count?: number;
};

export type Accessory = {
  slug: string; category_slug: string; name: string;
  price: number; currency: string;
  note: string | null; free_shipping: boolean;
  image_url: string | null;
  display_order: number; visible: boolean;
  rating_value?: number | null; rating_count?: number;
};

export type Review = {
  id: number;
  item_type: 'package' | 'accessory';
  item_slug: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  created_at: string | Date;
};

type JsonShape = {
  settings: Settings;
  categories: Category[];
  packages: Array<{
    slug: string; category_slug: string; name: string;
    price_new: number; price_old?: number | null; currency: string;
    badge?: string | null; warranty: string;
    image_url?: string | null;
    components: string[]; gifts: string[];
    display_order: number; visible: boolean;
  }>;
  accessories: Array<{
    slug: string; category_slug: string; name: string;
    price: number; currency: string;
    note?: string | null; free_shipping: boolean;
    image_url?: string | null;
    display_order: number; visible: boolean;
  }>;
  reviews?: Review[];
};

async function loadJson(): Promise<JsonShape> {
  const path = existsSync(RUNTIME_PATH) ? RUNTIME_PATH : SEED_PATH;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw);
}

async function saveJson(data: JsonShape) {
  await writeFile(RUNTIME_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Builds a slug -> {avg, count} map from *approved* reviews only, so a
// flood of pending/unmoderated reviews can't move the displayed rating.
function ratingMapFromReviews(reviews: Review[], itemType: 'package' | 'accessory'): Map<string, { avg: number; count: number }> {
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    if (r.item_type !== itemType || !r.approved) continue;
    const cur = map.get(r.item_slug) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating);
    cur.count += 1;
    map.set(r.item_slug, cur);
  }
  const out = new Map<string, { avg: number; count: number }>();
  for (const [slug, { sum, count }] of map) out.set(slug, { avg: Math.round((sum / count) * 10) / 10, count });
  return out;
}

async function ratingMapFromDb(itemType: 'package' | 'accessory'): Promise<Map<string, { avg: number; count: number }>> {
  const rows = await getDb()('reviews')
    .where({ item_type: itemType, approved: true })
    .groupBy('item_slug')
    .select('item_slug')
    .avg({ avg_rating: 'rating' })
    .count({ cnt: 'rating' });
  const out = new Map<string, { avg: number; count: number }>();
  for (const r of rows as any[]) {
    out.set(r.item_slug, { avg: Math.round(Number(r.avg_rating) * 10) / 10, count: Number(r.cnt) });
  }
  return out;
}

// ---------- SETTINGS ----------

export async function getSettings(): Promise<Settings> {
  if (useJsonFallback()) return (await loadJson()).settings;
  const rows = await getDb()<{ key: string; value: string }>('site_settings').select('key', 'value');
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function updateSettings(updates: Settings) {
  if (useJsonFallback()) {
    const data = await loadJson();
    data.settings = { ...data.settings, ...updates };
    await saveJson(data);
    return;
  }
  for (const [key, value] of Object.entries(updates)) {
    const exists = await getDb()('site_settings').where({ key }).first();
    if (exists) await getDb()('site_settings').where({ key }).update({ value, updated_at: new Date() });
    else await getDb()('site_settings').insert({ key, value });
  }
}

// ---------- CATEGORIES ----------

export async function getCategories(opts?: { includeHidden?: boolean }): Promise<Category[]> {
  if (useJsonFallback()) {
    const cats = (await loadJson()).categories.map(c => ({ ...c, image_url: c.image_url ?? null }));
    const filtered = opts?.includeHidden ? cats : cats.filter(c => c.visible);
    return filtered.sort((a, b) => a.display_order - b.display_order);
  }
  let q = getDb()<Category>('categories').orderBy('display_order');
  if (!opts?.includeHidden) q = q.where('visible', true);
  return q;
}

export async function upsertCategory(c: Category) {
  if (useJsonFallback()) {
    const data = await loadJson();
    const idx = data.categories.findIndex(x => x.slug === c.slug);
    if (idx >= 0) data.categories[idx] = c; else data.categories.push(c);
    await saveJson(data);
    return;
  }
  const row = { ...c, updated_at: new Date() };
  const exists = await getDb()('categories').where({ slug: c.slug }).first();
  if (exists) await getDb()('categories').where({ slug: c.slug }).update(row);
  else await getDb()('categories').insert(row);
}

export async function deleteCategory(slug: string) {
  if (useJsonFallback()) {
    const data = await loadJson();
    const inUse =
      data.packages.some(p => p.category_slug === slug) ||
      data.accessories.some(a => a.category_slug === slug);
    if (inUse) {
      const err: any = new Error('لا يمكن حذف هذا التصنيف لأنه يحتوي على منتجات أو ملحقات. احذفها أو نقلها أولاً');
      err.status = 409;
      throw err;
    }
    data.categories = data.categories.filter(c => c.slug !== slug);
    await saveJson(data);
    return;
  }
  try {
    await getDb()('categories').where({ slug }).del();
  } catch (e: any) {
    // mssql FK violation -> friendly message instead of raw SQL error
    if (e?.number === 547 || /REFERENCE constraint/i.test(e?.message ?? '')) {
      const err: any = new Error('لا يمكن حذف هذا التصنيف لأنه يحتوي على منتجات أو ملحقات. احذفها أو نقلها أولاً');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

// ---------- PACKAGES ----------

export async function getPackages(opts?: { includeHidden?: boolean }): Promise<Package[]> {
  if (useJsonFallback()) {
    const data = await loadJson();
    const ratingMap = ratingMapFromReviews(data.reviews ?? [], 'package');
    const all = data.packages.map(p => ({
      slug: p.slug, category_slug: p.category_slug, name: p.name,
      price_new: p.price_new, price_old: p.price_old ?? null, currency: p.currency,
      badge: p.badge ?? null, warranty: p.warranty ?? null,
      image_url: p.image_url ?? null,
      components: p.components ?? [], gifts: p.gifts ?? [],
      display_order: p.display_order, visible: p.visible,
      rating_value: ratingMap.get(p.slug)?.avg ?? null,
      rating_count: ratingMap.get(p.slug)?.count ?? 0,
    }));
    const filtered = opts?.includeHidden ? all : all.filter(p => p.visible);
    return filtered.sort((a, b) => a.display_order - b.display_order);
  }
  let q = getDb()('packages').orderBy('display_order');
  if (!opts?.includeHidden) q = q.where('visible', true);
  const [rows, ratingMap] = await Promise.all([q, ratingMapFromDb('package')]);
  return rows.map((r: any) => ({
    ...r,
    components: r.components_json ? JSON.parse(r.components_json) : [],
    gifts: r.gifts_json ? JSON.parse(r.gifts_json) : [],
    rating_value: ratingMap.get(r.slug)?.avg ?? null,
    rating_count: ratingMap.get(r.slug)?.count ?? 0,
  })) as Package[];
}

export async function upsertPackage(p: Package) {
  if (useJsonFallback()) {
    const data = await loadJson();
    const idx = data.packages.findIndex(x => x.slug === p.slug);
    const record = {
      slug: p.slug, category_slug: p.category_slug, name: p.name,
      price_new: p.price_new, price_old: p.price_old, currency: p.currency,
      badge: p.badge, warranty: p.warranty ?? '',
      image_url: p.image_url ?? null,
      components: p.components, gifts: p.gifts,
      display_order: p.display_order, visible: p.visible,
    };
    if (idx >= 0) data.packages[idx] = record; else data.packages.push(record);
    await saveJson(data);
    return;
  }
  const row = {
    slug: p.slug, category_slug: p.category_slug, name: p.name,
    price_new: p.price_new, price_old: p.price_old, currency: p.currency,
    badge: p.badge, warranty: p.warranty,
    image_url: p.image_url,
    components_json: JSON.stringify(p.components ?? []),
    gifts_json: JSON.stringify(p.gifts ?? []),
    display_order: p.display_order, visible: p.visible,
    updated_at: new Date(),
  };
  const exists = await getDb()('packages').where({ slug: p.slug }).first();
  if (exists) await getDb()('packages').where({ slug: p.slug }).update(row);
  else await getDb()('packages').insert(row);
}

export async function deletePackage(slug: string) {
  if (useJsonFallback()) {
    const data = await loadJson();
    data.packages = data.packages.filter(p => p.slug !== slug);
    await saveJson(data);
    return;
  }
  await getDb()('packages').where({ slug }).del();
}

// ---------- ACCESSORIES ----------

export async function getAccessories(opts?: { includeHidden?: boolean }): Promise<Accessory[]> {
  if (useJsonFallback()) {
    const data = await loadJson();
    const ratingMap = ratingMapFromReviews(data.reviews ?? [], 'accessory');
    const all = data.accessories
      .map(a => ({
        ...a, note: a.note ?? null, image_url: a.image_url ?? null,
        rating_value: ratingMap.get(a.slug)?.avg ?? null,
        rating_count: ratingMap.get(a.slug)?.count ?? 0,
      }));
    const filtered = opts?.includeHidden ? all : all.filter(a => a.visible);
    return filtered.sort((a, b) => a.display_order - b.display_order);
  }
  let q = getDb()<Accessory>('accessories').orderBy('display_order');
  if (!opts?.includeHidden) q = q.where('visible', true);
  const [rows, ratingMap] = await Promise.all([q, ratingMapFromDb('accessory')]);
  return rows.map(r => ({
    ...r,
    rating_value: ratingMap.get(r.slug)?.avg ?? null,
    rating_count: ratingMap.get(r.slug)?.count ?? 0,
  }));
}

export async function upsertAccessory(a: Accessory) {
  if (useJsonFallback()) {
    const data = await loadJson();
    const idx = data.accessories.findIndex(x => x.slug === a.slug);
    if (idx >= 0) data.accessories[idx] = a; else data.accessories.push(a);
    await saveJson(data);
    return;
  }
  const row = { ...a, updated_at: new Date() };
  const exists = await getDb()('accessories').where({ slug: a.slug }).first();
  if (exists) await getDb()('accessories').where({ slug: a.slug }).update(row);
  else await getDb()('accessories').insert(row);
}

export async function deleteAccessory(slug: string) {
  if (useJsonFallback()) {
    const data = await loadJson();
    data.accessories = data.accessories.filter(a => a.slug !== slug);
    await saveJson(data);
    return;
  }
  await getDb()('accessories').where({ slug }).del();
}

// ---------- ADMIN AUTH ----------

export async function findAdminByUsername(username: string): Promise<{ id: number; username: string; password_hash: string } | null> {
  if (useJsonFallback()) return null; // handled in routes/auth via env
  const row = await getDb()('admin_users').where({ username }).first();
  return row ?? null;
}

export async function updateAdminPassword(username: string, newPasswordHash: string): Promise<boolean> {
  if (useJsonFallback()) return false; // not supported in fallback mode (env-driven)
  const n = await getDb()('admin_users').where({ username }).update({ password_hash: newPasswordHash });
  return n > 0;
}

// ---------- REVIEWS ----------

export async function getApprovedReviews(itemType: 'package' | 'accessory', slug: string): Promise<Review[]> {
  if (useJsonFallback()) {
    const data = await loadJson();
    return (data.reviews ?? [])
      .filter(r => r.item_type === itemType && r.item_slug === slug && r.approved)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return getDb()<Review>('reviews')
    .where({ item_type: itemType, item_slug: slug, approved: true })
    .orderBy('created_at', 'desc');
}

// Admin view: everything, pending included, newest first.
export async function getAllReviews(): Promise<Review[]> {
  if (useJsonFallback()) {
    const data = await loadJson();
    return [...(data.reviews ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return getDb()<Review>('reviews').orderBy('created_at', 'desc');
}

export async function createReview(input: {
  item_type: 'package' | 'accessory'; item_slug: string;
  customer_name: string; rating: number; comment: string | null;
}): Promise<Review> {
  if (useJsonFallback()) {
    const data = await loadJson();
    const existingIds = (data.reviews ?? []).map(r => r.id);
    const nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1;
    const row: Review = { id: nextId, ...input, approved: false, created_at: new Date().toISOString() };
    data.reviews = [...(data.reviews ?? []), row];
    await saveJson(data);
    return row;
  }
  const [row] = await getDb()('reviews')
    .insert({ ...input, approved: false, created_at: new Date() })
    .returning(['id', 'item_type', 'item_slug', 'customer_name', 'rating', 'comment', 'approved', 'created_at']);
  return row as Review;
}

export async function approveReview(id: number): Promise<void> {
  if (useJsonFallback()) {
    const data = await loadJson();
    data.reviews = (data.reviews ?? []).map(r => r.id === id ? { ...r, approved: true } : r);
    await saveJson(data);
    return;
  }
  await getDb()('reviews').where({ id }).update({ approved: true });
}

export async function deleteReview(id: number): Promise<void> {
  if (useJsonFallback()) {
    const data = await loadJson();
    data.reviews = (data.reviews ?? []).filter(r => r.id !== id);
    await saveJson(data);
    return;
  }
  await getDb()('reviews').where({ id }).del();
}
