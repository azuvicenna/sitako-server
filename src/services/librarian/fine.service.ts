import {
  insertFine,
  updateFineById,
  findFine,
  removeFineById,
  findFinesWithPagination,
  type FineInsert,
} from "@/repositories/librarian/fine.repository";
import type {
  CreateFine,
  UpdateFine,
} from "@/validations/librarian/fine.schema";

export const getFinesWithPagination = async (
  page: number,
  limit: number,
  search: string,
) => {
  return findFinesWithPagination(page, limit, search);
};

export const getFineById = async (id: string) => {
  return findFine(id);
};

export const createNewFine = async (payload: CreateFine) => {
  const fineData: FineInsert = { ...payload };
  return insertFine(fineData);
};

export const updateExistingFine = async (id: string, payload: UpdateFine) => {
  const existingFine = await findFine(id);
  if (!existingFine) return null;

  if (Object.keys(payload).length === 0) {
    return existingFine;
  }

  const updateData: Partial<FineInsert> = { ...payload };
  return updateFineById(id, updateData);
};

export const deleteExistingFine = async (id: string) => {
  const existingFine = await findFine(id);
  if (!existingFine) return null;

  return removeFineById(id);
};
