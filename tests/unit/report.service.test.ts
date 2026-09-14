import * as fs from "fs/promises";
import * as typstHelper from "@/utils/services/typst";
import * as reportRepo from "@/repositories/librarian/report.repository";
import {
  escapeTypst,
  exportCirculationCsv,
  exportCirculationExcel,
  exportFineCsv,
  exportFineExcel,
  exportReportPdf,
  formatDateIndo,
  getCirculationReport,
  getFineReport,
} from "@/services/librarian/report.service";

jest.mock("fs/promises");
jest.mock("@/utils/services/typst");
jest.mock("@/repositories/librarian/report.repository");

describe("Report Service Unit Tests", () => {
  const mockCirculation = [
    {
      kdTransaksi: "TRX-001",
      namaPeminjam: "Ahmad_Siswa",
      judulBuku: "Buku #1 [Edisi Baru]",
      tglPinjam: new Date("2026-09-01T08:00:00.000Z"),
      tglKembali: new Date("2026-09-08T08:00:00.000Z"),
      status: "Dikembalikan",
    },
  ];

  const mockFines = [
    {
      namaPeminjam: "Ahmad_Siswa",
      judulBuku: "Buku #1 [Edisi Baru]",
      totalDenda: 5000,
      metodePembayaran: "Tunai",
      paymentStatus: "PAID",
      tglBayar: new Date("2026-09-08T08:30:00.000Z"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (reportRepo.getCirculationReport as jest.Mock).mockResolvedValue(
      mockCirculation,
    );
    (reportRepo.getFineReport as jest.Mock).mockResolvedValue(mockFines);
  });

  describe("formatDateIndo", () => {
    it("should format valid Date to DD/MM/YYYY", () => {
      const date = new Date("2026-09-14T00:00:00.000Z");
      expect(formatDateIndo(date)).toMatch(/\d{2}\/\d{2}\/2026/);
    });

    it("should return '-' for null or undefined", () => {
      expect(formatDateIndo(null)).toBe("-");
      expect(formatDateIndo(undefined)).toBe("-");
    });

    it("should return '-' for invalid date", () => {
      expect(formatDateIndo("invalid-date")).toBe("-");
    });
  });

  describe("escapeTypst", () => {
    it("should escape special typst characters", () => {
      expect(escapeTypst("Judul #1 [Spesial] *Tebal* _Miring_ \\Backslash")).toBe(
        "Judul \\#1 \\[Spesial\\] \\*Tebal\\* \\_Miring\\_ \\\\Backslash",
      );
    });

    it("should return '-' for null or undefined", () => {
      expect(escapeTypst(null)).toBe("-");
      expect(escapeTypst(undefined)).toBe("-");
    });

    it("should convert number to string", () => {
      expect(escapeTypst(1000)).toBe("1000");
    });
  });

  describe("getCirculationReport & getFineReport", () => {
    it("should return circulation data from repo", async () => {
      const result = await getCirculationReport({});
      expect(result).toEqual(mockCirculation);
      expect(reportRepo.getCirculationReport).toHaveBeenCalled();
    });

    it("should return fine data from repo", async () => {
      const result = await getFineReport({});
      expect(result).toEqual(mockFines);
      expect(reportRepo.getFineReport).toHaveBeenCalled();
    });
  });

  describe("Excel & CSV exports", () => {
    it("should export circulation to Excel buffer", async () => {
      const buffer = await exportCirculationExcel({});
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should export circulation to CSV buffer", async () => {
      const buffer = await exportCirculationCsv({});
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString("utf-8")).toContain("TRX-001");
    });

    it("should export fines to Excel buffer", async () => {
      const buffer = await exportFineExcel({});
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should export fines to CSV buffer", async () => {
      const buffer = await exportFineCsv({});
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString("utf-8")).toContain("5000");
    });
  });

  describe("exportReportPdf", () => {
    it("should compile and return PDF buffer with populated data", async () => {
      const mockPdfPath = "src/templates/typst/laporan_123.pdf";
      const mockPdfBuffer = Buffer.from("pdf-content");

      (typstHelper.compileTypstFile as jest.Mock).mockResolvedValue(
        mockPdfPath,
      );
      (fs.readFile as jest.Mock).mockResolvedValue(mockPdfBuffer);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await exportReportPdf(
        {
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-09-14"),
        },
        "Pustakawan SITAKO",
      );

      expect(typstHelper.compileTypstFile).toHaveBeenCalledWith(
        "typst/laporan-sirkulasi-denda.typ",
        expect.objectContaining({
          namaSekolah: "Perpustakaan SITAKO",
          namaPustakawan: "Pustakawan SITAKO",
        }),
      );
      expect(fs.readFile).toHaveBeenCalledWith(mockPdfPath);
      expect(fs.unlink).toHaveBeenCalledWith(mockPdfPath);
      expect(result).toEqual(mockPdfBuffer);
    });

    it("should compile PDF buffer with placeholder when datasets are empty", async () => {
      (reportRepo.getCirculationReport as jest.Mock).mockResolvedValue([]);
      (reportRepo.getFineReport as jest.Mock).mockResolvedValue([]);

      const mockPdfPath = "src/templates/typst/laporan_empty.pdf";
      (typstHelper.compileTypstFile as jest.Mock).mockResolvedValue(
        mockPdfPath,
      );
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from("empty-pdf"));
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await exportReportPdf({});

      expect(typstHelper.compileTypstFile).toHaveBeenCalledWith(
        "typst/laporan-sirkulasi-denda.typ",
        expect.objectContaining({
          barisSirkulasi: expect.stringContaining(
            "Tidak ada data pada periode ini.",
          ),
          barisDenda: expect.stringContaining(
            "Tidak ada data pada periode ini.",
          ),
          periodeLaporan: "Semua Periode",
        }),
      );
    });
  });
});
