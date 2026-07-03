import type { Knex } from 'knex';

// Stores uploaded image bytes directly in SQL Server instead of the local
// filesystem. This is deliberate: the app runs on Render's free tier, whose
// disk is ephemeral and wiped on every redeploy/restart, which was silently
// destroying uploaded images. The DB (site4now-hosted SQL Server) is the one
// piece of storage that's actually persistent across deploys, so images live
// here instead. Requests to /uploads/:filename are served by streaming the
// bytes out of this table (see src/app.ts) rather than express.static.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('images', t => {
    t.increments('id').primary();
    t.string('filename', 255).notNullable().unique();
    t.string('mime', 100).notNullable();
    t.binary('data').notNullable(); // varbinary(max) on mssql
    t.integer('size_bytes').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('images');
}
