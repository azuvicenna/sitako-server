import { Request, Response } from "express";
import * as memberService from "@/services/librarian/member.service";
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

export const getMemberHandler = async (req: Request, res: Response) => {
  try {
    const { statusActive } = req.query;

    if (!isValidStatusActive(statusActive)) {
      return sendFail(res, 400, "Status aktif tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await memberService.getMembersWithPagination(
      statusActive,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getMemberHandler");
  }
};

export const showMember = async (req: Request, res: Response) => {
  try {
    const memberId = resolveParam(req.params.id);

    if (!memberId) {
      return sendFail(res, 400, "ID anggota tidak valid");
    }

    const result = await memberService.getMemberById(memberId);
    if (!result) {
      return sendFail(res, 404, "Anggota tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showMember");
  }
};

export const createMember = async (req: Request, res: Response) => {
  try {
    const validatedFile = imageFileSchema.parse(req.file);
    const result = await memberService.createNewMember(
      req.body ?? {},
      validatedFile,
    );

    return sendSuccess(res, result, "Anggota berhasil ditambahkan");
  } catch (error) {
    return sendError(res, error, "createMember");
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const memberId = resolveParam(req.params.id);

    if (!memberId) {
      return sendFail(res, 400, "ID anggota tidak valid");
    }

    const validatedFile = req.file
      ? imageFileSchema.parse(req.file)
      : undefined;

    const result = await memberService.updateExistingMember(
      memberId,
      req.body ?? {},
      validatedFile,
    );

    if (!result) {
      return sendFail(res, 404, "Anggota tidak ditemukan");
    }

    return sendSuccess(res, result, "Data anggota berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateMember");
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const memberId = resolveParam(req.params.id);

    if (!memberId) {
      return sendFail(res, 400, "ID anggota tidak valid");
    }

    const result = await memberService.deleteExistingMember(memberId);
    if (!result) {
      return sendFail(res, 404, "Anggota tidak ditemukan");
    }

    return sendSuccess(res, result, "Data anggota berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteMember");
  }
};
