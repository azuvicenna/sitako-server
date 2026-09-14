import {
  findAvailableBooksWithPagination,
  findBook,
  findBookmarksWithPagination,
  findDigitalBook,
  insertBookmark,
  removeBookmarkById,
  type BookmarkInsert,
} from "@/repositories/member/library.repository";
import type { CreateBookmark } from "@/validations/member/bookmark.schema";

export const getAvailableBooksWithPagination = async (
  page: number,
  limit: number,
  search: string,
  bookType?: "Fisik" | "Digital",
) => {
  return findAvailableBooksWithPagination(page, limit, search, bookType);
};

export const getBookmarksWithPagination = async (
  memberId: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findBookmarksWithPagination(memberId, page, limit, search);
};

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
