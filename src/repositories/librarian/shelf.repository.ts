import { count, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { shelves } from '@/db/schema';
import { withCacheAndPagination } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';

export type ShelfInsert = typeof shelves.$inferInsert;
export type ShelfSelect = typeof shelves.$inferSelect;

const clearShelfCache = async () => {
  await clearCacheByPattern('shelf:*');
};

export const findShelvesWithPagination = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `shelf:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(cacheKey, page, limit, async (offset, limit) => {
    const whereClause = trimmedSearch ? ilike(shelves.namaRak, `%${trimmedSearch}%`) : undefined;

    const [data, [countResult]] = await Promise.all([
      db
        .select()
        .from(shelves)
        .where(whereClause)
        .orderBy(desc(shelves.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(shelves).where(whereClause),
    ]);

    return { data, total: Number(countResult?.total ?? 0) };
  });
};

export const findShelf = async (id: string): Promise<ShelfSelect | null> => {
  const [shelf] = await db.select().from(shelves).where(eq(shelves.id, id)).limit(1);

  return shelf ?? null;
};

export const insertShelf = async (data: ShelfInsert): Promise<ShelfSelect> => {
  const [created] = await db.insert(shelves).values(data).returning();

  if (created) {
    await clearShelfCache();
  }

  return created;
};

export const updateShelfById = async (
  id: string,
  data: Partial<ShelfInsert>,
): Promise<ShelfSelect | null> => {
  const [updated] = await db.update(shelves).set(data).where(eq(shelves.id, id)).returning();

  if (updated) {
    await clearShelfCache();
  }

  return updated ?? null;
};

export const removeShelfById = async (id: string): Promise<ShelfSelect | null> => {
  const [deleted] = await db.delete(shelves).where(eq(shelves.id, id)).returning();

  if (deleted) {
    await clearShelfCache();
  }

  return deleted ?? null;
};
