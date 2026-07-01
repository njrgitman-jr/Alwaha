import type { Knex } from 'knex';

// Generic reviews table for both packages and accessories. No FK to either
// table (a row can point at either one), so existence is validated at the
// application layer (see routes/public.ts) instead of via a DB constraint.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reviews', t => {
    t.increments('id').primary();
    t.string('item_type', 16).notNullable(); // 'package' | 'accessory'
    t.string('item_slug', 100).notNullable();
    t.string('customer_name', 100).notNullable();
    t.decimal('rating', 3, 1).notNullable(); // 1.0 - 10.0
    t.string('comment', 1000);
    // Reviews start unapproved so spam/abuse never reaches the public site
    // without an admin looking at it first.
    t.boolean('approved').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['item_type', 'item_slug'], 'idx_reviews_item');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reviews');
}
