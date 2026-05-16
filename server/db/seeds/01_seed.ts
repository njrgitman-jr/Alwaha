import type { Knex } from 'knex';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type SeedData = {
  settings: Record<string, string>;
  categories: Array<{ slug: string; title: string; description: string; icon: string; image_url?: string; display_order: number; visible: boolean }>;
  packages: Array<{ slug: string; category_slug: string; name: string; price_new: number; price_old?: number; currency: string; badge?: string; warranty: string; image_url?: string; components: string[]; gifts: string[]; display_order: number; visible: boolean }>;
  accessories: Array<{ slug: string; category_slug: string; name: string; price: number; currency: string; note?: string; free_shipping: boolean; image_url?: string; display_order: number; visible: boolean }>;
};

export async function seed(knex: Knex): Promise<void> {
  const dataPath = join(__dirname, '..', 'seed-data.json');
  const raw = await readFile(dataPath, 'utf-8');
  const data: SeedData = JSON.parse(raw);

  await knex('accessories').del();
  await knex('packages').del();
  await knex('categories').del();
  await knex('site_settings').del();
  await knex('admin_users').del();

  await knex('categories').insert(data.categories.map(c => ({
    slug: c.slug, title: c.title, description: c.description, icon: c.icon,
    image_url: c.image_url || null,
    display_order: c.display_order, visible: c.visible,
  })));

  await knex('packages').insert(data.packages.map(p => ({
    slug: p.slug, category_slug: p.category_slug, name: p.name,
    price_new: p.price_new, price_old: p.price_old ?? null, currency: p.currency,
    badge: p.badge ?? null, warranty: p.warranty ?? null,
    image_url: p.image_url || null,
    components_json: JSON.stringify(p.components ?? []),
    gifts_json: JSON.stringify(p.gifts ?? []),
    display_order: p.display_order, visible: p.visible,
  })));

  await knex('accessories').insert(data.accessories.map(a => ({
    slug: a.slug, category_slug: a.category_slug, name: a.name,
    price: a.price, currency: a.currency,
    note: a.note ?? null, free_shipping: a.free_shipping,
    image_url: a.image_url || null,
    display_order: a.display_order, visible: a.visible,
  })));

  await knex('site_settings').insert(
    Object.entries(data.settings).map(([key, value]) => ({ key, value }))
  );

  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await knex('admin_users').insert({ username: adminUsername, password_hash: passwordHash });
}
