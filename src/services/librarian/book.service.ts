import { v4 as uuidv4 } from "uuid";
import {
  insertBook,
  updateBookById,
  findBook,
  removeBookById,
  findBooksWithPagination,
  type BookInsert,
  BookSelect,
} from "@/repositories/librarian/book.repository";
import { deleteFile, uploadFile } from "@/utils/services/storage";
import type {
  CreateBook,
  UpdateBook,
} from "@/validations/librarian/book.schema";
import logger from "@/utils/core/logger";

const extractFileKey = (url: string) => url.split("/").slice(-2).join("/");

const safeDeleteFile = async (url?: string | null, label = "file") => {
  if (!url) return;
  try {
    await deleteFile(extractFileKey(url));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to delete ${label} (${url}): ${message}`);
  }
};

const uploadWithUniqueName = async (
  folder: string,
  file: Express.Multer.File,
) => {
  const ext = file.originalname.split(".").pop();
  const filename = ext ? `${uuidv4()}.${ext}` : uuidv4();
  return uploadFile(folder, file, filename);
};

export const getBooksWithPagination = async (
  bookType: BookSelect["tipeBuku"],
  page: number,
  limit: number,
  search: string,
) => {
  return findBooksWithPagination(bookType, page, limit, search);
};

export const getBookById = async (id: string) => {
  return findBook(id);
};

export const createNewBook = async (
  payload: CreateBook,
  bookTypeParam: string,
  coverFile?: Express.Multer.File,
  pdfFile?: Express.Multer.File,
) => {
  let cover = "";
  let file: string | null = null;

  try {
    if (coverFile) {
      cover = await uploadWithUniqueName("covers", coverFile);
    }

    if (bookTypeParam.toLowerCase() === "digital" && pdfFile) {
      file = await uploadWithUniqueName("books", pdfFile);
    }

    const bookData: BookInsert = {
      ...payload,
      tipeBuku: (payload.tipeBuku || bookTypeParam) as NonNullable<
        BookInsert["tipeBuku"]
      >,
      cover,
      file,
    };

    return await insertBook(bookData);
  } catch (error) {
    await Promise.all([
      cover ? safeDeleteFile(cover, "orphaned cover") : null,
      file ? safeDeleteFile(file, "orphaned book file") : null,
    ]);
    throw error;
  }
};

export const updateExistingBook = async (
  id: string,
  payload: UpdateBook,
  coverFile?: Express.Multer.File,
  pdfFile?: Express.Multer.File,
) => {
  const existingBook = await findBook(id);
  if (!existingBook) return null;

  const updateData: Partial<BookInsert> = { ...payload };
  let newCover: string | undefined;
  let newFile: string | undefined;

  try {
    if (coverFile) {
      newCover = await uploadWithUniqueName("covers", coverFile);
      updateData.cover = newCover;
    }

    if (pdfFile) {
      newFile = await uploadWithUniqueName("books", pdfFile);
      updateData.file = newFile;
    } else if (payload.tipeBuku === "Fisik" && existingBook.file) {
      updateData.file = null;
    }

    if (Object.keys(updateData).length === 0) {
      return existingBook;
    }

    const updated = await updateBookById(id, updateData);

    await Promise.all([
      coverFile && existingBook.cover
        ? safeDeleteFile(existingBook.cover, "old cover")
        : null,
      (pdfFile || payload.tipeBuku === "Fisik") && existingBook.file
        ? safeDeleteFile(existingBook.file, "old book file")
        : null,
    ]);

    return updated;
  } catch (error) {
    await Promise.all([
      newCover ? safeDeleteFile(newCover, "orphaned cover") : null,
      newFile ? safeDeleteFile(newFile, "orphaned book file") : null,
    ]);
    throw error;
  }
};

export const deleteExistingBook = async (id: string) => {
  const book = await findBook(id);
  if (!book) return null;

  const deletedBook = await removeBookById(id);

  if (deletedBook) {
    await Promise.all([
      safeDeleteFile(book.cover, "cover file"),
      safeDeleteFile(book.file, "book file"),
    ]);
  }

  return deletedBook;
};
