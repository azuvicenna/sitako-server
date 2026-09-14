import { renderBaseEmailLayout } from './base.template';

export interface FineSuccessEmailData {
  namaAnggota: string;
  judulBuku: string;
  kdTransaksi: string;
  totalDenda: number;
  metodePembayaran: string;
  tglBayar: string;
  tripayReference?: string | null;
  appUrl?: string;
}

export const renderFineSuccessEmail = (
  data: FineSuccessEmailData,
): {
  subject: string;
  html: string;
} => {
  const {
    namaAnggota,
    judulBuku,
    kdTransaksi,
    totalDenda,
    metodePembayaran,
    tglBayar,
    tripayReference,
    appUrl = process.env.APP_URL || 'http://localhost:3000',
  } = data;

  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalDenda);

  const subject = `[LUNAS] Bukti Pembayaran Denda: ${formattedTotal} (${kdTransaksi})`;

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-success">Pembayaran Berhasil</span>
      <h2 style="margin: 12px 0 8px 0; color: #0f172a; font-size: 20px;">Kuitansi Pembayaran Denda</h2>
      <p style="margin: 0; color: #475569; font-size: 14px;">Halo <strong>${namaAnggota}</strong>,</p>
      <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">
        Pembayaran denda perpustakaan Anda telah berhasil diterima dan divalidasi oleh sistem SITAKO. Transaksi denda ini telah <strong>LUNAS</strong>.
      </p>
    </div>

    <table class="table-detail" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <tr>
        <td class="label">Status Pembayaran</td>
        <td class="value"><span class="badge badge-success">LUNAS / PAID</span></td>
      </tr>
      <tr>
        <td class="label">Kode Transaksi</td>
        <td class="value">${kdTransaksi}</td>
      </tr>
      <tr>
        <td class="label">Judul Buku</td>
        <td class="value">${judulBuku}</td>
      </tr>
      <tr>
        <td class="label">Tanggal Bayar</td>
        <td class="value">${tglBayar}</td>
      </tr>
      <tr>
        <td class="label">Metode Pembayaran</td>
        <td class="value">${metodePembayaran}</td>
      </tr>
      ${
        tripayReference
          ? `<tr>
              <td class="label">Ref Tripay</td>
              <td class="value"><code>${tripayReference}</code></td>
            </tr>`
          : ''
      }
      <tr>
        <td class="label">Total Dibayar</td>
        <td class="value" style="font-size: 18px; color: #16a34a; font-weight: 700;">${formattedTotal}</td>
      </tr>
    </table>

    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 14px; margin: 20px 0; border: 1px solid #bbf7d0;">
      <p style="margin: 0; font-size: 13px; color: #166534;">
        <strong>Catatan:</strong> Simpan email ini sebagai tanda bukti pembayaran sah di Perpustakaan SITAKO.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/member/payments" class="btn">Lihat Riwayat Pembayaran</a>
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: subject,
    previewText: `Pembayaran denda sebesar ${formattedTotal} untuk ${judulBuku} telah berhasil diterima.`,
    contentHtml,
    appUrl,
  });

  return { subject, html };
};
