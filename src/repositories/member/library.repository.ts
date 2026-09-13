import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookmarks, books } from "@/db/schema";
import type { BookSelect } from "../librarian/book.repository";

export type BookmarkInsert = typeof bookmarks.$inferInsert;
export type BookmarkSelect = typeof bookmarks.$inferSelect;

export const findBook = async (bookId: string): Promise<BookSelect | null> => {
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  return book ?? null;
};

export const findDigitalBook = async (
  bookId: string,
): Promise<Pick<BookSelect, "id" | "cover" | "file" | "createdAt"> | null> => {
  const [book] = await db
    .select({
      id: books.id,
      cover: books.cover,
      file: books.file,
      createdAt: books.createdAt,
    })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.tipeBuku, "Digital")))
    .limit(1);

  return book ?? null;
};

export const insertBookmark = async (
  data: BookmarkInsert,
): Promise<BookmarkSelect> => {
  const [created] = await db.insert(bookmarks).values(data).returning();

  return created;
};

export const removeBookmarkById = async (
  bookmarkId: string,
): Promise<BookmarkSelect | null> => {
  const [deleted] = await db
    .delete(bookmarks)
    .where(eq(bookmarks.id, bookmarkId))
    .returning();

  return deleted ?? null;
};
