import * as librarianService from '@/services/librarian/librarian.service';
import * as memberService from '@/services/librarian/member.service';
import { updateLibrarianSchema } from '@/validations/librarian/librarian.schema';
import { updateMemberSchema } from '@/validations/librarian/member.schema';

interface RoleProfileStrategy {
  getProfile: (id: string) => Promise<unknown>;
  updateProfile: (id: string, data: unknown, file?: Express.Multer.File) => Promise<unknown>;
}

const profileStrategies: Record<string, RoleProfileStrategy> = {
  pustakawan: {
    getProfile: (id: string) => librarianService.getLibrarianById(id),
    updateProfile: (id: string, data: unknown, file?: Express.Multer.File) =>
      librarianService.updateExistingLibrarian(id, updateLibrarianSchema.parse(data), file),
  },
  anggota: {
    getProfile: (id: string) => memberService.getMemberById(id),
    updateProfile: (id: string, data: unknown, file?: Express.Multer.File) =>
      memberService.updateExistingMember(id, updateMemberSchema.parse(data), file),
  },
};

export const getProfileService = async (userId: string, role: string) => {
  const strategy = profileStrategies[role.toLowerCase()];
  if (!strategy) return null;
  return strategy.getProfile(userId);
};

export const updateProfileService = async (
  userId: string,
  role: string,
  data: unknown,
  file?: Express.Multer.File,
) => {
  const strategy = profileStrategies[role.toLowerCase()];
  if (!strategy) return null;
  return strategy.updateProfile(userId, data, file);
};
