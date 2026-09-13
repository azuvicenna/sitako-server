import {
  insertFinePayment,
  updateFinePaymentById,
  findFinePayment,
  removeFinePaymentById,
  findFinePaymentsWithPagination,
  type FinePaymentInsert,
} from "@/repositories/librarian/fine-payment.repository";
import type {
  CreateFinePayment,
  UpdateFinePayment,
} from "@/validations/librarian/fine-payment.schema";

export const getFinePaymentsWithPagination = async (
  page: number,
  limit: number,
  search: string,
) => {
  return findFinePaymentsWithPagination(page, limit, search);
};

export const getFinePaymentById = async (id: string) => {
  return findFinePayment(id);
};

export const createNewFinePayment = async (payload: CreateFinePayment) => {
  const paymentData: FinePaymentInsert = {
    ...payload,
    paymentStatus: "PAID",
    tglBayar: payload.tglBayar ?? new Date(),
  };

  return insertFinePayment(paymentData);
};

export const updateExistingFinePayment = async (
  id: string,
  payload: UpdateFinePayment,
) => {
  const existingPayment = await findFinePayment(id);
  if (!existingPayment) return null;

  if (Object.keys(payload).length === 0) {
    return existingPayment;
  }

  const updateData: Partial<FinePaymentInsert> = { ...payload };
  return updateFinePaymentById(id, updateData);
};

export const deleteExistingFinePayment = async (id: string) => {
  return removeFinePaymentById(id);
};
