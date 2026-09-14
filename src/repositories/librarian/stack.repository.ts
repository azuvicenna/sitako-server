import { and, asc, count, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { books, stacks } from '@/db/schema';
import { withCacheAndPagination } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';

export type StackInsert = typeof stacks.$inferInsert;
export type StackSelect = typeof stacks.$inferSelect;

const clearStackCache = async () => {
  await clearCacheByPattern('stack:*');
};

export const findStacksWithPagination = async (
  shelfId: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `stack:shelf:${shelfId}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(cacheKey, page, limit, async (offset, limit) => {
    const searchPattern = `%${trimmedSearch}%`;
    const whereClause = trimmedSearch
      ? and(
          eq(stacks.rakId, shelfId),
          or(
            ilike(stacks.kdSusunan, searchPattern),
            ilike(sql`CAST(${stacks.nomorSusunan} AS TEXT)`, searchPattern),
            ilike(books.judul, searchPattern),
          ),
        )
      : eq(stacks.rakId, shelfId);

    const [data, [countResult]] = await Promise.all([
      db
        .select({
          id: stacks.id,
          bukuId: stacks.bukuId,
          kdSusunan: stacks.kdSusunan,
          nomorSusunan: stacks.nomorSusunan,
          judulBuku: books.judul,
          createdAt: stacks.createdAt,
        })
        .from(stacks)
        .innerJoin(books, eq(stacks.bukuId, books.id))
        .where(whereClause)
        .orderBy(asc(stacks.nomorSusunan))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(stacks)
        .innerJoin(books, eq(stacks.bukuId, books.id))
        .where(whereClause),
    ]);

    return { data, total: Number(countResult?.total ?? 0) };
  });
};

export const findStack = async (id: string): Promise<StackSelect | null> => {
  const [stack] = await db.select().from(stacks).where(eq(stacks.id, id)).limit(1);

  return stack ?? null;
};

export const insertStack = async (data: StackInsert): Promise<StackSelect> => {
  const [created] = await db.insert(stacks).values(data).returning();

  if (created) {
    await clearStackCache();
  }

  return created;
};

export const updateStackById = async (
  id: string,
  data: Partial<StackInsert>,
): Promise<StackSelect | null> => {
  const [updated] = await db.update(stacks).set(data).where(eq(stacks.id, id)).returning();

  if (updated) {
    await clearStackCache();
  }

  return updated ?? null;
};

export const removeStackById = async (id: string): Promise<StackSelect | null> => {
  const [deleted] = await db.delete(stacks).where(eq(stacks.id, id)).returning();

  if (deleted) {
    await clearStackCache();
  }

  return deleted ?? null;
};
