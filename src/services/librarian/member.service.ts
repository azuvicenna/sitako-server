import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import {
  insertMember,
  updateMemberById,
  findMemberById,
  findMemberRawById,
  removeMemberById,
  findMembersWithPagination,
  type MemberInsert,
} from '@/repositories/librarian/member.repository';
import { deleteFile, uploadFile } from '@/utils/services/storage';
import type { CreateMember, UpdateMember } from '@/validations/librarian/member.schema';
import logger from '@/utils/core/logger';

const extractFileKey = (url: string) => url.split('/').slice(-2).join('/');

const safeDeleteFile = async (url?: string | null, label = 'file') => {
  if (!url) return;
  try {
    await deleteFile(extractFileKey(url));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to delete ${label} (${url}): ${message}`);
  }
};

const uploadWithUniqueName = async (folder: string, file: Express.Multer.File) => {
  const ext = file.originalname.split('.').pop();
  const filename = ext ? `${uuidv4()}.${ext}` : uuidv4();
  return uploadFile(folder, file, filename);
};

export const getMembersWithPagination = async (
  statusActive: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findMembersWithPagination(statusActive, page, limit, search);
};

export const getMemberById = async (id: string) => {
  return findMemberById(id);
};

export const createNewMember = async (payload: CreateMember, photoFile?: Express.Multer.File) => {
  let photoUrl = '';

  try {
    if (photoFile) {
      photoUrl = await uploadWithUniqueName('profiles', photoFile);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const memberData: MemberInsert = {
      nama: payload.nama,
      nis: payload.nis,
      email: payload.email,
      password: hashedPassword,
      telepon: payload.telepon,
      foto: photoUrl,
      status_aktif: payload.status_aktif ?? true,
    };

    const created = await insertMember(memberData);
    const { password: _, ...memberWithoutPassword } = created;

    return memberWithoutPassword;
  } catch (error) {
    if (photoUrl) {
      await safeDeleteFile(photoUrl, 'orphaned profile photo');
    }
    throw error;
  }
};

export const updateExistingMember = async (
  id: string,
  payload: UpdateMember,
  photoFile?: Express.Multer.File,
) => {
  const existingMember = await findMemberRawById(id);
  if (!existingMember) return null;

  const updateData: Partial<MemberInsert> = { ...payload };
  let newPhotoUrl: string | undefined;

  try {
    if (payload.password) {
      updateData.password = await bcrypt.hash(payload.password, 10);
    }

    if (photoFile) {
      newPhotoUrl = await uploadWithUniqueName('profiles', photoFile);
      updateData.foto = newPhotoUrl;
    }

    if (Object.keys(updateData).length === 0) {
      const { password: _, ...memberWithoutPassword } = existingMember;
      return memberWithoutPassword;
    }

    const updated = await updateMemberById(id, updateData);
    if (!updated) return null;

    if (photoFile && existingMember.foto) {
      await safeDeleteFile(existingMember.foto, 'old profile photo');
    }

    const { password: _, ...memberWithoutPassword } = updated;
    return memberWithoutPassword;
  } catch (error) {
    if (newPhotoUrl) {
      await safeDeleteFile(newPhotoUrl, 'orphaned profile photo');
    }
    throw error;
  }
};

export const deleteExistingMember = async (id: string) => {
  const member = await findMemberRawById(id);
  if (!member) return null;

  const deleted = await removeMemberById(id);

  if (deleted && member.foto) {
    await safeDeleteFile(member.foto, 'profile photo on delete');
  }

  return deleted;
};
