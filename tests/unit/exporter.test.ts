import * as XLSX from "xlsx";
import { generateCsvBuffer, generateExcelBuffer } from "@/utils/excel/exporter";

describe("Excel & CSV Exporter Unit Tests", () => {
  type TestItem = {
    id: string;
    nama: string;
    nilai: number;
    tanggal: string;
  };

  const sampleData: TestItem[] = [
    { id: "1", nama: "Budi", nilai: 10000, tanggal: "01/09/2026" },
    { id: "2", nama: "Siti", nilai: 25000, tanggal: "02/09/2026" },
  ];

  const columns = [
    { header: "ID", key: "id" as const },
    { header: "Nama", key: "nama" as const },
    { header: "Nilai", key: "nilai" as const },
    { header: "Tanggal", key: "tanggal" as const },
  ];

  describe("generateExcelBuffer", () => {
    it("should generate a valid XLSX buffer with sheet name and content", () => {
      const buffer = generateExcelBuffer(sampleData, columns, "Test Sheet");

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: "buffer" });
      expect(workbook.SheetNames).toContain("Test Sheet");

      const sheet = workbook.Sheets["Test Sheet"];
      const json = XLSX.utils.sheet_to_json(sheet);
      expect(json.length).toBe(2);
      expect(json[0]).toEqual(
        expect.objectContaining({
          ID: "1",
          Nama: "Budi",
          Nilai: 10000,
          Tanggal: "01/09/2026",
        }),
      );
    });

    it("should handle empty data gracefully", () => {
      const buffer = generateExcelBuffer([], columns, "Empty Sheet");

      expect(Buffer.isBuffer(buffer)).toBe(true);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      expect(workbook.SheetNames).toContain("Empty Sheet");
    });
  });

  describe("generateCsvBuffer", () => {
    it("should generate a valid CSV buffer with headers and rows", () => {
      const buffer = generateCsvBuffer(sampleData, columns);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      const csvContent = buffer.toString("utf-8");

      expect(csvContent).toMatch(/"?ID"?,Nama,Nilai,Tanggal/);
      expect(csvContent).toContain("1,Budi,10000,01/09/2026");
      expect(csvContent).toContain("2,Siti,25000,02/09/2026");
    });

    it("should generate headers even when data is empty", () => {
      const buffer = generateCsvBuffer([], columns);

      const csvContent = buffer.toString("utf-8");
      expect(csvContent).toMatch(/"?ID"?,Nama,Nilai,Tanggal/);
    });
  });
});
