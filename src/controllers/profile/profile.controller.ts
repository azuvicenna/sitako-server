import { Request, Response } from "express";
import * as librarianService from "@/services/librarian/librarian.service";
import * as memberService from "@/services/librarian/member.service";
import { sendError, sendFail, sendSuccess } from "@/utils/core/handler";
import {
  imageFileSchema,
  updateLibrarianSchema,
} from "@/validations/librarian/librarian.schema";
import { updateMemberSchema } from "@/validations/librarian/member.schema";

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const result =
      role === "Pustakawan"
        ? await librarianService.getLibrarianById(userId)
        : await memberService.getMemberById(userId);

    if (!result) {
      return sendFail(res, 404, "Profil tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getMyProfile");
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const validatedFile = req.file
      ? imageFileSchema.parse(req.file)
      : undefined;

    const result =
      role === "Pustakawan"
        ? await librarianService.updateExistingLibrarian(
            userId,
            updateLibrarianSchema.parse(req.body),
            validatedFile,
          )
        : await memberService.updateExistingMember(
            userId,
            updateMemberSchema.parse(req.body),
            validatedFile,
          );

    if (!result) {
      return sendFail(res, 404, "Profil tidak ditemukan");
    }

    return sendSuccess(res, result, "Profil berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateMyProfile");
  }
};
