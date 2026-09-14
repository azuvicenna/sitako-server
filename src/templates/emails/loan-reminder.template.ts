import { renderBaseEmailLayout } from "./base.template";

export type LoanReminderType = "H-2" | "H-1" | "Hari-H" | "H+1" | "Berkala";

export interface LoanReminderEmailData {
  namaAnggota: string;
  judulBuku: string;
  kdTransaksi: string;
  tglPinjam: string;
  tglKembali: string;
  tipeReminder: LoanReminderType;
  hariTerlambat?: number;
  appUrl?: string;
}

export const renderLoanReminderEmail = (data: LoanReminderEmailData): {
  subject: string;
  html: string;
} => {
  const {
    namaAnggota,
    judulBuku,
    kdTransaksi,
    tglPinjam,
    tglKembali,
    tipeReminder,
    hariTerlambat = 0,
    appUrl = process.env.APP_URL || "http://localhost:3000",
  } = data;

  let subject = "";
  let badgeHtml = "";
  let headline = "";
  let message = "";

  switch (tipeReminder) {
    case "H-2":
      subject = `[Pengingat] 2 Hari Lagi Batas Pengembalian Buku: ${judulBuku}`;
      badgeHtml = `<span class="badge badge-info">Pengingat H-2</span>`;
      headline = "Batas Waktu Pengembalian 2 Hari Lagi";
      message = "Halo, kami ingin mengingatkan bahwa waktu peminjaman buku Anda tersisa 2 hari lagi. Mohon persiapkan buku untuk dikembalikan tepat waktu.";
      break;

    case "H-1":
      subject = `[Pengingat Penting] Besok Batas Pengembalian Buku: ${judulBuku}`;
      badgeHtml = `<span class="badge badge-warning">Pengingat H-1</span>`;
      headline = "Batas Waktu Pengembalian Besok";
      message = "Halo, besok adalah batas akhir masa peminjaman buku Anda. Harap mengembalikan buku ke perpustakaan sebelum jam operasional berakhir agar terhindar dari denda.";
      break;

    case "Hari-H":
      subject = `[Hari Ini] Batas Akhir Pengembalian Buku: ${judulBuku}`;
      badgeHtml = `<span class="badge badge-warning">Hari Ini Jatuh Tempo</span>`;
      headline = "Hari Ini Batas Akhir Pengembalian";
      message = "Halo, hari ini adalah batas akhir pengembalian buku pinjaman Anda. Segera serahkan buku ke loket perpustakaan sebelum pukul 16:00 WIB untuk menghindari perhitungan denda keterlambatan.";
      break;

    case "H+1":
      subject = `[PENTING] Keterlambatan Pengembalian Buku: ${judulBuku}`;
      badgeHtml = `<span class="badge badge-danger">Terlambat 1 Hari</span>`;
      headline = "Peminjaman Telah Melewati Batas Waktu";
      message = `Halo, masa peminjaman buku Anda telah jatuh tempo kemarin dan belum tercatat dikembalikan. Status transaksi kini telah diperbarui menjadi <strong>Terlambat</strong> dan denda harian mulai terhitung. Harap segera kembalikan buku ke perpustakaan.`;
      break;

    case "Berkala":
      subject = `[Peringatan Denda] Buku Belum Dikembalikan (${hariTerlambat} Hari Terlambat): ${judulBuku}`;
      badgeHtml = `<span class="badge badge-danger">Terlambat ${hariTerlambat} Hari</span>`;
      headline = `Peringatan Keterlambatan (${hariTerlambat} Hari)`;
      message = `Halo, buku yang Anda pinjam telah terlambat selama <strong>${hariTerlambat} hari</strong>. Denda akumulasi keterlambatan terus bertambah setiap harinya. Mohon segera selesaikan pengembalian dan administrasi di perpustakaan.`;
      break;
  }

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      ${badgeHtml}
      <h2 style="margin: 12px 0 8px 0; color: #0f172a; font-size: 20px;">${headline}</h2>
      <p style="margin: 0; color: #475569; font-size: 14px;">Halo <strong>${namaAnggota}</strong>,</p>
      <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">${message}</p>
    </div>

    <table class="table-detail" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <tr>
        <td class="label">Kode Transaksi</td>
        <td class="value">${kdTransaksi}</td>
      </tr>
      <tr>
        <td class="label">Judul Buku</td>
        <td class="value">${judulBuku}</td>
      </tr>
      <tr>
        <td class="label">Tanggal Pinjam</td>
        <td class="value">${tglPinjam}</td>
      </tr>
      <tr>
        <td class="label">Batas Pengembalian</td>
        <td class="value" style="color: ${tipeReminder === "H+1" || tipeReminder === "Berkala" ? "#dc2626" : "#2563eb"};">${tglKembali}</td>
      </tr>
      ${
        hariTerlambat > 0
          ? `<tr>
              <td class="label">Keterlambatan</td>
              <td class="value" style="color: #dc2626;">${hariTerlambat} Hari</td>
            </tr>`
          : ""
      }
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/member/transactions" class="btn">Lihat Detail Peminjaman</a>
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: subject,
    previewText: message,
    contentHtml,
    appUrl,
  });

  return { subject, html };
};
