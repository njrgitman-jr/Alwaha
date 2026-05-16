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
};

export type Accessory = {
  slug: string; category_slug: string; name: string;
  price: number; currency: string;
  note: string | null; free_shipping: boolean;
  image_url: string | null;
  display_order: number; visible: boolean;
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
};

async function loadJson(): Promise<JsonShape> {
  const path = existsSync(RUNTIME_PATH) ? RUNTIME_PATH : SEED_PATH;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw);
}

async function saveJson(data: JsonShape) {
  await writeFile(RUNTIME_PATH, JSON.stringify(data, null, 2), 'utf-8');
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
    data.categories = data.categories.filter(c => c.slug !== slug);
    // also detach any products/accessories from this category? we leave them but they won't surface
    await saveJson(data);
    return;
  }
  // products & accessories reference this slug; admin should clean those first
  await getDb()('categories').where({ slug }).del();
}

// ---------- PACKAGES ----------

export async function getPackages(opts?: { includeHidden?: boolean }): Promise<Package[]> {
  if (useJsonFallback()) {
    const data = await loadJson();
    const all = data.packages.map(p => ({
      slug: p.slug, category_slug: p.category_slug, name: p.name,
      price_new: p.price_new, price_old: p.price_old ?? null, currency: p.currency,
      badge: p.badge ?? null, warranty: p.warranty ?? null,
      image_url: p.image_url ?? null,
      components: p.components ?? [], gifts: p.gifts ?? [],
      display_order: p.display_order, visible: p.visible,
    }));
    const filtered = opts?.includeHidden ? all : all.filter(p => p.visible);
    return filtered.sort((a, b) => a.display_order - b.display_order);
  }
  let q = getDb()('packages').orderBy('display_order');
  if (!opts?.includeHidden) q = q.where('visible', true);
  const rows = await q;
  return rows.map((r: any) => ({
    ...r,
    components: r.components_json ? JSON.parse(r.components_json) : [],
    gifts: r.gifts_json ? JSON.parse(r.gifts_json) : [],
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
    const all = (await loadJson()).accessories
      .map(a => ({ ...a, note: a.note ?? null, image_url: a.image_url ?? null }));
    const filtered = opts?.includeHidden ? all : all.filter(a => a.visible);
    return filtered.sort((a, b) => a.display_order - b.display_order);
  }
  let q = getDb()<Accessory>('accessories').orderBy('display_order');
  if (!opts?.includeHidden) q = q.where('visible', true);
  return q;
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
