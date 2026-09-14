import request from "supertest";
import app from "@/app";
import { memberToken } from "../helpers/auth.helper";

const mockDashboardResponse = {
  statistik: {
    bukuDipinjam: 2,
    totalDenda: 15000,
    totalBookmark: 8,
  },
  transaksiAktif: [
    {
      id: "trx-123",
      buku: {
        judul: "Atomic Habits",
        cover: "url-cover-1.jpg",
      },
      tglKembali: "2026-09-20T00:00:00.000Z",
      status: "Dipinjam",
    },
  ],
  tagihanDenda: [
    {
      id: "pay-123",
      totalDenda: 15000,
      checkoutUrl: "https://tripay.co.id/checkout/...",
    },
  ],
  bookmarkTerbaru: [
    {
      id: "bm-123",
      buku: {
        judul: "Filosofi Teras",
        penulis: "Henry Manampiring",
        cover: "url-cover-2.jpg",
      },
    },
  ],
};

jest.mock("@/controllers/member/dashboard.controller", () => ({
  getMemberDashboard: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      message: "Data dashboard member berhasil diambil",
      ...mockDashboardResponse,
    }),
  ),
}));

describe("Member Dashboard Endpoints", () => {
  let token: string;

  beforeAll(() => {
    token = memberToken();
  });

  // ─── GET /api/member/dashboard ──────────────────────────────────────────
  describe("GET /api/member/dashboard", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/member/dashboard");
      expect(res.status).toBe(401);
    });

    it("should return member dashboard data with status 200", async () => {
      const res = await request(app)
        .get("/api/member/dashboard")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Data dashboard member berhasil diambil");

      // Verify statistik
      expect(res.body).toHaveProperty("statistik");
      expect(res.body.statistik).toHaveProperty("bukuDipinjam", 2);
      expect(res.body.statistik).toHaveProperty("totalDenda", 15000);
      expect(res.body.statistik).toHaveProperty("totalBookmark", 8);

      // Verify transaksiAktif
      expect(res.body).toHaveProperty("transaksiAktif");
      expect(Array.isArray(res.body.transaksiAktif)).toBe(true);
      expect(res.body.transaksiAktif[0]).toMatchObject({
        id: "trx-123",
        buku: {
          judul: "Atomic Habits",
          cover: "url-cover-1.jpg",
        },
        tglKembali: "2026-09-20T00:00:00.000Z",
        status: "Dipinjam",
      });

      // Verify tagihanDenda
      expect(res.body).toHaveProperty("tagihanDenda");
      expect(Array.isArray(res.body.tagihanDenda)).toBe(true);
      expect(res.body.tagihanDenda[0]).toMatchObject({
        id: "pay-123",
        totalDenda: 15000,
        checkoutUrl: "https://tripay.co.id/checkout/...",
      });

      // Verify bookmarkTerbaru
      expect(res.body).toHaveProperty("bookmarkTerbaru");
      expect(Array.isArray(res.body.bookmarkTerbaru)).toBe(true);
      expect(res.body.bookmarkTerbaru[0]).toMatchObject({
        id: "bm-123",
        buku: {
          judul: "Filosofi Teras",
          penulis: "Henry Manampiring",
          cover: "url-cover-2.jpg",
        },
      });
    });
  });
});
