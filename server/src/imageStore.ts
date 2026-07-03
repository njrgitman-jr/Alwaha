import { getDb, useJsonFallback } from './db.js';

export interface StoredImage {
  mime: string;
  data: Buffer;
}

// In JSON-fallback mode there's no SQL Server to talk to (used in tests and
// offline demos), so images just live in memory for the life of the process.
const memoryStore = new Map<string, StoredImage>();

export async function saveImage(filename: string, mime: string, data: Buffer): Promise<void> {
  if (useJsonFallback()) {
    memoryStore.set(filename, { mime, data });
    return;
  }
  await getDb()('images').insert({
    filename,
    mime,
    data,
    size_bytes: data.length,
  });
}

export async function getImage(filename: string): Promise<StoredImage | null> {
  if (useJsonFallback()) {
    return memoryStore.get(filename) ?? null;
  }
  const row = await getDb()('images').where({ filename }).first();
  if (!row) return null;
  return { mime: row.mime, data: row.data as Buffer };
}

export async function deleteImage(filename: string): Promise<void> {
  if (useJsonFallback()) {
    memoryStore.delete(filename);
    return;
  }
  await getDb()('images').where({ filename }).del();
}
