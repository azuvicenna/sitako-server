import {
  getMemberDashboardRepo,
  type MemberDashboardData,
} from '@/repositories/member/dashboard.repository';

export const getMemberDashboardService = async (memberId: string): Promise<MemberDashboardData> => {
  return getMemberDashboardRepo(memberId);
};
