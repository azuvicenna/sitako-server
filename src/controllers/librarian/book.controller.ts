import { Request, Response } from "express";
import * as bookService from "@/services/librarian/book.service";
import { bookTypeEnum } from "@/db/schema";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";
import {
  bookCoverSchema,
  bookPdfSchema,
} from "@/validations/librarian/book.schema";

type BookType = (typeof bookTypeEnum.enumValues)[number];

const isValidBookType = (type: unknown): type is BookType => {
  return (
    typeof type === "string" &&
    bookTypeEnum.enumValues.includes(type as BookType)
  );
};

const extractUploadedFiles = (req: Request) => {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  return {
    coverFile: files?.cover?.[0],
    pdfFile: files?.file?.[0],
  };
};

export const getBookHandler = async (req: Request, res: Response) => {
  try {
    const { bookType } = req.query;

    if (!isValidBookType(bookType)) {
      return sendFail(res, 400, "Tipe buku tidak ditemukan atau tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await bookService.getBooksWithPagination(
      bookType,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getBookHandler");
  }
};

export const showBook = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);

    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const result = await bookService.getBookById(bookId);
    if (!result) {
      return sendFail(res, 404, "Buku tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showBook");
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const { bookType: bookTypeParam } = req.query;

    if (!isValidBookType(bookTypeParam)) {
      return sendFail(res, 400, "Tipe buku tidak ditemukan atau tidak valid");
    }

    const { coverFile, pdfFile } = extractUploadedFiles(req);

    const validatedCover = bookCoverSchema.parse(coverFile);
    const validatedPdf = pdfFile ? bookPdfSchema.parse(pdfFile) : undefined;

    const result = await bookService.createNewBook(
      req.body ?? {},
      bookTypeParam,
      validatedCover,
      validatedPdf,
    );

    return sendSuccess(res, result, "Buku berhasil ditambahkan");
  } catch (error) {
    return sendError(res, error, "createBook");
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);

    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const { coverFile, pdfFile } = extractUploadedFiles(req);

    const validatedCover = coverFile
      ? bookCoverSchema.parse(coverFile)
      : undefined;
    const validatedPdf = pdfFile ? bookPdfSchema.parse(pdfFile) : undefined;

    const result = await bookService.updateExistingBook(
      bookId,
      req.body ?? {},
      validatedCover,
      validatedPdf,
    );

    if (!result) {
      return sendFail(res, 404, "Buku tidak ditemukan");
    }

    return sendSuccess(res, result, "Data buku berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateBook");
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);

    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const result = await bookService.deleteExistingBook(bookId);
    if (!result) {
      return sendFail(res, 404, "Buku tidak ditemukan");
    }

    return sendSuccess(res, result, "Data buku berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteBook");
  }
};
