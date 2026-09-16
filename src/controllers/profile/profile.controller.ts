import { Request, Response } from 'express';
import { getProfileService, updateProfileService } from '@/services/profile/profile.service';
import { sendError, sendFail, sendSuccess } from '@/utils/core/handler';
import { imageFileSchema } from '@/validations/librarian/librarian.schema';

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return sendFail(res, 401, 'Pengguna tidak terautentikasi');
    }

    const result = await getProfileService(userId, role);

    if (!result) {
      return sendFail(res, 404, 'Profil tidak ditemukan');
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, 'getMyProfile');
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return sendFail(res, 401, 'Pengguna tidak terautentikasi');
    }

    const validatedFile = req.file ? imageFileSchema.parse(req.file) : undefined;
    const result = await updateProfileService(userId, role, req.body, validatedFile);

    if (!result) {
      return sendFail(res, 404, 'Profil tidak ditemukan');
    }

    return sendSuccess(res, result, 'Profil berhasil diperbarui');
  } catch (error) {
    return sendError(res, error, 'updateMyProfile');
  }
};
