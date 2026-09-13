import {
  insertShelf,
  updateShelfById,
  findShelf,
  removeShelfById,
  findShelvesWithPagination,
  type ShelfInsert,
} from "@/repositories/librarian/shelf.repository";
import type {
  CreateShelf,
  UpdateShelf,
} from "@/validations/librarian/shelf.schema";

export const getShelvesWithPagination = async (
  page: number,
  limit: number,
  search: string,
) => {
  return findShelvesWithPagination(page, limit, search);
};

export const getShelfById = async (id: string) => {
  return findShelf(id);
};

export const createNewShelf = async (payload: CreateShelf) => {
  const shelfData: ShelfInsert = { ...payload };
  return insertShelf(shelfData);
};

export const updateExistingShelf = async (id: string, payload: UpdateShelf) => {
  const existingShelf = await findShelf(id);
  if (!existingShelf) return null;

  if (Object.keys(payload).length === 0) {
    return existingShelf;
  }

  const updateData: Partial<ShelfInsert> = { ...payload };
  return updateShelfById(id, updateData);
};

export const deleteExistingShelf = async (id: string) => {
  return removeShelfById(id);
};
