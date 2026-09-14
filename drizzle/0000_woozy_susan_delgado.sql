CREATE TYPE "public"."tipe_buku_enum" AS ENUM('Fisik', 'Digital');--> statement-breakpoint
CREATE TYPE "public"."tipe_kalkulasi_enum" AS ENUM('Akumulasi', 'Flat');--> statement-breakpoint
CREATE TYPE "public"."tipe_denda_enum" AS ENUM('Terlambat', 'Hilang');--> statement-breakpoint
CREATE TYPE "public"."metode_pembayaran_enum" AS ENUM('Tunai', 'Non-Tunai');--> statement-breakpoint
CREATE TYPE "public"."status_pembayaran_enum" AS ENUM('UNPAID', 'PAID', 'EXPIRED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."status_transaksi_enum" AS ENUM('Menunggu Persetujuan', 'Dibatalkan', 'Menunggu Diambil', 'Dipinjam', 'Dikembalikan', 'Terlambat', 'Tidak Mengembalikan');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"buku_id" text NOT NULL,
	"anggota_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"judul" text NOT NULL,
	"penulis" text NOT NULL,
	"isbn" text NOT NULL,
	"penerbit" text NOT NULL,
	"genre" text[] NOT NULL,
	"tipe_buku" "tipe_buku_enum" DEFAULT 'Fisik' NOT NULL,
	"tahun_terbit" integer NOT NULL,
	"jumlah_stok" integer NOT NULL,
	"cover" text NOT NULL,
	"file_digital" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"pustakawan_id" text,
	"anggota_id" text NOT NULL,
	"transaksi_id" text NOT NULL,
	"harga_denda" integer NOT NULL,
	"total_denda" integer NOT NULL,
	"tgl_bayar" timestamp,
	"metode_pembayaran" "metode_pembayaran_enum" DEFAULT 'Tunai' NOT NULL,
	"payment_status" "status_pembayaran_enum" DEFAULT 'UNPAID' NOT NULL,
	"tripay_reference" text,
	"payment_method_code" text,
	"checkout_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_tripay_reference_unique" UNIQUE("tripay_reference")
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" text PRIMARY KEY NOT NULL,
	"buku_id" text NOT NULL,
	"jenis_denda" "tipe_denda_enum" DEFAULT 'Terlambat' NOT NULL,
	"harga_denda" integer NOT NULL,
	"metode_perhitungan" "tipe_kalkulasi_enum" DEFAULT 'Akumulasi' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "librarians" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"nip" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"telepon" text NOT NULL,
	"foto" text NOT NULL,
	"status_aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"nis" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"telepon" text NOT NULL,
	"foto" text NOT NULL,
	"status_aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"transaksi_id" text NOT NULL,
	"tipe_pengingat" text NOT NULL,
	"sent_date" date NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduler_locks" (
	"job_name" text PRIMARY KEY NOT NULL,
	"locked_by" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_rak" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stacks" (
	"id" text PRIMARY KEY NOT NULL,
	"rak_id" text NOT NULL,
	"buku_id" text NOT NULL,
	"kd_susunan" text NOT NULL,
	"nomor_susunan" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"buku_id" text NOT NULL,
	"pustakawan_id" text NOT NULL,
	"anggota_id" text NOT NULL,
	"kd_transaksi" text NOT NULL,
	"tgl_pinjam" timestamp DEFAULT now() NOT NULL,
	"tgl_kembali" timestamp,
	"status" "status_transaksi_enum" DEFAULT 'Menunggu Persetujuan' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_buku_id_books_id_fk" FOREIGN KEY ("buku_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_anggota_id_members_id_fk" FOREIGN KEY ("anggota_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_pustakawan_id_librarians_id_fk" FOREIGN KEY ("pustakawan_id") REFERENCES "public"."librarians"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_anggota_id_members_id_fk" FOREIGN KEY ("anggota_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaksi_id_transactions_id_fk" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_buku_id_books_id_fk" FOREIGN KEY ("buku_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_transaksi_id_transactions_id_fk" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stacks" ADD CONSTRAINT "stacks_rak_id_shelves_id_fk" FOREIGN KEY ("rak_id") REFERENCES "public"."shelves"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "stacks" ADD CONSTRAINT "stacks_buku_id_books_id_fk" FOREIGN KEY ("buku_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buku_id_books_id_fk" FOREIGN KEY ("buku_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pustakawan_id_librarians_id_fk" FOREIGN KEY ("pustakawan_id") REFERENCES "public"."librarians"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_anggota_id_members_id_fk" FOREIGN KEY ("anggota_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_tx_type_date_idx" ON "reminder_logs" USING btree ("transaksi_id","tipe_pengingat","sent_date");--> statement-breakpoint
CREATE UNIQUE INDEX "rak_nomor_idx" ON "stacks" USING btree ("rak_id","nomor_susunan");