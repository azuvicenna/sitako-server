import { Request, Response } from 'express';
import * as shelfService from '@/services/librarian/shelf.service';
import { resolveParam } from '@/utils/core/param';
import { getPaginationParams, sendError, sendFail, sendSuccess } from '@/utils/core/handler';

export const getShelvesHandler = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = getPaginationParams(req.query);
    const result = await shelfService.getShelvesWithPagination(page, limit, search);

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, 'getShelvesHandler');
  }
};

export const showShelf = async (req: Request, res: Response) => {
  try {
    const shelfId = resolveParam(req.params.id);

    if (!shelfId) {
      return sendFail(res, 400, 'ID rak buku tidak valid');
    }

    const result = await shelfService.getShelfById(shelfId);
    if (!result) {
      return sendFail(res, 404, 'Rak buku tidak ditemukan');
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, 'showShelf');
  }
};

export const createShelf = async (req: Request, res: Response) => {
  try {
    const result = await shelfService.createNewShelf(req.body ?? {});

    return sendSuccess(res, result, 'Rak buku berhasil ditambahkan');
  } catch (error) {
    return sendError(res, error, 'createShelf');
  }
};

export const updateShelf = async (req: Request, res: Response) => {
  try {
    const shelfId = resolveParam(req.params.id);

    if (!shelfId) {
      return sendFail(res, 400, 'ID rak buku tidak valid');
    }

    const result = await shelfService.updateExistingShelf(shelfId, req.body ?? {});

    if (!result) {
      return sendFail(res, 404, 'Rak buku tidak ditemukan');
    }

    return sendSuccess(res, result, 'Data rak buku berhasil diperbarui');
  } catch (error) {
    return sendError(res, error, 'updateShelf');
  }
};

export const deleteShelf = async (req: Request, res: Response) => {
  try {
    const shelfId = resolveParam(req.params.id);

    if (!shelfId) {
      return sendFail(res, 400, 'ID rak buku tidak valid');
    }

    const result = await shelfService.deleteExistingShelf(shelfId);
    if (!result) {
      return sendFail(res, 404, 'Rak buku tidak ditemukan');
    }

    return sendSuccess(res, result, 'Data rak buku berhasil dihapus');
  } catch (error) {
    return sendError(res, error, 'deleteShelf');
  }
};
