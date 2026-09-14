import { Request, Response } from "express";
import * as libraryService from "@/services/member/library.service";
import { bookTypeEnum } from "@/db/schema";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";

type BookType = (typeof bookTypeEnum.enumValues)[number];

const isValidBookType = (type: unknown): type is BookType => {
  return (
    typeof type === "string" &&
    bookTypeEnum.enumValues.includes(type as BookType)
  );
};

export const showBook = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);
    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const result = await libraryService.getBookById(bookId);
    if (!result) {
      return sendFail(res, 404, "Buku tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showBook");
  }
};

export const readDigitalBook = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);
    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const result = await libraryService.getDigitalBookById(bookId);
    if (!result) {
      return sendFail(res, 404, "Buku digital tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "readDigitalBook");
  }
};

export const createBookmark = async (req: Request, res: Response) => {
  try {
    const bookId = resolveParam(req.params.id);
    if (!bookId) {
      return sendFail(res, 400, "ID buku tidak valid");
    }

    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const result = await libraryService.createNewBookmark({
      bukuId: bookId,
      anggotaId: memberId,
    });

    return sendSuccess(res, result, "Bookmark berhasil ditambahkan");
  } catch (error) {
    return sendError(res, error, "createBookmark");
  }
};

export const deleteBookmark = async (req: Request, res: Response) => {
  try {
    const bookmarkId = resolveParam(req.params.bookmarkId);
    if (!bookmarkId) {
      return sendFail(res, 400, "ID bookmark tidak valid");
    }

    const result = await libraryService.deleteExistingBookmark(bookmarkId);
    if (!result) {
      return sendFail(res, 404, "Bookmark tidak ditemukan");
    }

    return sendSuccess(res, result, "Data bookmark berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteBookmark");
  }
};

export const getMyBookmarks = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await libraryService.getBookmarksWithPagination(
      memberId,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result, "Data bookmark berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getMyBookmarks");
  }
};

export const getAvailableBooks = async (req: Request, res: Response) => {
  try {
    const rawBookType = req.query.bookType ?? req.query.tipeBuku;

    if (rawBookType !== undefined && !isValidBookType(rawBookType)) {
      return sendFail(res, 400, "Tipe buku tidak ditemukan atau tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const bookType = rawBookType as BookType | undefined;

    const result = await libraryService.getAvailableBooksWithPagination(
      page,
      limit,
      search,
      bookType,
    );

    return sendSuccess(res, result, "Daftar buku berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getAvailableBooks");
  }
};


