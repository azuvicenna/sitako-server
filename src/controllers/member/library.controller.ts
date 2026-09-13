import { Request, Response } from "express";
import * as libraryService from "@/services/member/library.service";
import { resolveParam } from "@/utils/core/param";
import { sendError, sendFail, sendSuccess } from "@/utils/core/handler";

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
