import {
  generateSignature,
  getPaymentChannels,
  createTransaction,
  getTransactionDetail,
} from "@/utils/services/tripay";
import { generateTransactionCode } from "@/utils/generators/transaction-code";


afterEach(() => {
  jest.restoreAllMocks();
});

describe("Tripay Utils", () => {
  // ─── generateSignature ───────────────────────────────────────────────────
  describe("generateSignature()", () => {
    it("should return a hex string of HMAC-SHA256", () => {
      const merchantRef = "TRX-20260912-ABC123";
      const amount = 50000;

      const signature = generateSignature(merchantRef, amount);

      expect(typeof signature).toBe("string");
      expect(signature).toMatch(/^[a-f0-9]{64}$/); // HMAC-SHA256 = 64 hex chars
    });

    it("should return a different signature for different inputs", () => {
      const sig1 = generateSignature("TRX-001", 50000);
      const sig2 = generateSignature("TRX-002", 50000);

      expect(sig1).not.toBe(sig2);
    });

    it("should return the same signature for the same inputs (deterministic)", () => {
      const ref = "TRX-20260912-FIXED";
      const amount = 75000;

      expect(generateSignature(ref, amount)).toBe(
        generateSignature(ref, amount),
      );
    });
  });

  // ─── getPaymentChannels ──────────────────────────────────────────────────
  describe("getPaymentChannels()", () => {
    it("should call the correct Tripay endpoint with Bearer token", async () => {
      const mockResponse = {
        success: true,
        data: [
          { code: "BRIVA", name: "BRI Virtual Account", fee_customer: 4000 },
          { code: "BCAVA", name: "BCA Virtual Account", fee_customer: 4000 },
        ],
      };

      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await getPaymentChannels();

      const baseUrl = (process.env.TRIPAY_API_URL || "").replace(/\/+$/, "");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseUrl}/merchant/payment-channel`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
          }),
        }),
      );
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return the parsed JSON from fetch response", async () => {
      const mockResponse = { success: false, message: "Unauthorized" };

      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await getPaymentChannels();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Unauthorized");
    });
  });

  // ─── createTransaction ───────────────────────────────────────────────────
  describe("createTransaction()", () => {
    it("should call Tripay create endpoint with signature included in body", async () => {
      const mockReference = "T123456789";
      const mockResponse = {
        success: true,
        data: {
          reference: mockReference,
          payment_url: "https://tripay.co.id/checkout/T123456789",
        },
      };

      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const payload = {
        method: "BRIVA",
        merchant_ref: generateTransactionCode(),
        amount: 50000,
        customer_name: "Budi Santoso",
        customer_email: "budi@example.com",
        customer_phone: "081234567890",
        order_items: [
          {
            sku: "LIB-001",
            name: "Denda Terlambat",
            price: 50000,
            quantity: 1,
          },
        ],
        return_url: "https://domain.com/return",
      };

      const result = await createTransaction(payload);

      const baseUrl = (process.env.TRIPAY_API_URL || "").replace(/\/+$/, "");
      // Pastikan fetch dipanggil ke endpoint yang benar
      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseUrl}/transaction/create`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
            "Content-Type": "application/json",
          }),
        }),
      );

      // Pastikan signature di-inject ke body
      const callArgs = fetchSpy.mock.calls[0][1] as RequestInit;
      const sentBody = JSON.parse(callArgs.body as string);
      expect(sentBody).toHaveProperty("signature");
      expect(typeof sentBody.signature).toBe("string");
      expect(sentBody.signature.length).toBeGreaterThan(0);

      expect(result.success).toBe(true);
      expect(result.data.reference).toBe(mockReference);
    });

    it("should generate signature from merchant_ref and amount in payload", async () => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => ({ success: true, data: {} }),
      } as Response);

      const merchantRef = "TRX-20260912-SIG001";
      const amount = 100000;

      await createTransaction({
        method: "BRIVA",
        merchant_ref: merchantRef,
        amount,
      });

      // Hitung expected signature secara manual untuk verifikasi
      const expectedSignature = generateSignature(merchantRef, amount);

      const callArgs = (global.fetch as jest.Mock).mock
        .calls[0][1] as RequestInit;
      const sentBody = JSON.parse(callArgs.body as string);
      expect(sentBody.signature).toBe(expectedSignature);
    });
  });

  // ─── getTransactionDetail ────────────────────────────────────────────────
  describe("getTransactionDetail()", () => {
    it("should call Tripay detail endpoint with reference as query param", async () => {
      const reference = "T987654321";
      const mockResponse = {
        success: true,
        data: {
          reference,
          status: "PAID",
          amount: 50000,
        },
      };

      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await getTransactionDetail(reference);

      // Pastikan URL sudah mengandung query param reference
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("transaction/detail");
      expect(calledUrl).toContain(`reference=${reference}`);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
          }),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data.reference).toBe(reference);
      expect(result.data.status).toBe("PAID");
    });

    it("should handle non-existent reference gracefully", async () => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: async () => ({
          success: false,
          message: "Referensi tidak ditemukan",
        }),
      } as Response);

      const result = await getTransactionDetail("INVALID-REF");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Referensi tidak ditemukan");
    });
  });

  // ─── generateTransactionCode (generator) ────────────────────────────────
  describe("generateTransactionCode()", () => {
    it("should return a string in format TRX-YYYYMMDD-XXXXXX", () => {
      const code = generateTransactionCode();

      expect(typeof code).toBe("string");
      expect(code).toMatch(/^TRX-\d{8}-[A-Z0-9]{6}$/);
    });

    it("should return unique codes on each call", () => {
      const codes = new Set(
        Array.from({ length: 20 }, () => generateTransactionCode()),
      );
      // Dengan 6 karakter alphanumeric (36^6 kemungkinan), 20 kode hampir pasti unik
      expect(codes.size).toBe(20);
    });
  });
});
