// One-off migration: copies image files that currently exist on local disk
// (server/public/uploads/*) into the new `images` DB table, so images you
// already uploaded aren't lost when the app switches to DB-backed storage.
//
// Usage (from server/ directory, against whichever DB your .env points to):
//   npx tsx scripts/migrate-uploads-to-db.ts
//
// Safe to re-run — skips any filename already present in the images table.

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { getDb } from '../src/db.js';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

async function main() {
  const db = getDb();
  let files: string[];
  try {
    files = await readdir(UPLOAD_DIR);
  } catch {
    console.log(`No local uploads folder found at ${UPLOAD_DIR} — nothing to migrate.`);
    await db.destroy();
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const filename of files) {
    const ext = extname(filename).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) {
      console.log(`Skipping ${filename} (unsupported extension)`);
      continue;
    }

    const existing = await db('images').where({ filename }).first();
    if (existing) {
      skipped++;
      continue;
    }

    const data = await readFile(join(UPLOAD_DIR, filename));
    await db('images').insert({ filename, mime, data, size_bytes: data.length });
    migrated++;
    console.log(`Migrated ${filename} (${data.length} bytes)`);
  }

  console.log(`\nDone. Migrated: ${migrated}, already present: ${skipped}, total files seen: ${files.length}`);
  await db.destroy();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
