# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [2026-09-13]

#### Change

- Refactor keseluruhan folder src

### [2026-09-12]

#### Added

- Menambahkan Unit Test dan Integration Test
- Menambahkan utils service untuk payment gateway tripay dan integration test nya
- Menambahkan prometheus dan grafana k6 load testing

### [2026-09-11]

#### Added

- Menambahkan validasi pada transaksi librarian dan member pada saat create transaksi (cek denda, cek stok, cek maksimum pinjam)
- Menambahkan riwayat pembayaran denda untuk member

#### Change

- Mengubah param filter menjadi query param agar lebih sesuai pada filter data
- Merefaktor: Logika yang masuk akal — beneran menyelesaikan masalah, termasuk edge case yang jelas, Keamanan — validasi/sanitasi input, jangan bocorkan data sensitif, Keterbacaan & maintainability — mudah dipahami orang lain (atau diri sendiri nanti), Konsistensi — ikuti pola/style yang sudah ada di codebase, Performa — hindari kerja yang tidak perlu (loop berlebihan, query berulang, dsb), tapi jangan over-optimize di awal kalau belum perlu

### [2026-09-10]

#### Added

- Inisialisasi unit test
- Menambahkan layanan perpustakaan untuk anggota seperti bookmark, hapus bookmark, detail buku, dan baca buku digital

### [2026-09-09]

#### Added

- Menambahkan CRUD pada modul fine, fine-payment, transaction, stack, dan shelf
- Menambahkan GET summary, transaction today, dan statistics untuk dashboard pustakawan
- Menambahkan get dan update profile untuk anggota dan pustakawan
- Menambahkan fitur logout

#### Changed

- Menyusun ulang arsitektur pada modul controllers, services, repositories, dan routes

### [2026-09-08]

#### Added

- Menambahkan auth dengan jsonwebtoken dengan HTTP-only cookies
- Menambahkan verfikasi captcha dan mengimplementasikannya pada login
- Menembahkan operasi CRUD dan clear cache pada modul book dan user sebagai uji coba

#### Changed

- Menghapus kode logger yang overuse, sekarang logger difokuskan untuk mencatat error kritis pada catch

### [2026-09-07]

#### Added

- [NOTE] Task spesifik mengerjakan modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Menambahkan fitur search berdasarkan relasi pada modul fine, fine-payment, stack, dan transaction
- Menambahkan orderby ke modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Membuat zod validation create dan update
- Membuat generator kode transaksi di transaction-code.ts
- Menyisipkan kode logger winston ke dalam controller, repository, dan membuat request-logger

#### Fixed

- Merefaktor kode controller dan repository

#### Changed

- Merestruktur isi folder utils agar terkategori (auth, core, data, generators, services)
- Merestruktur isi folder controller, repository, dan routes agar berorientasi role user
- Menambahkan import alias menggunakan "@/" untuk menghindari path import yang panjang

### [2026-09-06]

#### Added

- [NOTE] Task spesifik mengerjakan modul book, fine, fine-payment, shelf, stack, transaction, librarian, dan member
- Menambahkan fitur pagination dan endpoint GET data untuk pustakawan
- Menambahkan fitur pencarian namun masih belum support pencarian berdasarkan relasi

### [2026-09-05]

#### Added

- Setup project SITAKO Backend express typescript.
- Setup docker compose dan dockerfile
- Setup .env
- Setup jenkinsfile
- Setup config for Cloudflare R2
- Setup drizzle-orm with postgresql & ULID
- Setup jsonwebtoken
- Setup redis
- Setup winston
- Setup zod
- Setup typst
- Install xlxs (SheetJS)
- Setup nodemailer
