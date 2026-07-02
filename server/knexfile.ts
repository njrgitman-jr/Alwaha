import 'dotenv/config';
import type { Knex } from 'knex';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

/**
 * Two supported ways to configure the DB connection:
 *
 * 1. DATABASE_URL — a single connection string, e.g. what Render (or Azure
 *    SQL, or any managed SQL Server host) gives you:
 *      mssql://user:password@host:1433/dbname?encrypt=true
 *    This is the recommended path for deployment (Render/Vercel).
 *
 * 2. Discrete DB_* vars — used for local dev against SQL Server Express with
 *    a named instance (e.g. localhost\SQLEXPRESS). This is the recommended
 *    path for local development.
 *
 * If DATABASE_URL is set, it takes priority over the discrete vars.
 */
function buildConnection(): Knex.MsSqlConnectionConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    const encryptParam = url.searchParams.get('encrypt');
    const trustCertParam = url.searchParams.get('trustServerCertificate');

    return {
      server: url.hostname,
      port: url.port ? Number(url.port) : 1433,
      userName: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      options: {
        // Cloud-hosted SQL Server (Render/Azure) requires encryption by default.
        encrypt: encryptParam ? encryptParam === 'true' : true,
        trustServerCertificate: trustCertParam ? trustCertParam === 'true' : false,
      },
    };
  }

  const useInstance = !!process.env.DB_INSTANCE;

  return {
    server: process.env.DB_HOST ?? 'localhost',
    // When connecting via named instance (e.g. SQLEXPRESS), let SQL Browser
    // resolve the port; supplying both can confuse the driver.
    ...(useInstance ? {} : { port: Number(process.env.DB_PORT ?? 1433) }),
    userName: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      instanceName: useInstance ? process.env.DB_INSTANCE : undefined,
      // Local dev default: no encryption, trust self-signed cert.
      encrypt: (process.env.DB_ENCRYPT ?? 'false') === 'true',
      trustServerCertificate: (process.env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    },
  } as Knex.MsSqlConnectionConfig;
}

const config: Knex.Config = {
  client: 'mssql',
  connection: buildConnection(),
  // Small, PaaS-friendly pool. Render web services and similar hosts recycle
  // connections/dynos, so keep the pool modest and let idle connections drop.
  pool: IS_PROD ? { min: 0, max: 5, idleTimeoutMillis: 30000 } : { min: 0, max: 5 },
  migrations: { directory: './db/migrations', extension: 'ts' },
  seeds: { directory: './db/seeds', extension: 'ts' },
};

export default config;
