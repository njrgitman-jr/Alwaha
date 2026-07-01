import type { Knex } from 'knex';

// Makes the categories -> packages/accessories FK behavior explicit:
// you cannot delete a category while packages/accessories still
// reference it (mirrors the guard added in the JSON-fallback store).
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('packages', t => {
    t.dropForeign(['category_slug']);
  });
  await knex.schema.alterTable('packages', t => {
    t.foreign('category_slug').references('categories.slug').onUpdate('CASCADE').onDelete('NO ACTION');
  });

  await knex.schema.alterTable('accessories', t => {
    t.dropForeign(['category_slug']);
  });
  await knex.schema.alterTable('accessories', t => {
    t.foreign('category_slug').references('categories.slug').onUpdate('CASCADE').onDelete('NO ACTION');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accessories', t => {
    t.dropForeign(['category_slug']);
  });
  await knex.schema.alterTable('accessories', t => {
    t.foreign('category_slug').references('categories.slug').onUpdate('CASCADE');
  });

  await knex.schema.alterTable('packages', t => {
    t.dropForeign(['category_slug']);
  });
  await knex.schema.alterTable('packages', t => {
    t.foreign('category_slug').references('categories.slug').onUpdate('CASCADE');
  });
}