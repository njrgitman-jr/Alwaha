import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('packages', t => {
    t.string('image_url', 500);
  });
  await knex.schema.alterTable('accessories', t => {
    t.string('image_url', 500);
  });
  await knex.schema.alterTable('categories', t => {
    t.string('image_url', 500);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('categories', t => t.dropColumn('image_url'));
  await knex.schema.alterTable('accessories', t => t.dropColumn('image_url'));
  await knex.schema.alterTable('packages', t => t.dropColumn('image_url'));
}
