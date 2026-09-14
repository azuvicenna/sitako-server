import {
  pgTable,
  pgEnum,
  boolean,
  integer,
  text,
  uniqueIndex,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { generateId } from "@/utils/generators/ulid";

export const bookTypeEnum = pgEnum("tipe_buku_enum", ["Fisik", "Digital"]);
export const fineTypeEnum = pgEnum("tipe_denda_enum", ["Terlambat", "Hilang"]);
export const calculationTypeEnum = pgEnum("tipe_kalkulasi_enum", [
  "Akumulasi",
  "Flat",
]);
export const transactionStatusEnum = pgEnum("status_transaksi_enum", [
  "Menunggu Persetujuan",
  "Dibatalkan",
  "Menunggu Diambil",
  "Dipinjam",
  "Dikembalikan",
  "Terlambat",
  "Tidak Mengembalikan",
]);
export const paymentMethodEnum = pgEnum("metode_pembayaran_enum", [
  "Tunai",
  "Non-Tunai",
]);
export const paymentStatusEnum = pgEnum("status_pembayaran_enum", [
  "UNPAID",
  "PAID",
  "EXPIRED",
  "FAILED",
]);

export const librarians = pgTable("librarians", {
  id: text("id").primaryKey().$defaultFn(generateId),
  nama: text("nama").notNull(),
  nip: text("nip").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  telepon: text("telepon").notNull(),
  foto: text("foto").notNull(),
  status_aktif: boolean("status_aktif").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: text("id").primaryKey().$defaultFn(generateId),
  nama: text("nama").notNull(),
  nis: text("nis").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  telepon: text("telepon").notNull(),
  foto: text("foto").notNull(),
  status_aktif: boolean("status_aktif").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shelves = pgTable("shelves", {
  id: text("id").primaryKey().$defaultFn(generateId),
  namaRak: text("nama_rak").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: text("id").primaryKey().$defaultFn(generateId),
  judul: text("judul").notNull(),
  penulis: text("penulis").notNull(),
  isbn: text("isbn").notNull(),
  penerbit: text("penerbit").notNull(),
  genre: text("genre").array().notNull(),
  tipeBuku: bookTypeEnum("tipe_buku").default("Fisik").notNull(),
  tahunTerbit: integer("tahun_terbit").notNull(),
  jumlahStok: integer("jumlah_stok").notNull(),
  cover: text("cover").notNull(),
  file: text("file_digital"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stacks = pgTable(
  "stacks",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    rakId: text("rak_id")
      .notNull()
      .references(() => shelves.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    bukuId: text("buku_id")
      .notNull()
      .references(() => books.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    kdSusunan: text("kd_susunan").notNull(),
    nomorSusunan: integer("nomor_susunan").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("rak_nomor_idx").on(table.rakId, table.nomorSusunan)],
);

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  bukuId: text("buku_id")
    .notNull()
    .references(() => books.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  anggotaId: text("anggota_id")
    .notNull()
    .references(() => members.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fines = pgTable("fines", {
  id: text("id").primaryKey().$defaultFn(generateId),
  bukuId: text("buku_id")
    .notNull()
    .references(() => books.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  jenisDenda: fineTypeEnum("jenis_denda").default("Terlambat").notNull(),
  hargaDenda: integer("harga_denda").notNull(),
  metodePerhitungan: calculationTypeEnum("metode_perhitungan")
    .default("Akumulasi")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  bukuId: text("buku_id")
    .notNull()
    .references(() => books.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  pustakawanId: text("pustakawan_id")
    .notNull()
    .references(() => librarians.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  anggotaId: text("anggota_id")
    .notNull()
    .references(() => members.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  kdTransaksi: text("kd_transaksi").notNull(),
  tglPinjam: timestamp("tgl_pinjam").defaultNow().notNull(),
  tglKembali: timestamp("tgl_kembali"),
  status: transactionStatusEnum("status")
    .default("Menunggu Persetujuan")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const finePayments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(generateId),
  pustakawanId: text("pustakawan_id").references(() => librarians.id, {
    onDelete: "restrict",
    onUpdate: "restrict",
  }),
  anggotaId: text("anggota_id")
    .notNull()
    .references(() => members.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  transaksiId: text("transaksi_id")
    .notNull()
    .references(() => transactions.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
  hargaDenda: integer("harga_denda").notNull(),
  totalDenda: integer("total_denda").notNull(),
  tglBayar: timestamp("tgl_bayar"),
  metodePembayaran: paymentMethodEnum("metode_pembayaran")
    .default("Tunai")
    .notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .default("UNPAID")
    .notNull(),
  tripayReference: text("tripay_reference").unique(),
  paymentMethodCode: text("payment_method_code"),
  checkoutUrl: text("checkout_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedulerLocks = pgTable("scheduler_locks", {
  jobName: text("job_name").primaryKey(),
  lockedBy: text("locked_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    transaksiId: text("transaksi_id")
      .notNull()
      .references(() => transactions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tipePengingat: text("tipe_pengingat").notNull(),
    sentDate: date("sent_date").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reminder_tx_type_date_idx").on(
      table.transaksiId,
      table.tipePengingat,
      table.sentDate,
    ),
  ],
);

