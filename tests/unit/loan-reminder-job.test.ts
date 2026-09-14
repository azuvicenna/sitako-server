import { calculateCalendarDaysDiff } from "@/jobs/loan-reminder.job";
import { renderLoanReminderEmail } from "@/templates/emails/loan-reminder.template";
import { renderLoanStatusEmail } from "@/templates/emails/loan-status.template";
import { renderFineInvoiceEmail } from "@/templates/emails/fine-invoice.template";
import { renderFineSuccessEmail } from "@/templates/emails/fine-success.template";

describe("Loan Reminder & Email Templates Unit Tests", () => {
  describe("calculateCalendarDaysDiff", () => {
    it("should return -2 for due date 2 days in the future (H-2)", () => {
      const today = new Date(2026, 8, 14, 10, 0, 0); // 14 Sept 2026
      const dueDate = new Date(2026, 8, 16, 14, 0, 0); // 16 Sept 2026
      expect(calculateCalendarDaysDiff(today, dueDate)).toBe(-2);
    });

    it("should return -1 for due date tomorrow (H-1)", () => {
      const today = new Date(2026, 8, 14, 23, 59, 0); // 14 Sept 2026
      const dueDate = new Date(2026, 8, 15, 8, 0, 0); // 15 Sept 2026
      expect(calculateCalendarDaysDiff(today, dueDate)).toBe(-1);
    });

    it("should return 0 for due date today (Hari-H)", () => {
      const today = new Date(2026, 8, 14, 7, 0, 0); // 14 Sept 2026
      const dueDate = new Date(2026, 8, 14, 17, 0, 0); // 14 Sept 2026
      expect(calculateCalendarDaysDiff(today, dueDate)).toBe(0);
    });

    it("should return 1 for due date yesterday (H+1 / Overdue Pertama)", () => {
      const today = new Date(2026, 8, 14, 7, 0, 0); // 14 Sept 2026
      const dueDate = new Date(2026, 8, 13, 17, 0, 0); // 13 Sept 2026
      expect(calculateCalendarDaysDiff(today, dueDate)).toBe(1);
    });

    it("should return 4 for due date 4 days ago (H+4 / Periodic Overdue)", () => {
      const today = new Date(2026, 8, 14, 7, 0, 0); // 14 Sept 2026
      const dueDate = new Date(2026, 8, 10, 17, 0, 0); // 10 Sept 2026
      const diff = calculateCalendarDaysDiff(today, dueDate);
      expect(diff).toBe(4);
      // Periodic check: (diff - 1) % 3 === 0 -> (4 - 1) % 3 === 0
      expect((diff - 1) % 3).toBe(0);
    });
  });

  describe("renderLoanReminderEmail", () => {
    const baseData = {
      namaAnggota: "Ahmad Siswa",
      judulBuku: "Laskar Pelangi",
      kdTransaksi: "TRX-20260914-001",
      tglPinjam: "10 September 2026",
      tglKembali: "14 September 2026",
    };

    it("should render H-2 reminder correctly", () => {
      const { subject, html } = renderLoanReminderEmail({
        ...baseData,
        tipeReminder: "H-2",
      });
      expect(subject).toContain("2 Hari Lagi");
      expect(html).toContain("Pengingat H-2");
      expect(html).toContain("Laskar Pelangi");
    });

    it("should render H-1 reminder correctly", () => {
      const { subject, html } = renderLoanReminderEmail({
        ...baseData,
        tipeReminder: "H-1",
      });
      expect(subject).toContain("Besok Batas Pengembalian");
      expect(html).toContain("Pengingat H-1");
    });

    it("should render Hari-H reminder correctly", () => {
      const { subject, html } = renderLoanReminderEmail({
        ...baseData,
        tipeReminder: "Hari-H",
      });
      expect(subject).toContain("Hari Ini");
      expect(html).toContain("Hari Ini Batas Akhir");
    });

    it("should render H+1 overdue reminder correctly", () => {
      const { subject, html } = renderLoanReminderEmail({
        ...baseData,
        tipeReminder: "H+1",
        hariTerlambat: 1,
      });
      expect(subject).toContain("Keterlambatan");
      expect(html).toContain("Terlambat 1 Hari");
    });

    it("should render Berkala overdue reminder correctly", () => {
      const { subject, html } = renderLoanReminderEmail({
        ...baseData,
        tipeReminder: "Berkala",
        hariTerlambat: 4,
      });
      expect(subject).toContain("4 Hari Terlambat");
      expect(html).toContain("Terlambat 4 Hari");
    });
  });

  describe("renderLoanStatusEmail", () => {
    it("should render status Dikembalikan correctly", () => {
      const { subject, html } = renderLoanStatusEmail({
        namaAnggota: "Ahmad",
        judulBuku: "Bumi Manusia",
        kdTransaksi: "TRX-002",
        status: "Dikembalikan",
        tglPinjam: "1 September 2026",
        tglKembali: "10 September 2026",
      });
      expect(subject).toContain("Pengembalian Berhasil");
      expect(html).toContain("Buku Berhasil Dikembalikan");
    });

    it("should render status Menunggu Diambil correctly", () => {
      const { subject, html } = renderLoanStatusEmail({
        namaAnggota: "Ahmad",
        judulBuku: "Bumi Manusia",
        kdTransaksi: "TRX-002",
        status: "Menunggu Diambil",
        tglPinjam: "1 September 2026",
      });
      expect(subject).toContain("Disetujui");
      expect(html).toContain("Buku Siap Diambil");
    });
  });

  describe("renderFineInvoiceEmail and renderFineSuccessEmail", () => {
    it("should render fine invoice with Tripay checkout link", () => {
      const { subject, html } = renderFineInvoiceEmail({
        namaAnggota: "Ahmad",
        judulBuku: "Bumi Manusia",
        kdTransaksi: "TRX-002",
        jenisDenda: "Terlambat",
        totalDenda: 15000,
        metodePembayaran: "Non-Tunai",
        checkoutUrl: "https://tripay.co.id/checkout/TP123",
        paymentMethodCode: "QRIS",
        tripayReference: "TP123",
      });
      expect(subject).toContain("Tagihan Denda");
      expect(html).toContain("https://tripay.co.id/checkout/TP123");
      expect(html).toContain("QRIS");
    });

    it("should render fine payment success receipt", () => {
      const { subject, html } = renderFineSuccessEmail({
        namaAnggota: "Ahmad",
        judulBuku: "Bumi Manusia",
        kdTransaksi: "TRX-002",
        totalDenda: 15000,
        metodePembayaran: "Non-Tunai",
        tglBayar: "14 September 2026",
        tripayReference: "TP123",
      });
      expect(subject).toContain("LUNAS");
      expect(html).toContain("Kuitansi Pembayaran Denda");
      expect(html).toContain("TP123");
    });
  });
});
