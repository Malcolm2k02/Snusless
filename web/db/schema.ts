import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
// One ownership-scoped document per person; revision provides atomic optimistic writes.
export const journals = sqliteTable('journals', {
    userId: text('user_id').primaryKey(),
    data: text('data').notNull(),
    revision: integer('revision').notNull().default(0),
});
