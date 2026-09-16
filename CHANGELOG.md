# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [2026-09-16]

#### Added

- Menambahkan middleware `verifyRole` pada `src/middlewares/auth.middleware.ts` untuk kontrol akses berbasis peran (RBAC) dengan dukungan case-insensitive
- Menambahkan proteksi `verifyRole('Pustakawan')` pada seluruh rute modul pustakawan (books, dashboard, fine-payments, fines, librarians, members, reports, shelves, transactions)
- Menambahkan proteksi `verifyRole('Anggota')` pada seluruh rute modul anggota (member dashboard, fine-payments, library, transactions)
- Membuat `src/services/profile/profile.service.ts` dengan *Strategy Pattern* (`RoleProfileStrategy`) untuk menangani logika profil pengguna berdasarkan peran tanpa percabangan manual
- Menambahkan unit test untuk `verifyRole` middleware (`tests/unit/role.middleware.test.ts`) dan `profile.service` (`tests/unit/profile.service.test.ts`)

#### Changed

- Melakukan refactor pada `src/controllers/profile/profile.controller.ts` dengan mendelegasikan pemanggilan ke `profile.service.ts`, mengeliminasi pengecekan peran dan parsing skema manual berbasis `if-else`

### [2026-09-14]

#### Added

- Menambahkan endpoint GET dashboard untuk member
- Menambahkan endpoint GET bookmarks untuk member
- Menambahkan endpoint GET katalog buku untuk member
- Membuat fitur cetak laporan typst dan excel/csv
- Membuat fitur otomatis kirim email peringatan pengembalian, perubahan status peminjaman, pembayaran denda, pembayaran denda sukses
- Membuat cronjob/scheduler notifikasi email otomatis (dengan PostgreSQL distributed lock & reminder logs)
- Menambahkan konfigurasi load balancer (Nginx) ke docker
- Memperbarui Jenkinsfile agar mendukung pipeline deployment dinamis multi-target (Docker Standalone, Docker Multi-Replica, dan K3s)
- Memindahkan modul `dotenv` ke `dependencies` utama agar script migrasi dan seeder production dapat memuat env dengan benar di dalam kontainer

### [2026-09-13]

#### Changed

- Melakukan refactor menyeluruh pada struktur folder `src`
- Melakukan refactor menyeluruh pada struktur folder `tests`

### [2026-09-12]

#### Added

- Menambahkan unit test dan integration test untuk modul-modul inti
- Menambahkan utility service untuk integrasi payment gateway Tripay, lengkap dengan integration test
- Menyiapkan monitoring stack menggunakan Prometheus dan Grafana, serta load testing menggunakan k6

### [2026-09-11]

#### Added

- Menambahkan validasi pada proses transaksi librarian dan member saat pembuatan transaksi (pengecekan denda, ketersediaan stok, dan batas maksimum peminjaman)
- Menambahkan riwayat pembayaran denda untuk member

#### Changed

- Mengubah parameter filter menjadi query parameter agar lebih sesuai dengan konvensi filtering data
- Melakukan refactor kode dengan berpedoman pada beberapa prinsip utama: logika yang benar-benar menyelesaikan masalah termasuk edge case yang relevan; keamanan melalui validasi dan sanitasi input serta mencegah kebocoran data sensitif; keterbacaan dan maintainability agar mudah dipahami; konsistensi dengan pola dan style yang sudah ada di codebase; serta efisiensi performa tanpa melakukan over-optimization di tahap awal

### [2026-09-10]

#### Added

- Menginisialisasi unit test
- Menambahkan layanan perpustakaan untuk anggota, meliputi bookmark, hapus bookmark, detail buku, dan baca buku digital

### [2026-09-09]

#### Added

- Menambahkan operasi CRUD pada modul fine, fine-payment, transaction, stack, dan shelf
- Menambahkan endpoint summary, transaksi hari ini, dan statistik untuk dashboard pustakawan
- Menambahkan endpoint get dan update profile untuk anggota dan pustakawan
- Menambahkan fitur logout

#### Changed

- Menyusun ulang arsitektur pada modul controllers, services, repositories, dan routes

### [2026-09-08]

#### Added

- Menambahkan autentikasi menggunakan JSON Web Token (JWT) dengan HTTP-only cookies
- Menambahkan verifikasi captcha dan mengimplementasikannya pada proses login
- Menambahkan operasi CRUD dan clear cache pada modul book dan user sebagai proof of concept

#### Changed

- Menyederhanakan penggunaan logger yang sebelumnya berlebihan; logger kini difokuskan untuk mencatat error kritis pada blok catch

### [2026-09-07]

#### Added

- Catatan: task pada periode ini berfokus pada modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Menambahkan fitur pencarian berdasarkan relasi pada modul fine, fine-payment, stack, dan transaction
- Menambahkan fitur order by pada modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Membuat validasi create dan update menggunakan Zod
- Membuat generator kode transaksi pada `transaction-code.ts`
- Mengintegrasikan logger Winston ke dalam controller dan repository, serta membuat request logger

#### Fixed

- Memperbaiki kode pada controller dan repository melalui refactor

#### Changed

- Merestrukturisasi folder `utils` agar terkategori (auth, core, data, generators, services)
- Merestrukturisasi folder controller, repository, dan routes agar berorientasi pada role user
- Menambahkan import alias `@/` untuk menyederhanakan path import

### [2026-09-06]

#### Added

- Catatan: task pada periode ini berfokus pada modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Menambahkan fitur pagination dan endpoint GET data untuk pustakawan
- Menambahkan fitur pencarian dasar (belum mendukung pencarian berdasarkan relasi)

### [2026-09-05]

#### Added

- Menginisialisasi proyek SITAKO Backend menggunakan Express dan TypeScript
- Menyiapkan Docker Compose dan Dockerfile
- Menyiapkan konfigurasi environment variable (`.env`)
- Menyiapkan Jenkinsfile untuk CI/CD
- Menyiapkan konfigurasi Cloudflare R2
- Menyiapkan Drizzle ORM dengan PostgreSQL dan ULID
- Menyiapkan JSON Web Token (JWT)
- Menyiapkan Redis
- Menyiapkan Winston sebagai logger
- Menyiapkan Zod untuk validasi
- Menyiapkan Typst
- Menginstal SheetJS (xlsx)
- Menyiapkan Nodemailer
