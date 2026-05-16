import 'dotenv/config';
import knex, { type Knex } from 'knex';
import knexConfig from '../knexfile.js';

let _db: Knex | null = null;

export function getDb(): Knex {
  if (!_db) _db = knex(knexConfig);
  return _db;
}

export function useJsonFallback(): boolean {
  return (process.env.USE_JSON_FALLBACK ?? 'true') === 'true';
}
