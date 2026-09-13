import { Request, Response } from "express";
import * as librarianService from "@/services/librarian/librarian.service";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";
import { imageFileSchema } from "@/validations/librarian/librarian.schema";

const VALID_STATUS_ACTIVE = ["Semua", "true", "false"] as const;
type StatusActive = (typeof VALID_STATUS_ACTIVE)[number];

const isValidStatusActive = (status: unknown): status is StatusActive => {
  return (
    typeof status === "string" &&
    (VALID_STATUS_ACTIVE as readonly string[]).includes(status)
  );
};

export const getLibrarianHandler = async (req: Request, res: Response) => {
  try {
    const { statusActive } = req.query;

    if (!isValidStatusActive(statusActive)) {
      return sendFail(res, 400, "Status aktif tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await librarianService.getLibrariansWithPagination(
      statusActive,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getLibrarianHandler");
  }
};

export const showLibrarian = async (req: Request, res: Response) => {
  try {
    const librarianId = resolveParam(req.params.id);

    if (!librarianId) {
      return sendFail(res, 400, "ID pustakawan tidak valid");
    }

    const result = await librarianService.getLibrarianById(librarianId);
    if (!result) {
      return sendFail(res, 404, "Pustakawan tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showLibrarian");
  }
};

export const createLibrarian = async (req: Request, res: Response) => {
  try {
    const validatedFile = imageFileSchema.parse(req.file);
    const result = await librarianService.createNewLibrarian(
      req.body ?? {},
      validatedFile,
    );

    return sendSuccess(res, result, "Pustakawan berhasil ditambahkan");
  } catch (error) {
    return sendError(res, error, "createLibrarian");
  }
};

export const updateLibrarian = async (req: Request, res: Response) => {
  try {
    const librarianId = resolveParam(req.params.id);

    if (!librarianId) {
      return sendFail(res, 400, "ID pustakawan tidak valid");
    }

    const validatedFile = req.file
      ? imageFileSchema.parse(req.file)
      : undefined;

    const result = await librarianService.updateExistingLibrarian(
      librarianId,
      req.body ?? {},
      validatedFile,
    );

    if (!result) {
      return sendFail(res, 404, "Pustakawan tidak ditemukan");
    }

    return sendSuccess(res, result, "Data pustakawan berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateLibrarian");
  }
};

export const deleteLibrarian = async (req: Request, res: Response) => {
  try {
    const librarianId = resolveParam(req.params.id);

    if (!librarianId) {
      return sendFail(res, 400, "ID pustakawan tidak valid");
    }

    const result = await librarianService.deleteExistingLibrarian(librarianId);
    if (!result) {
      return sendFail(res, 404, "Pustakawan tidak ditemukan");
    }

    return sendSuccess(res, result, "Data pustakawan berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteLibrarian");
  }
};
