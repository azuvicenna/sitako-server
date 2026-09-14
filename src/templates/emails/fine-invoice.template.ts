import { renderBaseEmailLayout } from './base.template';

export interface FineInvoiceEmailData {
  namaAnggota: string;
  judulBuku: string;
  kdTransaksi: string;
  jenisDenda: string;
  totalDenda: number;
  metodePembayaran: string;
  checkoutUrl?: string | null;
  paymentMethodCode?: string | null;
  tripayReference?: string | null;
  appUrl?: string;
}

export const renderFineInvoiceEmail = (
  data: FineInvoiceEmailData,
): {
  subject: string;
  html: string;
} => {
  const {
    namaAnggota,
    judulBuku,
    kdTransaksi,
    jenisDenda,
    totalDenda,
    metodePembayaran,
    checkoutUrl,
    paymentMethodCode,
    tripayReference,
    appUrl = process.env.APP_URL || 'http://localhost:3000',
  } = data;

  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalDenda);

  const subject = `[Tagihan Denda] Pembayaran Denda Perpustakaan: ${formattedTotal}`;
  const isOnline = metodePembayaran === 'Non-Tunai' && Boolean(checkoutUrl);

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-warning">Menunggu Pembayaran</span>
      <h2 style="margin: 12px 0 8px 0; color: #0f172a; font-size: 20px;">Tagihan Denda Perpustakaan</h2>
      <p style="margin: 0; color: #475569; font-size: 14px;">Halo <strong>${namaAnggota}</strong>,</p>
      <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">
        Berikut adalah rincian tagihan denda untuk transaksi peminjaman buku perpustakaan Anda.
      </p>
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
        <td class="label">Kategori Denda</td>
        <td class="value"><span class="badge badge-danger">Denda ${jenisDenda}</span></td>
      </tr>
      <tr>
        <td class="label">Metode Pembayaran</td>
        <td class="value">${metodePembayaran} ${paymentMethodCode ? `(${paymentMethodCode})` : ''}</td>
      </tr>
      ${
        tripayReference
          ? `<tr>
              <td class="label">Ref Pembayaran</td>
              <td class="value"><code>${tripayReference}</code></td>
            </tr>`
          : ''
      }
      <tr>
        <td class="label">Total Tagihan</td>
        <td class="value" style="font-size: 18px; color: #dc2626; font-weight: 700;">${formattedTotal}</td>
      </tr>
    </table>

    ${
      isOnline
        ? `
      <div style="text-align: center; margin: 28px 0;">
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">Klik tombol di bawah ini untuk melanjutkan pembayaran secara online:</p>
        <a href="${checkoutUrl}" class="btn" style="background-color: #16a34a; font-size: 15px; padding: 14px 28px;">Bayar Sekarang via Tripay</a>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">Tautan pembayaran online memiliki batas waktu pembayaran (24 jam).</p>
      </div>
      `
        : `
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bfdbfe;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">
          <strong>Instruksi Pembayaran Tunai:</strong> Silakan kunjungi loket perpustakaan dan lakukan pembayaran langsung kepada petugas pustakawan dengan menunjukkan kode transaksi <strong>${kdTransaksi}</strong>.
        </p>
      </div>
      `
    }

    <div style="text-align: center; margin-top: 16px;">
      <a href="${appUrl}/member/payments" style="color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500;">&larr; Lihat Riwayat Pembayaran</a>
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: subject,
    previewText: `Tagihan denda perpustakaan sebesar ${formattedTotal} untuk buku ${judulBuku}`,
    contentHtml,
    appUrl,
  });

  return { subject, html };
};
