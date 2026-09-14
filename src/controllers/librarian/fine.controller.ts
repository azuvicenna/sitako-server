import { Request, Response } from 'express';
import * as fineService from '@/services/librarian/fine.service';
import { resolveParam } from '@/utils/core/param';
import { getPaginationParams, sendError, sendFail, sendSuccess } from '@/utils/core/handler';

export const getFinesHandler = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = getPaginationParams(req.query);
    const result = await fineService.getFinesWithPagination(page, limit, search);

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, 'getFinesHandler');
  }
};

export const showFine = async (req: Request, res: Response) => {
  try {
    const fineId = resolveParam(req.params.id);

    if (!fineId) {
      return sendFail(res, 400, 'ID denda tidak valid');
    }

    const result = await fineService.getFineById(fineId);
    if (!result) {
      return sendFail(res, 404, 'Denda tidak ditemukan');
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, 'showFine');
  }
};

export const createFine = async (req: Request, res: Response) => {
  try {
    const result = await fineService.createNewFine(req.body ?? {});

    return sendSuccess(res, result, 'Denda berhasil ditambahkan');
  } catch (error) {
    return sendError(res, error, 'createFine');
  }
};

export const updateFine = async (req: Request, res: Response) => {
  try {
    const fineId = resolveParam(req.params.id);

    if (!fineId) {
      return sendFail(res, 400, 'ID denda tidak valid');
    }

    const result = await fineService.updateExistingFine(fineId, req.body ?? {});

    if (!result) {
      return sendFail(res, 404, 'Denda tidak ditemukan');
    }

    return sendSuccess(res, result, 'Data denda berhasil diperbarui');
  } catch (error) {
    return sendError(res, error, 'updateFine');
  }
};

export const deleteFine = async (req: Request, res: Response) => {
  try {
    const fineId = resolveParam(req.params.id);

    if (!fineId) {
      return sendFail(res, 400, 'ID denda tidak valid');
    }

    const result = await fineService.deleteExistingFine(fineId);
    if (!result) {
      return sendFail(res, 404, 'Denda tidak ditemukan');
    }

    return sendSuccess(res, result, 'Data denda berhasil dihapus');
  } catch (error) {
    return sendError(res, error, 'deleteFine');
  }
};
