import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { librarians } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";

export type LibrarianInsert = typeof librarians.$inferInsert;
export type LibrarianSelect = typeof librarians.$inferSelect;

const clearLibrarianCache = async () => {
  await clearCacheByPattern("librarian:*");
};

export const findLibrariansWithPagination = async (
  statusActive: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `librarian:status:${statusActive}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const conditions = [];

      if (statusActive !== "Semua") {
        conditions.push(eq(librarians.status_aktif, statusActive === "true"));
      }

      if (trimmedSearch) {
        const searchPattern = `%${trimmedSearch}%`;
        conditions.push(
          or(
            ilike(librarians.nama, searchPattern),
            ilike(librarians.nip, searchPattern),
            ilike(librarians.email, searchPattern),
            ilike(librarians.telepon, searchPattern),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [data, [countResult]] = await Promise.all([
        db
          .select({
            id: librarians.id,
            nama: librarians.nama,
            nip: librarians.nip,
            email: librarians.email,
            telepon: librarians.telepon,
            foto: librarians.foto,
            status_aktif: librarians.status_aktif,
            createdAt: librarians.createdAt,
          })
          .from(librarians)
          .where(whereClause)
          .orderBy(desc(librarians.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(librarians).where(whereClause),
      ]);

      return { data, total: Number(countResult?.total ?? 0) };
    },
  );
};

export const findLibrarianById = async (id: string) => {
  const [librarian] = await db
    .select({
      id: librarians.id,
      nama: librarians.nama,
      nip: librarians.nip,
      email: librarians.email,
      telepon: librarians.telepon,
      foto: librarians.foto,
      status_aktif: librarians.status_aktif,
      createdAt: librarians.createdAt,
    })
    .from(librarians)
    .where(eq(librarians.id, id))
    .limit(1);

  return librarian ?? null;
};

export const findLibrarianRawById = async (
  id: string,
): Promise<LibrarianSelect | null> => {
  const [librarian] = await db
    .select()
    .from(librarians)
    .where(eq(librarians.id, id))
    .limit(1);

  return librarian ?? null;
};

export const insertLibrarian = async (
  data: LibrarianInsert,
): Promise<LibrarianSelect> => {
  const [created] = await db.insert(librarians).values(data).returning();

  if (created) {
    await clearLibrarianCache();
  }

  return created;
};

export const updateLibrarianById = async (
  id: string,
  data: Partial<LibrarianInsert>,
): Promise<LibrarianSelect | null> => {
  const [updated] = await db
    .update(librarians)
    .set(data)
    .where(eq(librarians.id, id))
    .returning();

  if (updated) {
    await clearLibrarianCache();
  }

  return updated ?? null;
};

export const removeLibrarianById = async (
  id: string,
): Promise<LibrarianSelect | null> => {
  const [deleted] = await db
    .delete(librarians)
    .where(eq(librarians.id, id))
    .returning();

  if (deleted) {
    await clearLibrarianCache();
  }

  return deleted ?? null;
};
