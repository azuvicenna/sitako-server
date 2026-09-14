import { Request, Response } from "express";
import { getMemberDashboardService } from "@/services/member/dashboard.service";
import { sendError, sendFail, sendSuccess } from "@/utils/core/handler";

export const getMemberDashboard = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const result = await getMemberDashboardService(memberId);
    return sendSuccess(res, result, "Data dashboard member berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getMemberDashboard");
  }
};
