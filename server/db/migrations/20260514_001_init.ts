import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', t => {
    t.string('slug', 64).primary();
    t.string('title', 200).notNullable();
    t.string('description', 500);
    t.string('icon', 16);
    t.integer('display_order').notNullable().defaultTo(0);
    t.boolean('visible').notNullable().defaultTo(true);
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('packages', t => {
    t.string('slug', 100).primary();
    t.string('category_slug', 64).notNullable().references('slug').inTable('categories').onUpdate('CASCADE');
    t.string('name', 300).notNullable();
    t.decimal('price_new', 10, 2).notNullable().defaultTo(0);
    t.decimal('price_old', 10, 2);
    t.string('currency', 8).notNullable().defaultTo('JD');
    t.string('badge', 50);
    t.string('warranty', 200);
    t.text('components_json'); // JSON array of strings
    t.text('gifts_json');      // JSON array of strings
    t.integer('display_order').notNullable().defaultTo(0);
    t.boolean('visible').notNullable().defaultTo(true);
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('accessories', t => {
    t.string('slug', 100).primary();
    t.string('category_slug', 64).notNullable().references('slug').inTable('categories').onUpdate('CASCADE');
    t.string('name', 300).notNullable();
    t.decimal('price', 10, 2).notNullable().defaultTo(0);
    t.string('currency', 8).notNullable().defaultTo('JD');
    t.string('note', 500);
    t.boolean('free_shipping').notNullable().defaultTo(false);
    t.integer('display_order').notNullable().defaultTo(0);
    t.boolean('visible').notNullable().defaultTo(true);
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('site_settings', t => {
    t.string('key', 64).primary();
    t.text('value');
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('admin_users', t => {
    t.increments('id').primary();
    t.string('username', 64).notNullable().unique();
    t.string('password_hash', 200).notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('admin_users');
  await knex.schema.dropTableIfExists('site_settings');
  await knex.schema.dropTableIfExists('accessories');
  await knex.schema.dropTableIfExists('packages');
  await knex.schema.dropTableIfExists('categories');
}
