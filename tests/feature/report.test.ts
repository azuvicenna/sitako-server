import request from "supertest";
import app from "@/app";
import { librarianToken } from "../helpers/auth.helper";

const mockCirculation = {
  kdTransaksi: "TRX-20260901-001",
  namaPeminjam: "Ahmad Siswa",
  judulBuku: "Laskar Pelangi",
  tglPinjam: "2026-09-01T08:00:00.000Z",
  tglKembali: "2026-09-08T08:00:00.000Z",
  status: "Dikembalikan",
};

const mockFine = {
  namaPeminjam: "Ahmad Siswa",
  judulBuku: "Laskar Pelangi",
  totalDenda: 5000,
  metodePembayaran: "Tunai",
  paymentStatus: "PAID",
  tglBayar: "2026-09-08T08:30:00.000Z",
};

jest.mock("@/controllers/librarian/report.controller", () => ({
  getCirculationReportHandler: jest.fn((req, res) => {
    const format = req.query.format || "json";
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-sirkulasi.csv"',
      );
      return res.status(200).send("Kode Transaksi,Nama Peminjam\n");
    }
    if (format === "xlsx") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-sirkulasi.xlsx"',
      );
      return res.status(200).send(Buffer.from("mock-xlsx"));
    }
    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-sirkulasi-denda.pdf"',
      );
      return res.status(200).send(Buffer.from("mock-pdf"));
    }
    return res.status(200).json({
      success: true,
      message: "Data retrieved successfully",
      data: [mockCirculation],
    });
  }),
  getFineReportHandler: jest.fn((req, res) => {
    const format = req.query.format || "json";
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-denda.csv"',
      );
      return res.status(200).send("Nama Peminjam,Total Denda\n");
    }
    if (format === "xlsx") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-denda.xlsx"',
      );
      return res.status(200).send(Buffer.from("mock-xlsx"));
    }
    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="laporan-sirkulasi-denda.pdf"',
      );
      return res.status(200).send(Buffer.from("mock-pdf"));
    }
    return res.status(200).json({
      success: true,
      message: "Data retrieved successfully",
      data: [mockFine],
    });
  }),
}));

describe("Report Endpoints (Librarian)", () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  describe("GET /api/reports/circulation", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/reports/circulation");
      expect(res.status).toBe(401);
    });

    it("should return 400 when date format is invalid", async () => {
      const res = await request(app)
        .get("/api/reports/circulation?startDate=invalid-date")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when startDate is greater than endDate", async () => {
      const res = await request(app)
        .get(
          "/api/reports/circulation?startDate=2026-09-15&endDate=2026-09-01",
        )
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 200 with json data by default", async () => {
      const res = await request(app)
        .get(
          "/api/reports/circulation?startDate=2026-09-01&endDate=2026-09-14",
        )
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return 200 with csv format", async () => {
      const res = await request(app)
        .get("/api/reports/circulation?format=csv")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain(
        'filename="laporan-sirkulasi.csv"',
      );
    });

    it("should return 200 with xlsx format", async () => {
      const res = await request(app)
        .get("/api/reports/circulation?format=xlsx")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(res.headers["content-disposition"]).toContain(
        'filename="laporan-sirkulasi.xlsx"',
      );
    });

    it("should return 200 with pdf format", async () => {
      const res = await request(app)
        .get("/api/reports/circulation?format=pdf")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain(
        'filename="laporan-sirkulasi-denda.pdf"',
      );
    });
  });

  describe("GET /api/reports/fines", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/reports/fines");
      expect(res.status).toBe(401);
    });

    it("should return 400 when startDate is greater than endDate", async () => {
      const res = await request(app)
        .get("/api/reports/fines?startDate=2026-09-20&endDate=2026-09-01")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 200 with json data by default", async () => {
      const res = await request(app)
        .get("/api/reports/fines?startDate=2026-09-01&endDate=2026-09-14")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return 200 with csv format", async () => {
      const res = await request(app)
        .get("/api/reports/fines?format=csv")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should return 200 with xlsx format", async () => {
      const res = await request(app)
        .get("/api/reports/fines?format=xlsx")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    });

    it("should return 200 with pdf format", async () => {
      const res = await request(app)
        .get("/api/reports/fines?format=pdf")
        .set("Cookie", `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
    });
  });
});
