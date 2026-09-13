import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";
import { invalidateDashboardCache } from "./dashboard.repository";

export type BookInsert = typeof books.$inferInsert;
export type BookSelect = typeof books.$inferSelect;

const clearBookCache = async (bookType?: BookSelect["tipeBuku"]) => {
  const pattern = bookType ? `book:book-type:${bookType}:*` : `book:*`;
  await Promise.all([clearCacheByPattern(pattern), invalidateDashboardCache()]);
};

export const findBooksWithPagination = async (
  bookType: BookSelect["tipeBuku"],
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `book:book-type:${bookType}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const searchPattern = `%${trimmedSearch}%`;
      const whereClause = trimmedSearch
        ? and(
            eq(books.tipeBuku, bookType),
            or(
              ilike(books.judul, searchPattern),
              ilike(books.penulis, searchPattern),
              ilike(books.penerbit, searchPattern),
              ilike(books.isbn, searchPattern),
            ),
          )
        : eq(books.tipeBuku, bookType);

      const [data, countResult] = await Promise.all([
        db
          .select()
          .from(books)
          .where(whereClause)
          .orderBy(desc(books.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(books).where(whereClause),
      ]);

      return { data, total: Number(countResult[0]?.total ?? 0) };
    },
  );
};

export const findBook = async (id: string): Promise<BookSelect | null> => {
  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);

  return book ?? null;
};

export const insertBook = async (data: BookInsert): Promise<BookSelect> => {
  const [created] = await db.insert(books).values(data).returning();

  if (created) {
    await clearBookCache(created.tipeBuku);
  }

  return created;
};

export const updateBookById = async (
  id: string,
  data: Partial<BookInsert>,
): Promise<BookSelect | null> => {
  const [updated] = await db
    .update(books)
    .set(data)
    .where(eq(books.id, id))
    .returning();

  if (updated) {
    await clearBookCache();
  }

  return updated;
};

export const removeBookById = async (
  id: string,
): Promise<BookSelect | null> => {
  const [deleted] = await db.delete(books).where(eq(books.id, id)).returning();

  if (deleted) {
    await clearBookCache(deleted.tipeBuku);
  }

  return deleted;
};
