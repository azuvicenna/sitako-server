import * as XLSX from "xlsx";

export type ExcelColumn<T> = {
  header: string;
  key: keyof T;
};

export function generateExcelBuffer<T>(
  data: T[],
  columns: ExcelColumn<T>[],
  sheetName: string,
): Buffer {
  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = item[c.key];
      return val !== null && val !== undefined ? val : "";
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  columns.forEach((_, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = { font: { bold: true } };
    }
  });

  worksheet["!cols"] = columns.map((col, colIdx) => {
    let maxLen = col.header.length;
    for (const row of rows) {
      const cellVal = String(row[colIdx] ?? "");
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    }
    return { wch: Math.max(maxLen + 3, 12) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function generateCsvBuffer<T>(
  data: T[],
  columns: ExcelColumn<T>[],
): Buffer {
  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = item[c.key];
      return val !== null && val !== undefined ? val : "";
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csvString = XLSX.utils.sheet_to_csv(worksheet);

  return Buffer.from(csvString, "utf-8");
}
