export type DateRangeFilter = {
  startDate?: Date;
  endDate?: Date;
};

export type CirculationRow = {
  kdTransaksi: string;
  namaPeminjam: string;
  judulBuku: string;
  tglPinjam: Date;
  tglKembali: Date | null;
  status: string;
};

export type FineRow = {
  namaPeminjam: string;
  judulBuku: string;
  totalDenda: number;
  metodePembayaran: string;
  paymentStatus: string;
  tglBayar: Date | null;
};

export type ReportFormat = "json" | "csv" | "xlsx" | "pdf";
