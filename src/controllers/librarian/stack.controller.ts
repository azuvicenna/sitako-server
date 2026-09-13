import { Request, Response } from "express";
import * as stackService from "@/services/librarian/stack.service";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";

export const getStacksHandler = async (req: Request, res: Response) => {
  try {
    const shelfId = resolveParam(req.params.id);

    if (!shelfId) {
      return sendFail(res, 400, "ID rak tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await stackService.getStacksWithPagination(
      shelfId,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getStacksHandler");
  }
};

export const showStack = async (req: Request, res: Response) => {
  try {
    const stackId = resolveParam(req.params.id);

    if (!stackId) {
      return sendFail(res, 400, "ID susunan tidak valid");
    }

    const result = await stackService.getStackById(stackId);
    if (!result) {
      return sendFail(res, 404, "Susunan rak tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showStack");
  }
};

export const createStack = async (req: Request, res: Response) => {
  try {
    const result = await stackService.createNewStack(req.body ?? {});

    return sendSuccess(res, result, "Susunan rak berhasil ditambahkan");
  } catch (error) {
    return sendError(res, error, "createStack");
  }
};

export const updateStack = async (req: Request, res: Response) => {
  try {
    const stackId = resolveParam(req.params.id);

    if (!stackId) {
      return sendFail(res, 400, "ID susunan tidak valid");
    }

    const result = await stackService.updateExistingStack(
      stackId,
      req.body ?? {},
    );

    if (!result) {
      return sendFail(res, 404, "Susunan rak tidak ditemukan");
    }

    return sendSuccess(res, result, "Data susunan rak berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateStack");
  }
};

export const deleteStack = async (req: Request, res: Response) => {
  try {
    const stackId = resolveParam(req.params.id);

    if (!stackId) {
      return sendFail(res, 400, "ID susunan tidak valid");
    }

    const result = await stackService.deleteExistingStack(stackId);
    if (!result) {
      return sendFail(res, 404, "Susunan rak tidak ditemukan");
    }

    return sendSuccess(res, result, "Data susunan rak berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteStack");
  }
};
