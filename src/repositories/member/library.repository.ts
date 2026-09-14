import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { bookmarks, books } from '@/db/schema';
import type { BookSelect } from '../librarian/book.repository';
import { withCache } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';
import { invalidateMemberDashboardCache } from './dashboard.repository';

export type BookmarkInsert = typeof bookmarks.$inferInsert;
export type BookmarkSelect = typeof bookmarks.$inferSelect;

export interface BookmarkBookDetail {
  id: string;
  judul: string;
  penulis: string;
  cover: string;
  tipeBuku: 'Fisik' | 'Digital';
  genre: string[];
}

export interface BookmarkItem {
  id: string;
  buku: BookmarkBookDetail;
  createdAt: Date;
}

export interface BookmarkPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BookmarkPaginatedResult {
  data: BookmarkItem[];
  pagination: BookmarkPagination;
}

export interface AvailableBookItem {
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  isbn: string;
  genre: string[];
  tipeBuku: 'Fisik' | 'Digital';
  tahunTerbit: number;
  jumlahStok: number;
  cover: string;
  file?: string | null;
}

export interface AvailableBooksPaginatedResult {
  data: AvailableBookItem[];
  pagination: BookmarkPagination;
}

export const invalidateMemberBookCache = async () => {
  await clearCacheByPattern('member:books:*');
};

export const findAvailableBooksWithPagination = async (
  page = 1,
  limit = 10,
  search = '',
  bookType?: 'Fisik' | 'Digital',
): Promise<AvailableBooksPaginatedResult> => {
  const trimmedSearch = search.trim();
  const cacheKey = `member:books:type:${bookType ?? 'all'}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCache(cacheKey, 60, async () => {
    const safeLimit = Math.max(1, limit);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    if (bookType) {
      conditions.push(eq(books.tipeBuku, bookType));
    }

    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch}%`;
      conditions.push(
        or(
          ilike(books.judul, searchPattern),
          ilike(books.penulis, searchPattern),
          ilike(books.penerbit, searchPattern),
          ilike(books.isbn, searchPattern),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rawList, [countResult]] = await Promise.all([
      db
        .select()
        .from(books)
        .where(whereClause)
        .orderBy(desc(books.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db.select({ total: count() }).from(books).where(whereClause),
    ]);

    const totalItems = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(totalItems / safeLimit);

    const data: AvailableBookItem[] = rawList.map((book) => {
      const item: AvailableBookItem = {
        id: book.id,
        judul: book.judul,
        penulis: book.penulis,
        penerbit: book.penerbit,
        isbn: book.isbn,
        genre: book.genre,
        tipeBuku: book.tipeBuku,
        tahunTerbit: book.tahunTerbit,
        jumlahStok: book.jumlahStok,
        cover: book.cover,
      };

      if (book.tipeBuku === 'Digital' && book.file) {
        item.file = book.file;
      }

      return item;
    });

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    };
  });
};

export const invalidateMemberBookmarkCache = async (memberId: string) => {
  await Promise.all([
    clearCacheByPattern(`bookmark:anggota:${memberId}:*`),
    invalidateMemberDashboardCache(memberId),
  ]);
};

export const findBookmarksWithPagination = async (
  memberId: string,
  page = 1,
  limit = 10,
  search = '',
): Promise<BookmarkPaginatedResult> => {
  const trimmedSearch = search.trim();
  const cacheKey = `bookmark:anggota:${memberId}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCache(cacheKey, 60, async () => {
    const safeLimit = Math.max(1, limit);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const conditions = [eq(bookmarks.anggotaId, memberId)];

    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch}%`;
      conditions.push(or(ilike(books.judul, searchPattern), ilike(books.penulis, searchPattern))!);
    }

    const whereClause = and(...conditions);

    const [rawList, [countResult]] = await Promise.all([
      db
        .select({
          bookmarkId: bookmarks.id,
          bookId: books.id,
          judul: books.judul,
          penulis: books.penulis,
          cover: books.cover,
          tipeBuku: books.tipeBuku,
          genre: books.genre,
          createdAt: bookmarks.createdAt,
        })
        .from(bookmarks)
        .innerJoin(books, eq(bookmarks.bukuId, books.id))
        .where(whereClause)
        .orderBy(desc(bookmarks.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(bookmarks)
        .innerJoin(books, eq(bookmarks.bukuId, books.id))
        .where(whereClause),
    ]);

    const totalItems = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(totalItems / safeLimit);

    const data: BookmarkItem[] = rawList.map((item) => ({
      id: item.bookmarkId,
      buku: {
        id: item.bookId,
        judul: item.judul,
        penulis: item.penulis,
        cover: item.cover,
        tipeBuku: item.tipeBuku,
        genre: item.genre,
      },
      createdAt: item.createdAt,
    }));

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    };
  });
};

export const findBook = async (bookId: string): Promise<BookSelect | null> => {
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

  return book ?? null;
};

export const findDigitalBook = async (
  bookId: string,
): Promise<Pick<BookSelect, 'id' | 'cover' | 'file' | 'createdAt'> | null> => {
  const [book] = await db
    .select({
      id: books.id,
      cover: books.cover,
      file: books.file,
      createdAt: books.createdAt,
    })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.tipeBuku, 'Digital')))
    .limit(1);

  return book ?? null;
};

export const insertBookmark = async (data: BookmarkInsert): Promise<BookmarkSelect> => {
  const [created] = await db.insert(bookmarks).values(data).returning();

  if (created) {
    await invalidateMemberBookmarkCache(data.anggotaId);
  }

  return created;
};

export const removeBookmarkById = async (bookmarkId: string): Promise<BookmarkSelect | null> => {
  const [deleted] = await db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId)).returning();

  if (deleted) {
    await invalidateMemberBookmarkCache(deleted.anggotaId);
  }

  return deleted ?? null;
};
