import type { Accessory, Package } from '../data/site';

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function imageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/uploads/')) return API_ORIGIN + path;
  return path;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json();
}

export type ServerPackage = {
  slug: string;
  category_slug: string;
  name: string;
  price_new: number;
  price_old: number | null;
  currency: 'JD';
  badge: string | null;
  warranty: string | null;
  image_url: string | null;
  components: string[];
  gifts: string[];
  display_order: number;
  visible: boolean;
};

export type ServerAccessory = {
  slug: string;
  category_slug: string;
  name: string;
  price: number;
  currency: 'JD';
  note: string | null;
  free_shipping: boolean;
  image_url: string | null;
  display_order: number;
  visible: boolean;
};

export type ServerCategory = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  display_order: number;
  visible: boolean;
};

export type ServerSettings = Record<string, string>;

export function toPackage(p: ServerPackage): Package {
  return {
    slug: p.slug,
    category: p.category_slug,
    name: p.name,
    priceNew: Number(p.price_new),
    priceOld: p.price_old != null ? Number(p.price_old) : undefined,
    currency: 'JD',
    badge: p.badge ?? undefined,
    components: p.components ?? [],
    gifts: p.gifts ?? [],
    warranty: p.warranty ?? '',
    imageUrl: imageUrl(p.image_url),
  };
}

export function toAccessory(a: ServerAccessory): Accessory {
  return {
    slug: a.slug,
    category: a.category_slug,
    name: a.name,
    price: Number(a.price),
    currency: 'JD',
    note: a.note ?? undefined,
    freeShipping: a.free_shipping,
    imageUrl: imageUrl(a.image_url),
  };
}

export const api = {
  health: () => get<{ ok: boolean; mode: string }>('/health'),
  settings: () => get<ServerSettings>('/settings'),
  categories: () => get<ServerCategory[]>('/categories'),
  packages: (category?: string) =>
    get<ServerPackage[]>(`/packages${category ? `?category=${category}` : ''}`),
  package: (slug: string) => get<ServerPackage>(`/packages/${slug}`),
  accessories: (category?: string) =>
    get<ServerAccessory[]>(`/accessories${category ? `?category=${category}` : ''}`),
};

// ----------------- Admin -----------------
const TOKEN_KEY = 'alwaha_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    throw new Error('انتهت الجلسة');
  }
  if (!res.ok) {
    let msg = `API ${path} -> ${res.status}`;
    try { const body = await res.json(); if (body?.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const admin = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? 'فشل تسجيل الدخول');
    setAdminToken(body.token);
    return body as { token: string; username: string };
  },

  categories: () => authed<ServerCategory[]>('/admin/categories'),
  upsertCategory: (slug: string, body: Partial<ServerCategory>) =>
    authed<{ ok: true }>(`/admin/categories/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (slug: string) =>
    authed<{ ok: true }>(`/admin/categories/${slug}`, { method: 'DELETE' }),

  packages: () => authed<ServerPackage[]>('/admin/packages'),
  upsertPackage: (slug: string, body: Partial<ServerPackage>) =>
    authed<{ ok: true }>(`/admin/packages/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePackage: (slug: string) =>
    authed<{ ok: true }>(`/admin/packages/${slug}`, { method: 'DELETE' }),

  accessories: () => authed<ServerAccessory[]>('/admin/accessories'),
  upsertAccessory: (slug: string, body: Partial<ServerAccessory>) =>
    authed<{ ok: true }>(`/admin/accessories/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccessory: (slug: string) =>
    authed<{ ok: true }>(`/admin/accessories/${slug}`, { method: 'DELETE' }),

  settings: () => authed<ServerSettings>('/admin/settings'),
  updateSettings: (body: ServerSettings) =>
    authed<{ ok: true }>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),

  changePassword: (current: string, next: string) =>
    authed<{ ok: true }>('/admin/change-password', { method: 'POST', body: JSON.stringify({ current, next }) }),

  upload: async (file: File): Promise<{ url: string }> => {
    const token = getAdminToken();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      body: fd,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? 'فشل رفع الصورة');
    return body;
  },
};
