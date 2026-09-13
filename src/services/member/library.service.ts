import {
  findBook,
  findDigitalBook,
  insertBookmark,
  removeBookmarkById,
  type BookmarkInsert,
} from "@/repositories/member/library.repository";
import type { CreateBookmark } from "@/validations/member/bookmark.schema";

export const getBookById = async (bookId: string) => {
  return findBook(bookId);
};

export const getDigitalBookById = async (bookId: string) => {
  return findDigitalBook(bookId);
};

export const createNewBookmark = async (payload: CreateBookmark) => {
  const bookmarkData: BookmarkInsert = { ...payload };
  return insertBookmark(bookmarkData);
};

export const deleteExistingBookmark = async (bookmarkId: string) => {
  return removeBookmarkById(bookmarkId);
};
