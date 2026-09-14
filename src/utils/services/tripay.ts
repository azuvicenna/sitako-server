import { createHmac } from 'crypto';

export interface CreateTransactionPayload {
  merchant_ref: string;
  amount: number;
  [key: string]: unknown;
}

export interface TripayResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || '';
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || '';
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || '';
const TRIPAY_API_URL = (process.env.TRIPAY_API_URL || '').replace(/\/+$/, '');

const getHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${TRIPAY_API_KEY}`,
  'Content-Type': 'application/json',
});

export const generateSignature = (merchantRef: string, amount: number): string => {
  const payload = `${TRIPAY_MERCHANT_CODE}${merchantRef}${amount}`;
  return createHmac('sha256', TRIPAY_PRIVATE_KEY).update(payload).digest('hex');
};

export const getPaymentChannels = async <T = unknown>(): Promise<TripayResponse<T>> => {
  const response = await fetch(`${TRIPAY_API_URL}/merchant/payment-channel`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TRIPAY_API_KEY}`,
    },
  });

  return response.json();
};

export const createTransaction = async <T = unknown>(
  data: CreateTransactionPayload,
): Promise<TripayResponse<T>> => {
  const signature = generateSignature(data.merchant_ref, data.amount);

  const response = await fetch(`${TRIPAY_API_URL}/transaction/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      ...data,
      signature,
    }),
  });

  return response.json();
};

export const getTransactionDetail = async <T = unknown>(
  reference: string,
): Promise<TripayResponse<T>> => {
  const endpoint = `${TRIPAY_API_URL}/transaction/detail?reference=${encodeURIComponent(
    reference,
  )}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TRIPAY_API_KEY}`,
    },
  });

  return response.json();
};
