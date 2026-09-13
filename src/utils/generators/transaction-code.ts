import { randomInt } from "crypto";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateTransactionCode = (length = 6): string => {
  const safeLength = Math.max(1, length);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  let randomString = "";
  for (let i = 0; i < safeLength; i++) {
    randomString += CHARACTERS[randomInt(0, CHARACTERS.length)];
  }

  return `TRX-${year}${month}${date}-${randomString}`;
};
