import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, fines } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";

export type FineInsert = typeof fines.$inferInsert;
export type FineSelect = typeof fines.$inferSelect;

const clearFineCache = async () => {
  await clearCacheByPattern("fine:*");
};

export const findFinesWithPagination = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `fine:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const searchPattern = `%${trimmedSearch}%`;
      const whereClause = trimmedSearch
        ? or(
            ilike(sql`CAST(${fines.jenisDenda} AS TEXT)`, searchPattern),
            ilike(sql`CAST(${fines.hargaDenda} AS TEXT)`, searchPattern),
            ilike(sql`CAST(${fines.metodePerhitungan} AS TEXT)`, searchPattern),
            ilike(books.judul, searchPattern),
          )
        : undefined;

      const [data, [countResult]] = await Promise.all([
        db
          .select({
            id: fines.id,
            jenisDenda: fines.jenisDenda,
            hargaDenda: fines.hargaDenda,
            metodePerhitungan: fines.metodePerhitungan,
            judulBuku: books.judul,
            createdAt: fines.createdAt,
          })
          .from(fines)
          .innerJoin(books, eq(fines.bukuId, books.id))
          .where(whereClause)
          .orderBy(desc(fines.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(fines)
          .innerJoin(books, eq(fines.bukuId, books.id))
          .where(whereClause),
      ]);

      return { data, total: Number(countResult?.total ?? 0) };
    },
  );
};

export const findFine = async (id: string): Promise<FineSelect | null> => {
  const [fine] = await db.select().from(fines).where(eq(fines.id, id)).limit(1);

  return fine ?? null;
};

export const insertFine = async (data: FineInsert): Promise<FineSelect> => {
  const [created] = await db.insert(fines).values(data).returning();

  if (created) {
    await clearFineCache();
  }

  return created;
};

export const updateFineById = async (
  id: string,
  data: Partial<FineInsert>,
): Promise<FineSelect | null> => {
  const [updated] = await db
    .update(fines)
    .set(data)
    .where(eq(fines.id, id))
    .returning();

  if (updated) {
    await clearFineCache();
  }

  return updated ?? null;
};

export const removeFineById = async (
  id: string,
): Promise<FineSelect | null> => {
  const [deleted] = await db.delete(fines).where(eq(fines.id, id)).returning();

  if (deleted) {
    await clearFineCache();
  }

  return deleted ?? null;
};
