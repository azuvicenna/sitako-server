import { readFile, unlink } from 'fs/promises';
import * as reportRepo from '@/repositories/librarian/report.repository';
import type { CirculationRow, DateRangeFilter, FineRow } from '@/types/report.types';
import { generateCsvBuffer, generateExcelBuffer } from '@/utils/excel/exporter';
import { compileTypstFile } from '@/utils/services/typst';

export const formatDateIndo = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const escapeTypst = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  const str = String(value);
  return str.replace(/([\\#[\]*_])/g, '\\$1');
};

export const getCirculationReport = async (filter: DateRangeFilter): Promise<CirculationRow[]> => {
  return reportRepo.getCirculationReport(filter);
};

export const getFineReport = async (filter: DateRangeFilter): Promise<FineRow[]> => {
  return reportRepo.getFineReport(filter);
};

export const exportCirculationExcel = async (filter: DateRangeFilter): Promise<Buffer> => {
  const data = await getCirculationReport(filter);
  const columns = [
    { header: 'Kode Transaksi', key: 'kdTransaksi' as const },
    { header: 'Nama Peminjam', key: 'namaPeminjam' as const },
    { header: 'Judul Buku', key: 'judulBuku' as const },
    { header: 'Tgl Pinjam', key: 'tglPinjam' as const },
    { header: 'Tgl Kembali', key: 'tglKembali' as const },
    { header: 'Status', key: 'status' as const },
  ];

  const formattedData = data.map((row) => ({
    kdTransaksi: row.kdTransaksi,
    namaPeminjam: row.namaPeminjam,
    judulBuku: row.judulBuku,
    tglPinjam: formatDateIndo(row.tglPinjam),
    tglKembali: formatDateIndo(row.tglKembali),
    status: row.status,
  }));

  return generateExcelBuffer(formattedData, columns, 'Laporan Sirkulasi');
};

export const exportCirculationCsv = async (filter: DateRangeFilter): Promise<Buffer> => {
  const data = await getCirculationReport(filter);
  const columns = [
    { header: 'Kode Transaksi', key: 'kdTransaksi' as const },
    { header: 'Nama Peminjam', key: 'namaPeminjam' as const },
    { header: 'Judul Buku', key: 'judulBuku' as const },
    { header: 'Tgl Pinjam', key: 'tglPinjam' as const },
    { header: 'Tgl Kembali', key: 'tglKembali' as const },
    { header: 'Status', key: 'status' as const },
  ];

  const formattedData = data.map((row) => ({
    kdTransaksi: row.kdTransaksi,
    namaPeminjam: row.namaPeminjam,
    judulBuku: row.judulBuku,
    tglPinjam: formatDateIndo(row.tglPinjam),
    tglKembali: formatDateIndo(row.tglKembali),
    status: row.status,
  }));

  return generateCsvBuffer(formattedData, columns);
};

export const exportFineExcel = async (filter: DateRangeFilter): Promise<Buffer> => {
  const data = await getFineReport(filter);
  const columns = [
    { header: 'Nama Peminjam', key: 'namaPeminjam' as const },
    { header: 'Judul Buku', key: 'judulBuku' as const },
    { header: 'Total Denda', key: 'totalDenda' as const },
    { header: 'Metode Pembayaran', key: 'metodePembayaran' as const },
    { header: 'Status Pembayaran', key: 'paymentStatus' as const },
    { header: 'Tgl Bayar', key: 'tglBayar' as const },
  ];

  const formattedData = data.map((row) => ({
    namaPeminjam: row.namaPeminjam,
    judulBuku: row.judulBuku,
    totalDenda: row.totalDenda,
    metodePembayaran: row.metodePembayaran,
    paymentStatus: row.paymentStatus,
    tglBayar: formatDateIndo(row.tglBayar),
  }));

  return generateExcelBuffer(formattedData, columns, 'Laporan Denda');
};

export const exportFineCsv = async (filter: DateRangeFilter): Promise<Buffer> => {
  const data = await getFineReport(filter);
  const columns = [
    { header: 'Nama Peminjam', key: 'namaPeminjam' as const },
    { header: 'Judul Buku', key: 'judulBuku' as const },
    { header: 'Total Denda', key: 'totalDenda' as const },
    { header: 'Metode Pembayaran', key: 'metodePembayaran' as const },
    { header: 'Status Pembayaran', key: 'paymentStatus' as const },
    { header: 'Tgl Bayar', key: 'tglBayar' as const },
  ];

  const formattedData = data.map((row) => ({
    namaPeminjam: row.namaPeminjam,
    judulBuku: row.judulBuku,
    totalDenda: row.totalDenda,
    metodePembayaran: row.metodePembayaran,
    paymentStatus: row.paymentStatus,
    tglBayar: formatDateIndo(row.tglBayar),
  }));

  return generateCsvBuffer(formattedData, columns);
};

export const exportReportPdf = async (
  filter: DateRangeFilter,
  librarianName = 'Pustakawan',
): Promise<Buffer> => {
  const [circulationData, fineData] = await Promise.all([
    getCirculationReport(filter),
    getFineReport(filter),
  ]);

  const generatedRowsSirkulasi =
    circulationData.length === 0
      ? '[], [], align(center)[Tidak ada data pada periode ini.], [], [], [],'
      : circulationData
          .map(
            (row) =>
              `[${escapeTypst(row.kdTransaksi)}], [${escapeTypst(row.namaPeminjam)}], [${escapeTypst(row.judulBuku)}], [${escapeTypst(formatDateIndo(row.tglPinjam))}], [${escapeTypst(formatDateIndo(row.tglKembali))}], [${escapeTypst(row.status)}],`,
          )
          .join('\n');

  const generatedRowsDenda =
    fineData.length === 0
      ? '[], [], align(center)[Tidak ada data pada periode ini.], [], [], [],'
      : fineData
          .map(
            (row) =>
              `[${escapeTypst(row.namaPeminjam)}], [${escapeTypst(row.judulBuku)}], [Rp ${escapeTypst(row.totalDenda.toLocaleString('id-ID'))}], [${escapeTypst(row.metodePembayaran)}], [${escapeTypst(row.paymentStatus)}], [${escapeTypst(formatDateIndo(row.tglBayar))}],`,
          )
          .join('\n');

  let periodeLaporan = 'Semua Periode';
  if (filter.startDate && filter.endDate) {
    periodeLaporan = `${formatDateIndo(filter.startDate)} - ${formatDateIndo(filter.endDate)}`;
  } else if (filter.startDate) {
    periodeLaporan = `Sejak ${formatDateIndo(filter.startDate)}`;
  } else if (filter.endDate) {
    periodeLaporan = `Hingga ${formatDateIndo(filter.endDate)}`;
  }

  const pdfPath = await compileTypstFile('typst/laporan-sirkulasi-denda.typ', {
    namaSekolah: 'Perpustakaan SITAKO',
    periodeLaporan,
    tanggalCetak: formatDateIndo(new Date()),
    namaPustakawan: escapeTypst(librarianName),
    barisSirkulasi: generatedRowsSirkulasi,
    barisDenda: generatedRowsDenda,
  });

  try {
    return await readFile(pdfPath);
  } finally {
    await unlink(pdfPath).catch(() => {});
  }
};
