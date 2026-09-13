import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import {
  insertLibrarian,
  updateLibrarianById,
  findLibrarianById,
  findLibrarianRawById,
  removeLibrarianById,
  findLibrariansWithPagination,
  type LibrarianInsert,
} from "@/repositories/librarian/librarian.repository";
import { deleteFile, uploadFile } from "@/utils/services/storage";
import type {
  CreateLibrarian,
  UpdateLibrarian,
} from "@/validations/librarian/librarian.schema";
import logger from "@/utils/core/logger";

const extractFileKey = (url: string) => url.split("/").slice(-2).join("/");

const safeDeleteFile = async (url?: string | null, label = "file") => {
  if (!url) return;
  try {
    await deleteFile(extractFileKey(url));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to delete ${label} (${url}): ${message}`);
  }
};

const uploadWithUniqueName = async (
  folder: string,
  file: Express.Multer.File,
) => {
  const ext = file.originalname.split(".").pop();
  const filename = ext ? `${uuidv4()}.${ext}` : uuidv4();
  return uploadFile(folder, file, filename);
};

export const getLibrariansWithPagination = async (
  statusActive: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findLibrariansWithPagination(statusActive, page, limit, search);
};

export const getLibrarianById = async (id: string) => {
  return findLibrarianById(id);
};

export const createNewLibrarian = async (
  payload: CreateLibrarian,
  photoFile?: Express.Multer.File,
) => {
  let photoUrl = "";

  try {
    if (photoFile) {
      photoUrl = await uploadWithUniqueName("profiles", photoFile);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const librarianData: LibrarianInsert = {
      nama: payload.nama,
      nip: payload.nip,
      email: payload.email,
      password: hashedPassword,
      telepon: payload.telepon,
      foto: photoUrl,
      status_aktif: payload.status_aktif ?? true,
    };

    const created = await insertLibrarian(librarianData);
    const { password: _, ...librarianWithoutPassword } = created;

    return librarianWithoutPassword;
  } catch (error) {
    if (photoUrl) {
      await safeDeleteFile(photoUrl, "orphaned profile photo");
    }
    throw error;
  }
};

export const updateExistingLibrarian = async (
  id: string,
  payload: UpdateLibrarian,
  photoFile?: Express.Multer.File,
) => {
  const existingLibrarian = await findLibrarianRawById(id);
  if (!existingLibrarian) return null;

  const updateData: Partial<LibrarianInsert> = { ...payload };
  let newPhotoUrl: string | undefined;

  try {
    if (payload.password) {
      updateData.password = await bcrypt.hash(payload.password, 10);
    }

    if (photoFile) {
      newPhotoUrl = await uploadWithUniqueName("profiles", photoFile);
      updateData.foto = newPhotoUrl;
    }

    if (Object.keys(updateData).length === 0) {
      const { password: _, ...librarianWithoutPassword } = existingLibrarian;
      return librarianWithoutPassword;
    }

    const updated = await updateLibrarianById(id, updateData);
    if (!updated) return null;

    if (photoFile && existingLibrarian.foto) {
      await safeDeleteFile(existingLibrarian.foto, "old profile photo");
    }

    const { password: _, ...librarianWithoutPassword } = updated;
    return librarianWithoutPassword;
  } catch (error) {
    if (newPhotoUrl) {
      await safeDeleteFile(newPhotoUrl, "orphaned profile photo");
    }
    throw error;
  }
};

export const deleteExistingLibrarian = async (id: string) => {
  const existingLibrarian = await findLibrarianRawById(id);
  if (!existingLibrarian) return null;

  const deleted = await removeLibrarianById(id);

  if (deleted && existingLibrarian.foto) {
    await safeDeleteFile(existingLibrarian.foto, "profile photo on delete");
  }

  return deleted;
};
