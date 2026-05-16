import 'dotenv/config';
import type { Knex } from 'knex';

const useInstance = !!process.env.DB_INSTANCE;

const config: Knex.Config = {
  client: 'mssql',
  connection: {
    server: process.env.DB_HOST ?? 'localhost',
    // When connecting via named instance (e.g. SQLEXPRESS), let SQL Browser
    // resolve the port; supplying both can confuse the driver.
    ...(useInstance ? {} : { port: Number(process.env.DB_PORT ?? 1433) }),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      instanceName: useInstance ? process.env.DB_INSTANCE : undefined,
      encrypt: (process.env.DB_ENCRYPT ?? 'false') === 'true',
      trustServerCertificate: (process.env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    },
  },
  migrations: { directory: './db/migrations', extension: 'ts' },
  seeds: { directory: './db/seeds', extension: 'ts' },
};

export default config;
