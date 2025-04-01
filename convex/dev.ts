import { internalMutation, internalAction } from './_generated/server';
import { v } from 'convex/values';
import schema from './schema';
import { internal } from './_generated/api';

export const deleteFromTable = internalMutation({
  args: { tableName: v.string() },
  handler: async (ctx, { tableName }) => {
    // Delete 4000 rows at a time
    const rows = await ctx.db.query(tableName as any).take(1000);
    await Promise.all(rows.map((row) => ctx.db.delete(row._id)));

    return rows.length !== 1000;
  },
});

export const clearAll = internalAction(async (ctx) => {
  // Get all table names from the schema
  const tableNames = Object.keys(schema.tables);

  for (const tableName of tableNames) {
    let isCleared = false;

    while (!isCleared) {
      isCleared = await ctx.runMutation(internal.dev.deleteFromTable, { tableName });
    }
  }
});
