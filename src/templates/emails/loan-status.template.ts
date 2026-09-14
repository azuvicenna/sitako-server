import { renderBaseEmailLayout } from "./base.template";

export interface LoanStatusEmailData {
  namaAnggota: string;
  judulBuku: string;
  kdTransaksi: string;
  status: string;
  tglPinjam: string;
  tglKembali?: string | null;
  pesanTambahan?: string;
  appUrl?: string;
}

export const renderLoanStatusEmail = (data: LoanStatusEmailData): {
  subject: string;
  html: string;
} => {
  const {
    namaAnggota,
    judulBuku,
    kdTransaksi,
    status,
    tglPinjam,
    tglKembali,
    pesanTambahan,
    appUrl = process.env.APP_URL || "http://localhost:3000",
  } = data;

  let subject = `[Status Peminjaman] Buku: ${judulBuku} - ${status}`;
  let badgeClass = "badge-info";
  let headline = `Pembaruan Status: ${status}`;
  let description = `Status peminjaman buku Anda telah diperbarui menjadi <strong>${status}</strong>.`;

  switch (status) {
    case "Menunggu Diambil":
      subject = `[Disetujui] Buku Siap Diambil: ${judulBuku}`;
      badgeClass = "badge-success";
      headline = "Peminjaman Disetujui! Buku Siap Diambil";
      description = "Pengajuan peminjaman buku Anda telah disetujui oleh pustakawan. Silakan tunjukkan kode transaksi ini di loket perpustakaan untuk mengambil buku fisik.";
      break;

    case "Dipinjam":
      subject = `[Berhasil Dipinjam] Buku: ${judulBuku}`;
      badgeClass = "badge-info";
      headline = "Buku Telah Berhasil Dipinjam";
      description = "Buku telah tercatat aktif dipinjam. Mohon rawat buku dengan baik dan kembalikan sebelum batas waktu yang ditentukan.";
      break;

    case "Dikembalikan":
      subject = `[Pengembalian Berhasil] Buku: ${judulBuku}`;
      badgeClass = "badge-success";
      headline = "Buku Berhasil Dikembalikan";
      description = "Terima kasih! Buku yang Anda pinjam telah berhasil dikembalikan dan diverifikasi oleh pustakawan. Transaksi peminjaman telah selesai.";
      break;

    case "Dibatalkan":
      subject = `[Dibatalkan] Pengajuan Peminjaman Buku: ${judulBuku}`;
      badgeClass = "badge-danger";
      headline = "Pengajuan Peminjaman Dibatalkan";
      description = "Mohon maaf, pengajuan peminjaman buku Anda telah dibatalkan atau ditolak oleh petugas perpustakaan.";
      break;

    case "Terlambat":
      subject = `[Peringatan] Status Peminjaman Terlambat: ${judulBuku}`;
      badgeClass = "badge-danger";
      headline = "Status Peminjaman: Terlambat";
      description = "Buku pinjaman Anda tercatat telah melewati tanggal jatuh tempo pengembalian. Mohon segera mengembalikan buku ke perpustakaan.";
      break;

    case "Tidak Mengembalikan":
      subject = `[Penting] Buku Dilaporkan Tidak Dikembalikan / Hilang: ${judulBuku}`;
      badgeClass = "badge-danger";
      headline = "Status: Tidak Mengembalikan / Buku Hilang";
      description = "Peminjaman ini tercatat tidak mengembalikan buku atau buku dilaporkan hilang. Harap segera hubungi pustakawan untuk prosedur penggantian atau penyelesaian denda.";
      break;
  }

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span class="badge ${badgeClass}">${status}</span>
      <h2 style="margin: 12px 0 8px 0; color: #0f172a; font-size: 20px;">${headline}</h2>
      <p style="margin: 0; color: #475569; font-size: 14px;">Halo <strong>${namaAnggota}</strong>,</p>
      <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">${description}</p>
      ${pesanTambahan ? `<p style="margin: 8px 0 0 0; padding: 10px; background-color: #f1f5f9; border-left: 3px solid #64748b; font-size: 13px; color: #334155;"><em>Catatan: ${pesanTambahan}</em></p>` : ""}
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
      ${
        tglKembali
          ? `<tr>
              <td class="label">Batas Pengembalian</td>
              <td class="value">${tglKembali}</td>
            </tr>`
          : ""
      }
      <tr>
        <td class="label">Status Saat Ini</td>
        <td class="value"><span class="badge ${badgeClass}">${status}</span></td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/member/transactions" class="btn">Buka Portal Perpustakaan</a>
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: subject,
    previewText: description,
    contentHtml,
    appUrl,
  });

  return { subject, html };
};
