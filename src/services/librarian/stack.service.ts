import {
  insertStack,
  updateStackById,
  findStack,
  removeStackById,
  findStacksWithPagination,
  type StackInsert,
} from '@/repositories/librarian/stack.repository';
import type { CreateStack, UpdateStack } from '@/validations/librarian/stack.schema';

export const getStacksWithPagination = async (
  shelfId: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findStacksWithPagination(shelfId, page, limit, search);
};

export const getStackById = async (id: string) => {
  return findStack(id);
};

export const createNewStack = async (payload: CreateStack) => {
  const stackData: StackInsert = { ...payload };
  return insertStack(stackData);
};

export const updateExistingStack = async (id: string, payload: UpdateStack) => {
  const existingStack = await findStack(id);
  if (!existingStack) return null;

  if (Object.keys(payload).length === 0) {
    return existingStack;
  }

  const updateData: Partial<StackInsert> = { ...payload };
  return updateStackById(id, updateData);
};

export const deleteExistingStack = async (id: string) => {
  return removeStackById(id);
};
