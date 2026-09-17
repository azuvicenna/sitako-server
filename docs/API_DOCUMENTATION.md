# Dokumentasi API SITAKO (Sistem Informasi Perpustakaan)

Dokumentasi ini disusun khusus untuk tim Frontend sebagai panduan integrasi lengkap dengan Backend SITAKO. Dokumen ini mencakup seluruh endpoint di folder `src/routes`, format URL, query parameters, header/cookie autentikasi, request body, format response lengkap (berhasil dan gagal spesifik per endpoint), serta catatan teknis penting.

---

## Daftar Isi
1. [Ketentuan Umum & Arsitektur Request](#ketentuan-umum--arsitektur-request)
2. [Format Respons Standar](#format-respons-standar)
3. [Autentikasi (`/api/auth`)](#1-autentikasi-apiauth)
4. [Profil Pengguna (`/api/profile`)](#2-profil-pengguna-apiprofile)
5. [Dashboard Pustakawan (`/api/dashboard`)](#3-dashboard-pustakawan-apidashboard)
6. [Manajemen Buku - Pustakawan (`/api/books`)](#4-manajemen-buku---pustakawan-apibooks)
7. [Manajemen Rak & Susunan Buku - Pustakawan (`/api/shelves`)](#5-manajemen-rak--susunan-buku---pustakawan-apishelves)
8. [Manajemen Pustakawan (`/api/user/librarians`)](#6-manajemen-pustakawan-apiuserlibrarians)
9. [Manajemen Anggota (`/api/user/members`)](#7-manajemen-anggota-apiusermembers)
10. [Transaksi Peminjaman - Pustakawan (`/api/transactions`)](#8-transaksi-peminjaman---pustakawan-apitransactions)
11. [Aturan Denda - Pustakawan (`/api/fines`)](#9-aturan-denda---pustakawan-apifines)
12. [Pembayaran Denda - Pustakawan (`/api/fine-payments`)](#10-pembayaran-denda---pustakawan-apifine-payments)
13. [Perpustakaan & Bookmark - Anggota (`/api/book`)](#11-perpustakaan--bookmark---anggota-apibook)
14. [Transaksi - Anggota (`/api/member/transactions`)](#12-transaksi---anggota-apimembertransactions)
15. [Pembayaran Denda Online - Anggota (`/api/member/fine-payments`)](#13-pembayaran-denda-online---anggota-apimemberfine-payments)
16. [Dashboard - Anggota (`/api/member/dashboard`)](#14-dashboard---anggota-apimemberdashboard)
17. [Webhook Payment Gateway Tripay (`/api/webhooks/tripay`)](#15-webhook-payment-gateway-tripay-apiwebhookstripay)
18. [Laporan Sirkulasi & Denda - Pustakawan (`/api/reports`)](#16-laporan-sirkulasi--denda---pustakawan-apireports)
19. [Daftar Enum Database](#17-daftar-enum-database)
20. [Tips & Panduan Integrasi Frontend](#18-tips--panduan-integrasi-frontend)

---

## Ketentuan Umum & Arsitektur Request

### 1. Base URL
Seluruh endpoint API memiliki prefix `/api`:
```
http://localhost:5000/api
```
*(Sesuaikan port dan host dengan file `.env` atau URL staging/production).*

### 2. Autentikasi (Cookie-based JWT)
- SITAKO menggunakan **HttpOnly Cookie** bernama `token` untuk sesi login dan `captcha_token` untuk proses CAPTCHA.
- Setiap pemanggilan request dari Frontend ke API yang membutuhkan autentikasi **WAJIB** mengaktifkan opsi kredensial:
  - **Axios**: `withCredentials: true`
  - **Fetch API**: `credentials: "include"`

### 3. Header Standar
- Request dengan JSON body: `Content-Type: application/json`
- Request file upload: `Content-Type: multipart/form-data`

---

## Format Respons Standar

### 1. Respons Berhasil (200 / 201)
Format respons dasar:
```json
{
  "success": true,
  "message": "Pesan sukses operasi",
  "data": ... // atau objek model langsung di-spread ke root respons
}
```

### 2. Respons Berhasil dengan Pagination
Untuk endpoint yang memiliki pagination tabel:
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    { ... }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalRows": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Respons Gagal Validasi Zod (400 Bad Request)
Format standar yang dikembalikan saat middleware validasi Zod mendeteksi payload tidak sesuai skema:
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "namaField",
      "message": "Pesan error spesifik untuk field tersebut"
    }
  ]
}
```

### 4. Respons Gagal Autentikasi (401 Unauthorized)
Format saat cookie `token` tidak disertakan atau sesi kedaluwarsa:
```json
{
  "success": false,
  "message": "Akses ditolak. Belum login."
}
```
atau:
```json
{
  "success": false,
  "message": "Sesi tidak valid atau kedaluwarsa."
}
```

### 5. Respons Gagal Not Found (404 Not Found)
```json
{
  "success": false,
  "message": "[Entitas] tidak ditemukan"
}
```

### 6. Respons Kesalahan Server (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 1. Autentikasi (`/api/auth`)

### 1.1 Mendapatkan Gambar CAPTCHA
Mengambil kode CAPTCHA berupa gambar vektor SVG dan menyetel cookie `captcha_token`.

- **Method**: `GET`
- **URL**: `/api/auth/captcha`
- **Auth**: Public (Tidak perlu login)
- **Query Params**: Tidak ada
- **Response Headers**:
  - `Content-Type`: `image/svg+xml`
  - `Set-Cookie`: `captcha_token=<hash>; Path=/; HttpOnly; SameSite=Strict; Max-Age=300`
- **Response Body (200 OK)**:
  Berupa string XML/SVG gambar CAPTCHA langsung (dapat dirender langsung dalam tag `<img>` atau inline SVG).
- **Response Error**:
  - `500 Internal Server Error`:
    ```json
    {
      "success": false,
      "message": "Internal server error"
    }
    ```

---

### 1.2 Login Pengguna (Pustakawan / Anggota)
Melakukan verifikasi akun menggunakan identifier (NIP untuk Pustakawan, NIS untuk Anggota), kata sandi, dan teks CAPTCHA.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: Public (Harus menyertakan cookie `captcha_token` dari endpoint CAPTCHA sebelumnya)
- **Query Params**: Tidak ada
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "identifier": "198501012010011001",
    "password": "passwordRahasia123",
    "captcha": "a4k9z"
  }
  ```
- **Response (200 OK)**:
  - **Set-Cookie**: `token=<jwt_token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Login sukses",
      "user": {
        "id": "01JMB39478...",
        "nama": "Ahmad Fauzi",
        "nip": "198501012010011001",
        "email": "ahmad.fauzi@sitako.sch.id",
        "telepon": "081234567890",
        "foto": "https://storage.sitako.id/profiles/uuid.jpg",
        "status_aktif": true,
        "createdAt": "2026-01-15T08:30:00.000Z"
      }
    }
    ```
    *(Jika yang login adalah Anggota, field `nip` digantikan oleh `nis`: `"202301001"`).*
- **Response Error**:
  - `400 Bad Request` (Validasi Zod):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "identifier", "message": "NIP/NIS tidak boleh kosong" },
        { "field": "password", "message": "Password tidak boleh kosong" },
        { "field": "captcha", "message": "Captcha tidak boleh kosong" }
      ]
    }
    ```
  - `400 Bad Request` (Captcha salah / tidak ada):
    ```json
    {
      "success": false,
      "message": "Captcha tidak valid atau kedaluwarsa"
    }
    ```
  - `401 Unauthorized` (NIP/NIS atau Password salah):
    ```json
    {
      "success": false,
      "message": "Kredensial tidak valid"
    }
    ```

---

### 1.3 Logout Pengguna
Menghapus cookie sesi `token`.

- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Auth**: Wajib (Cookie `token`)
- **Query Params**: Tidak ada
- **Request Body**: Kosong
- **Response (200 OK)**:
  - **Clear-Cookie**: `token`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Logout berhasil"
    }
    ```
- **Response Error**:
  - `401 Unauthorized` (Belum login):
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

## 2. Profil Pengguna (`/api/profile`)

### 2.1 Mendapatkan Profil Pribadi
Mengambil data profil pengguna yang sedang login berdasarkan sesi token.

- **Method**: `GET`
- **URL**: `/api/profile/me`
- **Auth**: Wajib (Pustakawan / Anggota)
- **Query Params**: Tidak ada
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMB39478...",
    "nama": "Ahmad Fauzi",
    "nip": "198501012010011001",
    "email": "ahmad.fauzi@sitako.sch.id",
    "telepon": "081234567890",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-01-15T08:30:00.000Z"
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Profil tidak ditemukan"
    }
    ```

---

### 2.2 Memperbarui Profil Pribadi
Mengubah informasi profil pengguna yang sedang login.

- **Method**: `PUT`
- **URL**: `/api/profile/me`
- **Auth**: Wajib (Pustakawan / Anggota)
- **Query Params**: Tidak ada
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON - Partial update)**:
  ```json
  {
    "nama": "Ahmad Fauzi, S.Pd",
    "email": "ahmad.baru@sitako.sch.id",
    "telepon": "081298765432",
    "password": "passwordBaru123"
  }
  ```
  *(Catatan: Kirimkan hanya field yang ingin diubah).*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profil berhasil diperbarui",
    "id": "01JMB39478...",
    "nama": "Ahmad Fauzi, S.Pd",
    "nip": "198501012010011001",
    "email": "ahmad.baru@sitako.sch.id",
    "telepon": "081298765432",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-01-15T08:30:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi format email salah):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "email", "message": "Format email tidak valid" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Profil tidak ditemukan"
    }
    ```

---

## 3. Dashboard Pustakawan (`/api/dashboard`)

### 3.1 Ringkasan Kartu Dashboard
Statistik utama untuk kartu ringkasan dashboard perpustakaan.

- **Method**: `GET`
- **URL**: `/api/dashboard/summary`
- **Auth**: Wajib (Pustakawan)
- **Query Params**: Tidak ada
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Ringkasan dashboard berhasil diambil",
    "buku": {
      "fisik": 150,
      "digital": 45
    },
    "anggotaAktif": 320,
    "bukuDipinjam": 25,
    "jatuhTempo": 3
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 3.2 Transaksi Hari Ini
Daftar transaksi yang dibuat pada hari ini lengkap beserta ringkasan status hari ini.

- **Method**: `GET`
- **URL**: `/api/dashboard/transaction/today`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | string | Opsional | `"Semua"` | Filter status: `"Semua"`, `"Menunggu Persetujuan"`, `"Dibatalkan"`, `"Menunggu Diambil"`, `"Dipinjam"`, `"Dikembalikan"`, `"Terlambat"`, `"Tidak Mengembalikan"` |
  | `page` | integer | Opsional | `1` | Nomor halaman (mulai dari 1) |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman (maks: 100) |
- **Contoh Request**: `/api/dashboard/transaction/today?status=Dipinjam&page=1&limit=10`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data transaksi hari ini berhasil diambil",
    "data": [
      {
        "id": "01JMB39478...",
        "bukuId": "01JMB23490...",
        "pustakawanId": "01JMB11111...",
        "anggotaId": "01JMB22222...",
        "kdTransaksi": "TRX-20260913-0001",
        "tglPinjam": "2026-09-13T08:00:00.000Z",
        "tglKembali": "2026-09-20T08:00:00.000Z",
        "status": "Dipinjam",
        "createdAt": "2026-09-13T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "summary": {
      "semua": 12,
      "menungguPersetujuan": 2,
      "dibatalkan": 0,
      "menungguDiambil": 3,
      "dipinjam": 5,
      "dikembalikan": 1,
      "terlambat": 1,
      "tidakMengembalikan": 0
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Nilai status filter tidak valid):
    ```json
    {
      "success": false,
      "message": "Status transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 3.3 Statistik Peminjaman Mingguan
Statistik jumlah transaksi peminjaman selama 7 hari terakhir beserta nilai rata-rata hariannya untuk grafik/chart.

- **Method**: `GET`
- **URL**: `/api/dashboard/statistics`
- **Auth**: Wajib (Pustakawan)
- **Query Params**: Tidak ada
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Statistik mingguan berhasil diambil",
    "statistik": [
      { "tanggal": "2026-09-07", "hari": "Senin", "total": 8 },
      { "tanggal": "2026-09-08", "hari": "Selasa", "total": 12 },
      { "tanggal": "2026-09-09", "hari": "Rabu", "total": 15 },
      { "tanggal": "2026-09-10", "hari": "Kamis", "total": 10 },
      { "tanggal": "2026-09-11", "hari": "Jumat", "total": 14 },
      { "tanggal": "2026-09-12", "hari": "Sabtu", "total": 6 },
      { "tanggal": "2026-09-13", "hari": "Minggu", "total": 4 }
    ],
    "rataRata": 10
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

## 4. Manajemen Buku - Pustakawan (`/api/books`)

### 4.1 Mendapatkan Daftar Buku dengan Pagination
- **Method**: `GET`
- **URL**: `/api/books/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `bookType` | string | **WAJIB** | - | Pilihan nilai: `"Fisik"` atau `"Digital"` |
  | `page` | integer | Opsional | `1` | Nomor halaman (mulai dari 1) |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman (maks: 100) |
  | `search` | string | Opsional | `""` | Pencarian pada: judul, penulis, penerbit, isbn |
- **Contoh Request**: `/api/books/?bookType=Fisik&page=1&limit=10&search=clean+code`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMB23490...",
        "judul": "Clean Code",
        "penulis": "Robert C. Martin",
        "isbn": "9780132350884",
        "penerbit": "Prentice Hall",
        "genre": ["Software Engineering", "Programming"],
        "tipeBuku": "Fisik",
        "tahunTerbit": 2008,
        "jumlahStok": 5,
        "cover": "https://storage.sitako.id/covers/clean-code.jpg",
        "file": null,
        "createdAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Parameter `bookType` tidak ada atau salah):
    ```json
    {
      "success": false,
      "message": "Tipe buku tidak ditemukan atau tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 4.2 Detail Informasi Buku
- **Method**: `GET`
- **URL**: `/api/books/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**:
  - `id`: ULID buku yang dicari
- **Query Params**: Tidak ada
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMB23490...",
    "judul": "Clean Code",
    "penulis": "Robert C. Martin",
    "isbn": "9780132350884",
    "penerbit": "Prentice Hall",
    "genre": ["Software Engineering", "Programming"],
    "tipeBuku": "Fisik",
    "tahunTerbit": 2008,
    "jumlahStok": 5,
    "cover": "https://storage.sitako.id/covers/clean-code.jpg",
    "file": null,
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (ID kosong atau format tidak valid):
    ```json
    {
      "success": false,
      "message": "ID buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found` (ID buku tidak ditemukan di database):
    ```json
    {
      "success": false,
      "message": "Buku tidak ditemukan"
    }
    ```

---

### 4.3 Menambahkan Data Buku Baru
- **Method**: `POST`
- **URL**: `/api/books/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `bookType` | string | **WAJIB** | `"Fisik"` atau `"Digital"` |
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data`)**:
  | Field | Tipe | Wajib? | Keterangan / Batasan |
  | :--- | :--- | :--- | :--- |
  | `judul` | text | Wajib | Judul buku |
  | `penulis` | text | Wajib | Nama pengarang/penulis |
  | `isbn` | text | Wajib | Nomor ISBN |
  | `penerbit` | text | Wajib | Nama penerbit |
  | `genre` | text / JSON | Wajib | Format JSON string array `["Genre 1", "Genre 2"]` atau string tunggal |
  | `tipeBuku` | text | Opsional | `"Fisik"` atau `"Digital"` (default sesuai query param) |
  | `tahunTerbit`| text/number | Wajib | Angka tahun terbit (misal: `"2024"`) |
  | `jumlahStok` | text/number | Opsional | Jumlah stok buku (default: `0`) |
  | `cover` | file | **WAJIB** | Gambar cover (JPG, PNG, WEBP, Maksimal 5MB) |
  | `file` | file | Kondisional | File PDF buku (Wajib jika buku `Digital`, Maksimal 20MB) |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Buku berhasil ditambahkan",
    "id": "01JMB23490...",
    "judul": "Clean Architecture",
    "penulis": "Robert C. Martin",
    "isbn": "9780134494166",
    "penerbit": "Prentice Hall",
    "genre": ["Software Architecture"],
    "tipeBuku": "Fisik",
    "tahunTerbit": 2017,
    "jumlahStok": 10,
    "cover": "https://storage.sitako.id/covers/uuid.jpg",
    "file": null,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Query param `bookType` tidak ada/tidak valid):
    ```json
    {
      "success": false,
      "message": "Tipe buku tidak ditemukan atau tidak valid"
    }
    ```
  - `400 Bad Request` (Validasi input / file gagal):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "judul", "message": "Judul buku tidak boleh kosong" },
        { "field": "isbn", "message": "ISBN tidak boleh kosong" },
        { "field": "cover", "message": "Cover buku wajib diupload" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 4.4 Mengubah Data Buku
- **Method**: `PUT`
- **URL**: `/api/books/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id` (ULID buku yang akan diubah)
- **Query Params**: Tidak ada
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data` - Partial)**:
  *(Kirim field yang ingin diubah saja)*
  - `judul`, `penulis`, `isbn`, `penerbit`, `genre`, `tipeBuku`, `tahunTerbit`, `jumlahStok`
  - `cover`: file gambar baru jika ingin mengganti cover
  - `file`: file PDF baru jika ingin mengganti file digital
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data buku berhasil diperbarui",
    "id": "01JMB23490...",
    "judul": "Clean Architecture - Edisi Terbaru",
    "penulis": "Robert C. Martin",
    "isbn": "9780134494166",
    "penerbit": "Prentice Hall",
    "genre": ["Software Architecture"],
    "tipeBuku": "Fisik",
    "tahunTerbit": 2017,
    "jumlahStok": 12,
    "cover": "https://storage.sitako.id/covers/new-cover-uuid.jpg",
    "file": null,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (ID tidak valid):
    ```json
    {
      "success": false,
      "message": "ID buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Buku tidak ditemukan"
    }
    ```

---

### 4.5 Menghapus Buku
- **Method**: `DELETE`
- **URL**: `/api/books/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id` (ULID buku)
- **Query Params**: Tidak ada
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data buku berhasil dihapus",
    "id": "01JMB23490...",
    "judul": "Clean Architecture",
    "penulis": "Robert C. Martin",
    "isbn": "9780134494166",
    "penerbit": "Prentice Hall",
    "genre": ["Software Architecture"],
    "tipeBuku": "Fisik",
    "tahunTerbit": 2017,
    "jumlahStok": 12,
    "cover": "https://storage.sitako.id/covers/uuid.jpg",
    "file": null,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (ID tidak valid):
    ```json
    {
      "success": false,
      "message": "ID buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Buku tidak ditemukan"
    }
    ```

---

## 5. Manajemen Rak & Susunan Buku - Pustakawan (`/api/shelves`)

### 5.1 Mendapatkan Daftar Rak Buku
- **Method**: `GET`
- **URL**: `/api/shelves/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Pencarian pada nama rak |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBRAK001...",
        "namaRak": "Rak A - Ilmu Komputer",
        "createdAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 5.2 Detail Rak Buku
- **Method**: `GET`
- **URL**: `/api/shelves/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id` (ULID rak)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBRAK001...",
    "namaRak": "Rak A - Ilmu Komputer",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID rak buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Rak buku tidak ditemukan"
    }
    ```

---

### 5.3 Menambahkan Rak Buku
- **Method**: `POST`
- **URL**: `/api/shelves/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "namaRak": "Rak B - Sains & Matematika"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Rak buku berhasil ditambahkan",
    "id": "01JMBRAK002...",
    "namaRak": "Rak B - Sains & Matematika",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "namaRak", "message": "Nama rak tidak boleh kosong" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 5.4 Mengubah Nama Rak
- **Method**: `PUT`
- **URL**: `/api/shelves/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id` (ULID rak)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "namaRak": "Rak B - Sains Terapan"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data rak buku berhasil diperbarui",
    "id": "01JMBRAK002...",
    "namaRak": "Rak B - Sains Terapan",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID rak buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Rak buku tidak ditemukan"
    }
    ```

---

### 5.5 Menghapus Rak
- **Method**: `DELETE`
- **URL**: `/api/shelves/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id` (ULID rak)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data rak buku berhasil dihapus",
    "id": "01JMBRAK002..."
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID rak buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Rak buku tidak ditemukan"
    }
    ```

---

### 5.6 Mendapatkan Susunan (Stacks) pada Suatu Rak
Mengambil susunan buku (stack/slot) pada rak tertentu.

- **Method**: `GET`
- **URL**: `/api/shelves/:shelfId/stacks`
- **Auth**: Wajib (Pustakawan)
- **Path Params**:
  - `shelfId`: ULID rak
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Opsional | `1` | Halaman data |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Filter kode susunan, nomor susunan, atau judul buku |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBSTACK01...",
        "bukuId": "01JMB23490...",
        "kdSusunan": "RAK-A-1",
        "nomorSusunan": 1,
        "judulBuku": "Clean Code",
        "createdAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 15,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID rak tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 5.7 Detail Susunan Rak
- **Method**: `GET`
- **URL**: `/api/shelves/:shelfId/stacks/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**:
  - `shelfId`: ULID rak
  - `id`: ULID susunan (stack)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBSTACK01...",
    "rakId": "01JMBRAK001...",
    "bukuId": "01JMB23490...",
    "kdSusunan": "RAK-A-1",
    "nomorSusunan": 1,
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID susunan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Susunan rak tidak ditemukan"
    }
    ```

---

### 5.8 Menambahkan Susunan Rak Baru
- **Method**: `POST`
- **URL**: `/api/shelves/:shelfId/stacks`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `shelfId`
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "rakId": "01JMBRAK001...",
    "bukuId": "01JMB23490...",
    "kdSusunan": "RAK-A-2",
    "nomorSusunan": 2
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Susunan rak berhasil ditambahkan",
    "id": "01JMBSTACK02...",
    "rakId": "01JMBRAK001...",
    "bukuId": "01JMB23490...",
    "kdSusunan": "RAK-A-2",
    "nomorSusunan": 2,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "rakId", "message": "Rak tidak boleh kosong" },
        { "field": "bukuId", "message": "Buku tidak boleh kosong" },
        { "field": "nomorSusunan", "message": "Nomor susunan harus angka bulat" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 5.9 Mengubah Susunan Rak
- **Method**: `PUT`
- **URL**: `/api/shelves/:shelfId/stacks/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `shelfId`, `id` (ULID stack)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON - partial)**:
  ```json
  {
    "kdSusunan": "RAK-A-2B",
    "nomorSusunan": 3
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data susunan rak berhasil diperbarui",
    "id": "01JMBSTACK02...",
    "rakId": "01JMBRAK001...",
    "bukuId": "01JMB23490...",
    "kdSusunan": "RAK-A-2B",
    "nomorSusunan": 3,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID susunan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Susunan rak tidak ditemukan"
    }
    ```

---

### 5.10 Menghapus Susunan Rak
- **Method**: `DELETE`
- **URL**: `/api/shelves/:shelfId/stacks/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `shelfId`, `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data susunan rak berhasil dihapus",
    "id": "01JMBSTACK02...",
    "rakId": "01JMBRAK001...",
    "bukuId": "01JMB23490...",
    "kdSusunan": "RAK-A-2",
    "nomorSusunan": 2,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID susunan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Susunan rak tidak ditemukan"
    }
    ```

---

## 6. Manajemen Pustakawan (`/api/user/librarians`)

### 6.1 Mendapatkan Daftar Pustakawan
- **Method**: `GET`
- **URL**: `/api/user/librarians/`
- **Auth**: Wajib (Pengguna terautentikasi: Pustakawan / Anggota untuk pemilihan petugas sirkulasi)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `statusActive` | string | **WAJIB** | - | Pilihan nilai: `"Semua"`, `"true"`, atau `"false"` |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Pencarian pada nama, nip, email, telepon |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBLIB01...",
        "nama": "Siti Nurhaliza",
        "nip": "199002022015022002",
        "email": "siti@sitako.sch.id",
        "telepon": "081234567891",
        "foto": "https://storage.sitako.id/profiles/siti.jpg",
        "status_aktif": true,
        "createdAt": "2026-07-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Query param `statusActive` tidak valid):
    ```json
    {
      "success": false,
      "message": "Status aktif tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 6.2 Detail Pustakawan
- **Method**: `GET`
- **URL**: `/api/user/librarians/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBLIB01...",
    "nama": "Siti Nurhaliza",
    "nip": "199002022015022002",
    "email": "siti@sitako.sch.id",
    "telepon": "081234567891",
    "foto": "https://storage.sitako.id/profiles/siti.jpg",
    "status_aktif": true,
    "createdAt": "2026-07-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pustakawan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Pustakawan tidak ditemukan"
    }
    ```

---

### 6.3 Menambahkan Pustakawan Baru
- **Method**: `POST`
- **URL**: `/api/user/librarians/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data`)**:
  | Field | Tipe | Wajib? | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `nama` | text | Wajib | Nama lengkap pustakawan |
  | `nip` | text | Wajib | NIP |
  | `email` | text | Wajib | Format email valid |
  | `password` | text | Wajib | Password akun |
  | `telepon` | text | Wajib | Nomor telepon aktif |
  | `status_aktif`| boolean/string | Opsional | `true` atau `false` (default: `true`) |
  | `foto` | file | **WAJIB** | Foto profil (JPG/PNG/WEBP, Maksimal 2MB) |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pustakawan berhasil ditambahkan",
    "id": "01JMBLIB02...",
    "nama": "Dewi Sartika",
    "nip": "199203032016032003",
    "email": "dewi@sitako.sch.id",
    "telepon": "081234567892",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod / Foto wajib):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "foto", "message": "Foto wajib diupload" },
        { "field": "nip", "message": "NIP tidak boleh kosong" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 6.4 Mengubah Data Pustakawan
- **Method**: `PUT`
- **URL**: `/api/user/librarians/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data` - Partial)**:
  - `nama`, `nip`, `email`, `password`, `telepon`, `status_aktif`
  - `foto`: file gambar baru (opsional, maks 2MB)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data pustakawan berhasil diperbarui",
    "id": "01JMBLIB02...",
    "nama": "Dewi Sartika, S.Hum",
    "nip": "199203032016032003",
    "email": "dewi.sartika@sitako.sch.id",
    "telepon": "081234567892",
    "foto": "https://storage.sitako.id/profiles/new-uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pustakawan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Pustakawan tidak ditemukan"
    }
    ```

---

### 6.5 Menghapus Pustakawan
- **Method**: `DELETE`
- **URL**: `/api/user/librarians/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data pustakawan berhasil dihapus",
    "id": "01JMBLIB02...",
    "nama": "Dewi Sartika",
    "nip": "199203032016032003",
    "email": "dewi@sitako.sch.id",
    "telepon": "081234567892",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pustakawan tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Pustakawan tidak ditemukan"
    }
    ```

---

## 7. Manajemen Anggota (`/api/user/members`)

### 7.1 Mendapatkan Daftar Anggota
- **Method**: `GET`
- **URL**: `/api/user/members/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `statusActive` | string | **WAJIB** | - | Pilihan nilai: `"Semua"`, `"true"`, atau `"false"` |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Pencarian pada nama, nis, email, telepon |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBMEM01...",
        "nama": "Budi Santoso",
        "nis": "202301001",
        "email": "budi@student.sch.id",
        "telepon": "081299998888",
        "foto": "https://storage.sitako.id/profiles/budi.jpg",
        "status_aktif": true,
        "createdAt": "2026-07-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 150,
      "totalPages": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Parameter `statusActive` salah):
    ```json
    {
      "success": false,
      "message": "Status aktif tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 7.2 Detail Anggota
- **Method**: `GET`
- **URL**: `/api/user/members/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBMEM01...",
    "nama": "Budi Santoso",
    "nis": "202301001",
    "email": "budi@student.sch.id",
    "telepon": "081299998888",
    "foto": "https://storage.sitako.id/profiles/budi.jpg",
    "status_aktif": true,
    "createdAt": "2026-07-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID anggota tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Anggota tidak ditemukan"
    }
    ```

---

### 7.3 Menambahkan Anggota Baru
- **Method**: `POST`
- **URL**: `/api/user/members/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data`)**:
  | Field | Tipe | Wajib? | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `nama` | text | Wajib | Nama lengkap anggota / siswa |
  | `nis` | text | Wajib | NIS |
  | `email` | text | Wajib | Format email valid |
  | `password` | text | Wajib | Password akun anggota |
  | `telepon` | text | Wajib | Nomor telepon/WhatsApp |
  | `status_aktif`| boolean/string | Opsional | `true` atau `false` (default: `true`) |
  | `foto` | file | **WAJIB** | Foto profil (JPG/PNG/WEBP, Maksimal 2MB) |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Anggota berhasil ditambahkan",
    "id": "01JMBMEM02...",
    "nama": "Citra Lestari",
    "nis": "202301002",
    "email": "citra@student.sch.id",
    "telepon": "081299997777",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod / Foto wajib):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "foto", "message": "Foto wajib diupload" },
        { "field": "nis", "message": "NIS tidak boleh kosong" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 7.4 Mengubah Data Anggota
- **Method**: `PUT`
- **URL**: `/api/user/members/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (`multipart/form-data` - Partial)**:
  - `nama`, `nis`, `email`, `password`, `telepon`, `status_aktif`
  - `foto`: file gambar baru (opsional, maks 2MB)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data anggota berhasil diperbarui",
    "id": "01JMBMEM02...",
    "nama": "Citra Lestari Wulandari",
    "nis": "202301002",
    "email": "citra.wulandari@student.sch.id",
    "telepon": "081299997777",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID anggota tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Anggota tidak ditemukan"
    }
    ```

---

### 7.5 Menghapus Anggota
- **Method**: `DELETE`
- **URL**: `/api/user/members/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data anggota berhasil dihapus",
    "id": "01JMBMEM02...",
    "nama": "Citra Lestari",
    "nis": "202301002",
    "email": "citra@student.sch.id",
    "telepon": "081299997777",
    "foto": "https://storage.sitako.id/profiles/uuid.jpg",
    "status_aktif": true,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID anggota tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Anggota tidak ditemukan"
    }
    ```

---

## 8. Transaksi Peminjaman - Pustakawan (`/api/transactions`)

### 8.1 Daftar Seluruh Transaksi
- **Method**: `GET`
- **URL**: `/api/transactions/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | string | **WAJIB** | - | Nilai: `"Semua"`, `"Menunggu Persetujuan"`, `"Dibatalkan"`, `"Menunggu Diambil"`, `"Dipinjam"`, `"Dikembalikan"`, `"Terlambat"`, `"Tidak Mengembalikan"` |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Mencari kode transaksi, nama anggota, nama pustakawan, atau judul buku |
- **Contoh Request**: `/api/transactions/?status=Dipinjam&page=1&limit=10`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBTRX01...",
        "kdTransaksi": "TRX-20260913-0001",
        "tglPinjam": "2026-09-13T08:00:00.000Z",
        "tglKembali": "2026-09-20T08:00:00.000Z",
        "status": "Dipinjam",
        "namaAnggota": "Budi Santoso",
        "namaPustakawan": "Ahmad Fauzi",
        "judulBuku": "Clean Code"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Parameter `status` salah / tidak diisi):
    ```json
    {
      "success": false,
      "message": "Status transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 8.2 Detail Transaksi
- **Method**: `GET`
- **URL**: `/api/transactions/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBTRX01...",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "kdTransaksi": "TRX-20260913-0001",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Dipinjam",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data transaksi tidak ditemukan"
    }
    ```

---

### 8.3 Membuat Transaksi Baru (Check Out)
- **Method**: `POST`
- **URL**: `/api/transactions/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Dipinjam"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaksi berhasil dibuat",
    "id": "01JMBTRX02...",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "kdTransaksi": "TRX-20260913-0002",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Dipinjam",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Stok habis):
    ```json
    {
      "success": false,
      "message": "Stok buku habis"
    }
    ```
  - `400 Bad Request` (Maksimal pinjam tercapai):
    ```json
    {
      "success": false,
      "message": "Maksimum pinjam tercapai (maksimal 3 transaksi aktif)"
    }
    ```
  - `400 Bad Request` (Anggota menunggak buku terlambat):
    ```json
    {
      "success": false,
      "message": "Member memiliki buku yang terlambat dikembalikan (fisik belum dikonfirmasi)"
    }
    ```
  - `400 Bad Request` (Anggota memiliki denda buku hilang belum lunas):
    ```json
    {
      "success": false,
      "message": "Member memiliki denda buku hilang yang belum dibayar lunas"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 8.4 Memperbarui Status Transaksi
- **Method**: `PUT`
- **URL**: `/api/transactions/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON - partial)**:
  ```json
  {
    "status": "Dikembalikan",
    "tglKembali": "2026-09-15T08:00:00.000Z"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data transaksi berhasil diperbarui",
    "id": "01JMBTRX02...",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "kdTransaksi": "TRX-20260913-0002",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-15T08:00:00.000Z",
    "status": "Dikembalikan",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data transaksi tidak ditemukan"
    }
    ```

---

### 8.5 Menghapus Transaksi
- **Method**: `DELETE`
- **URL**: `/api/transactions/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data transaksi berhasil dihapus",
    "id": "01JMBTRX02...",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "kdTransaksi": "TRX-20260913-0002",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-15T08:00:00.000Z",
    "status": "Dikembalikan",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data transaksi tidak ditemukan"
    }
    ```

---

## 9. Aturan Denda - Pustakawan (`/api/fines`)

### 9.1 Daftar Aturan Denda
- **Method**: `GET`
- **URL**: `/api/fines/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Pencarian jenis denda, harga, metode perhitungan, atau judul buku |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBFINE01...",
        "jenisDenda": "Terlambat",
        "hargaDenda": 1000,
        "metodePerhitungan": "Akumulasi",
        "judulBuku": "Clean Code",
        "createdAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 9.2 Detail Aturan Denda
- **Method**: `GET`
- **URL**: `/api/fines/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBFINE01...",
    "bukuId": "01JMB23490...",
    "jenisDenda": "Terlambat",
    "hargaDenda": 1000,
    "metodePerhitungan": "Akumulasi",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Denda tidak ditemukan"
    }
    ```

---

### 9.3 Membuat Aturan Denda Baru
- **Method**: `POST`
- **URL**: `/api/fines/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "bukuId": "01JMB23490...",
    "jenisDenda": "Terlambat",
    "hargaDenda": 1000,
    "metodePerhitungan": "Akumulasi"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Denda berhasil ditambahkan",
    "id": "01JMBFINE02...",
    "bukuId": "01JMB23490...",
    "jenisDenda": "Terlambat",
    "hargaDenda": 1000,
    "metodePerhitungan": "Akumulasi",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "bukuId", "message": "Buku tidak boleh kosong" },
        { "field": "hargaDenda", "message": "Harga denda tidak boleh minus" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 9.4 Mengubah Aturan Denda
- **Method**: `PUT`
- **URL**: `/api/fines/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON - partial)**:
  ```json
  {
    "hargaDenda": 2000,
    "metodePerhitungan": "Akumulasi"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data denda berhasil diperbarui",
    "id": "01JMBFINE02...",
    "bukuId": "01JMB23490...",
    "jenisDenda": "Terlambat",
    "hargaDenda": 2000,
    "metodePerhitungan": "Akumulasi",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Denda tidak ditemukan"
    }
    ```

---

### 9.5 Menghapus Aturan Denda
- **Method**: `DELETE`
- **URL**: `/api/fines/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data denda berhasil dihapus",
    "id": "01JMBFINE02...",
    "bukuId": "01JMB23490...",
    "jenisDenda": "Terlambat",
    "hargaDenda": 2000,
    "metodePerhitungan": "Akumulasi",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Denda tidak ditemukan"
    }
    ```

---

## 10. Pembayaran Denda - Pustakawan (`/api/fine-payments`)

### 10.1 Daftar Pembayaran Denda
- **Method**: `GET`
- **URL**: `/api/fine-payments/`
- **Auth**: Wajib (Pustakawan)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Pencarian nominal denda, metode bayar, nama anggota, nama pustakawan, kode transaksi, judul buku |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBPAY01...",
        "hargaDenda": 1000,
        "totalDenda": 5000,
        "tglBayar": "2026-09-13T09:00:00.000Z",
        "metodePembayaran": "Tunai",
        "createdAt": "2026-09-13T09:00:00.000Z",
        "namaPustakawan": "Ahmad Fauzi",
        "namaAnggota": "Budi Santoso",
        "kdTransaksi": "TRX-20260913-0001",
        "judulBuku": "Clean Code"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 32,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 10.2 Detail Pembayaran Denda
- **Method**: `GET`
- **URL**: `/api/fine-payments/detail/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBPAY01...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 5000,
    "tglBayar": "2026-09-13T09:00:00.000Z",
    "metodePembayaran": "Tunai",
    "paymentStatus": "PAID",
    "tripayReference": null,
    "paymentMethodCode": null,
    "checkoutUrl": null,
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pembayaran denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data pembayaran denda tidak ditemukan"
    }
    ```

---

### 10.3 Mencatat Pembayaran Denda Manual (Tunai)
Digunakan oleh Pustakawan untuk mencatat pembayaran denda langsung/tunai di perpustakaan.

- **Method**: `POST`
- **URL**: `/api/fine-payments/`
- **Auth**: Wajib (Pustakawan)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 5000,
    "tglBayar": "2026-09-13T09:00:00.000Z",
    "metodePembayaran": "Tunai"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pembayaran denda berhasil dicatat",
    "id": "01JMBPAY02...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 5000,
    "tglBayar": "2026-09-13T09:00:00.000Z",
    "metodePembayaran": "Tunai",
    "paymentStatus": "PAID",
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Validasi Zod):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "transaksiId", "message": "Transaksi tidak boleh kosong" },
        { "field": "totalDenda", "message": "Total denda wajib diisi angka" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 10.4 Mengubah Data Pembayaran Denda
- **Method**: `PUT`
- **URL**: `/api/fine-payments/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON - partial)**:
  ```json
  {
    "totalDenda": 6000,
    "metodePembayaran": "Tunai"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data pembayaran denda berhasil diperbarui",
    "id": "01JMBPAY02...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 6000,
    "tglBayar": "2026-09-13T09:00:00.000Z",
    "metodePembayaran": "Tunai",
    "paymentStatus": "PAID",
    "tripayReference": null,
    "paymentMethodCode": null,
    "checkoutUrl": null,
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pembayaran denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data pembayaran denda tidak ditemukan"
    }
    ```

---

### 10.5 Menghapus Data Pembayaran Denda
- **Method**: `DELETE`
- **URL**: `/api/fine-payments/:id`
- **Auth**: Wajib (Pustakawan)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data pembayaran denda berhasil dihapus",
    "id": "01JMBPAY02...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 6000,
    "tglBayar": "2026-09-13T09:00:00.000Z",
    "metodePembayaran": "Tunai",
    "paymentStatus": "PAID",
    "tripayReference": null,
    "paymentMethodCode": null,
    "checkoutUrl": null,
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pembayaran denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data pembayaran denda tidak ditemukan"
    }
    ```

---

## 11. Perpustakaan & Bookmark - Anggota (`/api/book`)

### 11.1 Mengambil Daftar Buku (Katalog Member)
Mengambil daftar katalog buku yang tersedia di perpustakaan untuk dapat dipinjam atau dibaca oleh anggota, didukung pagination dan pencarian.

- **Method**: `GET`
- **URL**: `/api/book` atau `/api/book/`
- **Auth**: Wajib (Anggota via cookie `token`)
- **Headers**: `Content-Type: application/json`
- **Query Params**:
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10, max: 100)
  - `search` (string, optional, pencarian pada judul, penulis, penerbit, atau ISBN)
  - `bookType` (string, optional, filter jenis buku: `Fisik` atau `Digital`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Daftar buku berhasil diambil",
    "data": [
      {
        "id": "bk-101",
        "judul": "Clean Code",
        "penulis": "Robert C. Martin",
        "penerbit": "Prentice Hall",
        "isbn": "978-0132350884",
        "genre": [
          "Technology",
          "Programming"
        ],
        "tipeBuku": "Fisik",
        "tahunTerbit": 2008,
        "jumlahStok": 3,
        "cover": "url-cover-cleancode.jpg"
      },
      {
        "id": "bk-102",
        "judul": "Bumi Manusia",
        "penulis": "Pramoedya Ananta Toer",
        "penerbit": "Hasta Mitra",
        "isbn": "978-9799731234",
        "genre": [
          "Historical",
          "Fiction"
        ],
        "tipeBuku": "Digital",
        "tahunTerbit": 1980,
        "jumlahStok": 0,
        "cover": "url-cover-bumimanusia.jpg",
        "file": "url-file-bumimanusia.pdf"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 120,
      "totalPages": 12,
      "hasNext": true,
      "hasPrev": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Query parameter tidak valid):
    ```json
    {
      "success": false,
      "message": "Validasi gagal"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `500 Internal Server Error`:
    ```json
    {
      "success": false,
      "message": "Internal server error"
    }
    ```

---

### 11.2 Melihat Detail Buku (Sisi Anggota)
- **Method**: `GET`
- **URL**: `/api/book/detail/:id`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id` (ULID buku)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMB23490...",
    "judul": "Clean Code",
    "penulis": "Robert C. Martin",
    "isbn": "9780132350884",
    "penerbit": "Prentice Hall",
    "genre": ["Software Engineering", "Programming"],
    "tipeBuku": "Digital",
    "tahunTerbit": 2008,
    "jumlahStok": 1,
    "cover": "https://storage.sitako.id/covers/uuid.jpg",
    "file": "https://storage.sitako.id/books/uuid.pdf",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Buku tidak ditemukan"
    }
    ```

---

### 11.2 Membaca Buku Digital (PDF Reader)
Mengambil URL file digital buku untuk keperluan viewer PDF di frontend.

- **Method**: `GET`
- **URL**: `/api/book/digital/read/:id`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id` (ULID buku digital)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMB23490...",
    "cover": "https://storage.sitako.id/covers/uuid.jpg",
    "file": "https://storage.sitako.id/books/uuid.pdf",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID buku tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Buku digital tidak ditemukan"
    }
    ```

---

### 11.3 Menambahkan Buku ke Bookmark
Menyimpan buku ke daftar simpanan/favorit anggota.

- **Method**: `POST`
- **URL**: `/api/book/bookmark/:id`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id` (ULID buku)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "bukuId": "01JMB23490...",
    "anggotaId": "01JMBMEM01..."
  }
  ```
  > **Catatan Teknis Frontend**: Walaupun controller otomatis menggunakan `id` dari path param dan ID user yang sedang login dari sesi cookie, middleware validasi backend memvalidasi keberadaan `bukuId` dan `anggotaId` pada JSON body. Pastikan kedua field ini disertakan agar tidak memicu error 400.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Bookmark berhasil ditambahkan",
    "id": "01JMBBM001...",
    "bukuId": "01JMB23490...",
    "anggotaId": "01JMBMEM01...",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Body field tidak lengkap):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "bukuId", "message": "Buku tidak boleh kosong" },
        { "field": "anggotaId", "message": "Anggota tidak boleh kosong" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 11.4 Menghapus Bookmark
- **Method**: `DELETE`
- **URL**: `/api/book/bookmark/delete/:bookmarkId`
- **Auth**: Wajib (Anggota)
- **Path Params**: `bookmarkId` (ULID bookmark)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data bookmark berhasil dihapus",
    "id": "01JMBBM001...",
    "bukuId": "01JMB23490...",
    "anggotaId": "01JMBMEM01...",
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID bookmark tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Bookmark tidak ditemukan"
    }
    ```

---

### 11.5 Mengambil Daftar Bookmark (Pagination)
Melihat daftar seluruh buku yang disimpan/dibookmark oleh anggota yang sedang login, didukung pagination dan pencarian.

- **Method**: `GET`
- **URL**: `/api/book/bookmark`
- **Auth**: Wajib (Anggota via cookie `token`)
- **Headers**: `Content-Type: application/json`
- **Query Params**:
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10, max: 100)
  - `search` (string, optional, pencarian judul atau penulis buku)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data bookmark berhasil diambil",
    "data": [
      {
        "id": "bm-123",
        "buku": {
          "id": "bk-456",
          "judul": "Atomic Habits",
          "penulis": "James Clear",
          "cover": "cover-atomic.jpg",
          "tipeBuku": "Fisik",
          "genre": [
            "Self-Improvement",
            "Productivity"
          ]
        },
        "createdAt": "2026-09-14T10:00:00.000Z"
      },
      {
        "id": "bm-124",
        "buku": {
          "id": "bk-457",
          "judul": "Filosofi Teras",
          "penulis": "Henry Manampiring",
          "cover": "cover-filosofi.jpg",
          "tipeBuku": "Digital",
          "genre": [
            "Philosophy"
          ]
        },
        "createdAt": "2026-09-13T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 35,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Query parameter tidak valid):
    ```json
    {
      "success": false,
      "message": "Validasi gagal"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `500 Internal Server Error`:
    ```json
    {
      "success": false,
      "message": "Internal server error"
    }
    ```

---

## 12. Transaksi - Anggota (`/api/member/transactions`)

### 12.1 Riwayat Transaksi Saya
Melihat seluruh riwayat peminjaman buku milik anggota yang sedang login.

- **Method**: `GET`
- **URL**: `/api/member/transactions/`
- **Auth**: Wajib (Anggota)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | string | **WAJIB** | - | Nilai: `"Semua"`, `"Menunggu Persetujuan"`, `"Dibatalkan"`, `"Menunggu Diambil"`, `"Dipinjam"`, `"Dikembalikan"`, `"Terlambat"`, `"Tidak Mengembalikan"` |
  | `page` | integer | Opsional | `1` | Halaman data |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Filter kode transaksi, nama pustakawan, atau judul buku |
- **Contoh Request**: `/api/member/transactions/?status=Dipinjam&page=1&limit=10`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBTRX01...",
        "kdTransaksi": "TRX-20260913-0001",
        "tglPinjam": "2026-09-13T08:00:00.000Z",
        "tglKembali": "2026-09-20T08:00:00.000Z",
        "status": "Dipinjam",
        "namaAnggota": "Budi Santoso",
        "namaPustakawan": "Ahmad Fauzi",
        "judulBuku": "Clean Code"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Filter `status` tidak valid):
    ```json
    {
      "success": false,
      "message": "Status transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 12.2 Detail Transaksi Saya
- **Method**: `GET`
- **URL**: `/api/member/transactions/detail/:id`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBTRX01...",
    "kdTransaksi": "TRX-20260913-0001",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Dipinjam",
    "namaAnggota": "Budi Santoso",
    "namaPustakawan": "Ahmad Fauzi",
    "judulBuku": "Clean Code",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01..."
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data transaksi tidak ditemukan"
    }
    ```

---

### 12.3 Mengajukan Peminjaman Buku Baru
- **Method**: `POST`
- **URL**: `/api/member/transactions/`
- **Auth**: Wajib (Anggota)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Menunggu Persetujuan"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaksi berhasil dibuat",
    "id": "01JMBTRX03...",
    "bukuId": "01JMB23490...",
    "pustakawanId": "01JMBLIB01...",
    "anggotaId": "01JMBMEM01...",
    "kdTransaksi": "TRX-20260913-0003",
    "tglPinjam": "2026-09-13T08:00:00.000Z",
    "tglKembali": "2026-09-20T08:00:00.000Z",
    "status": "Menunggu Persetujuan",
    "createdAt": "2026-09-13T08:00:00.000Z"
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Stok habis):
    ```json
    {
      "success": false,
      "message": "Stok buku habis"
    }
    ```
  - `400 Bad Request` (Batas pinjam maksimal):
    ```json
    {
      "success": false,
      "message": "Maksimum pinjam tercapai (maksimal 3 transaksi aktif)"
    }
    ```
  - `400 Bad Request` (Ada buku terlambat):
    ```json
    {
      "success": false,
      "message": "Member memiliki buku yang terlambat dikembalikan (fisik belum dikonfirmasi)"
    }
    ```
  - `400 Bad Request` (Ada denda belum lunas):
    ```json
    {
      "success": false,
      "message": "Member memiliki denda buku hilang yang belum dibayar lunas"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 12.4 Mengajukan Pengembalian Buku
Diajukan oleh anggota untuk mengembalikan buku yang dipinjam atau melaporkan buku hilang.

- **Method**: `POST`
- **URL**: `/api/member/transactions/:id/return`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id` (ULID transaksi yang berstatus `"Dipinjam"` atau `"Terlambat"`)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "isBukuHilang": false
  }
  ```

#### Skenario 1: Pengembalian Tepat Waktu (Tidak Terlambat)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pengembalian berhasil diajukan. Menunggu konfirmasi fisik dari pustakawan.",
    "status": "Dikembalikan",
    "isTerlambat": false,
    "isBukuHilang": false,
    "denda": null,
    "pesan": "Pengembalian berhasil diajukan. Menunggu konfirmasi fisik dari pustakawan."
  }
  ```

#### Skenario 2: Pengembalian Terlambat (Muncul Denda)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pengembalian berhasil diajukan. Terdapat denda keterlambatan yang menunggu konfirmasi pembayaran dari pustakawan.",
    "status": "Terlambat",
    "isTerlambat": true,
    "isBukuHilang": false,
    "denda": {
      "jenisDenda": "Terlambat",
      "hargaDenda": 1000,
      "metodePerhitungan": "Akumulasi",
      "hariTerlambat": 3,
      "totalDenda": 3000
    },
    "pesan": "Pengembalian berhasil diajukan. Terdapat denda keterlambatan yang menunggu konfirmasi pembayaran dari pustakawan."
  }
  ```

#### Skenario 3: Pelaporan Buku Hilang (`isBukuHilang: true`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Buku dilaporkan hilang. Menunggu konfirmasi dan pembayaran denda dari pustakawan.",
    "status": "Tidak Mengembalikan",
    "isTerlambat": true,
    "isBukuHilang": true,
    "denda": {
      "jenisDenda": "Hilang",
      "hargaDenda": 50000,
      "metodePerhitungan": "Flat",
      "hariTerlambat": 1,
      "totalDenda": 50000
    },
    "pesan": "Buku dilaporkan hilang. Menunggu konfirmasi dan pembayaran denda dari pustakawan."
  }
  ```

- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID transaksi tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data transaksi tidak ditemukan"
    }
    ```
  - `422 Unprocessable Entity` (Status saat ini tidak dapat dikembalikan):
    ```json
    {
      "success": false,
      "message": "Transaksi dengan status \"Dikembalikan\" tidak dapat dikembalikan"
    }
    ```

---

## 13. Pembayaran Denda Online - Anggota (`/api/member/fine-payments`)

### 13.1 Riwayat Pembayaran Denda Saya
- **Method**: `GET`
- **URL**: `/api/member/fine-payments/`
- **Auth**: Wajib (Anggota)
- **Query Params**:
  | Parameter | Tipe Data | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Opsional | `1` | Nomor halaman |
  | `limit` | integer | Opsional | `10` | Jumlah data per halaman |
  | `search` | string | Opsional | `""` | Filter metode bayar, kode transaksi, judul buku, atau pustakawan |
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "id": "01JMBPAY01...",
        "hargaDenda": 1000,
        "totalDenda": 3000,
        "tglBayar": "2026-09-13T09:30:00.000Z",
        "metodePembayaran": "Non-Tunai",
        "createdAt": "2026-09-13T09:00:00.000Z",
        "namaPustakawan": "Ahmad Fauzi",
        "kdTransaksi": "TRX-20260913-0001",
        "judulBuku": "Clean Code"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalRows": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```
- **Response Error**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 13.2 Detail Pembayaran Denda Saya
- **Method**: `GET`
- **URL**: `/api/member/fine-payments/detail/:id`
- **Auth**: Wajib (Anggota)
- **Path Params**: `id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "id": "01JMBPAY01...",
    "hargaDenda": 1000,
    "totalDenda": 3000,
    "tglBayar": "2026-09-13T09:30:00.000Z",
    "metodePembayaran": "Non-Tunai",
    "createdAt": "2026-09-13T09:00:00.000Z",
    "namaPustakawan": "Ahmad Fauzi",
    "kdTransaksi": "TRX-20260913-0001",
    "judulBuku": "Clean Code",
    "tglPinjam": "2026-09-01T08:00:00.000Z",
    "tglKembali": "2026-09-08T08:00:00.000Z",
    "statusTransaksi": "Terlambat"
  }
  ```
- **Response Error**:
  - `400 Bad Request`:
    ```json
    {
      "success": false,
      "message": "ID pembayaran denda tidak valid"
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Data pembayaran denda tidak ditemukan"
    }
    ```

---

### 13.3 Menginisiasi Pembayaran Denda Online (Tripay Payment Gateway)
Mengirimkan request pembuatan tagihan pembayaran online melalui Tripay.

- **Method**: `POST`
- **URL**: `/api/member/fine-payments/pay`
- **Auth**: Wajib (Anggota)
- **Request Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "transaksiId": "01JMBTRX01...",
    "paymentMethodCode": "BRIVA"
  }
  ```
  *(Catatan: `paymentMethodCode` berupa kode channel pembayaran Tripay seperti `BRIVA`, `BNIVA`, `BCAVA`, `QRIS`, `OVO`, dll).*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pembayaran berhasil diinisiasi",
    "id": "01JMBPAY03...",
    "anggotaId": "01JMBMEM01...",
    "transaksiId": "01JMBTRX01...",
    "hargaDenda": 1000,
    "totalDenda": 3000,
    "metodePembayaran": "Non-Tunai",
    "paymentStatus": "UNPAID",
    "tripayReference": "DEV-T1234567890",
    "paymentMethodCode": "BRIVA",
    "checkoutUrl": "https://tripay.co.id/checkout/DEV-T1234567890",
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
  ```
  *(Frontend dapat me-redirect pengguna ke `checkoutUrl` atau merender kode instruksi pembayaran).*
- **Response Error**:
  - `400 Bad Request` (Validasi input gagal):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        { "field": "transaksiId", "message": "Transaksi tidak boleh kosong" },
        { "field": "paymentMethodCode", "message": "Metode pembayaran tidak boleh kosong" }
      ]
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `500 Internal Server Error` (Transaksi tidak memiliki tanggungan denda):
    ```json
    {
      "success": false,
      "message": "Internal server error"
    }
    ```

---

## 14. Dashboard - Anggota (`/api/member/dashboard`)

Mengambil ringkasan statistik buku yang sedang dipinjam, total tagihan denda belum dibayar, total bookmark, daftar transaksi aktif, tagihan denda yang belum dibayar, serta bookmark buku terbaru milik anggota yang sedang login.

- **Method**: `GET`
- **URL**: `/api/member/dashboard`
- **Auth**: Wajib (Anggota / Member via cookie `token`)
- **Headers**: `Content-Type: application/json`
- **Request Body**: *(Tidak ada / kosong)*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data dashboard member berhasil diambil",
    "statistik": {
      "bukuDipinjam": 2,
      "totalDenda": 15000,
      "totalBookmark": 8
    },
    "transaksiAktif": [
      {
        "id": "trx-123",
        "buku": {
          "judul": "Atomic Habits",
          "cover": "url-cover-1.jpg"
        },
        "tglKembali": "2026-09-20T00:00:00.000Z",
        "status": "Dipinjam"
      }
    ],
    "tagihanDenda": [
      {
        "id": "pay-123",
        "totalDenda": 15000,
        "checkoutUrl": "https://tripay.co.id/checkout/..."
      }
    ],
    "bookmarkTerbaru": [
      {
        "id": "bm-123",
        "buku": {
          "judul": "Filosofi Teras",
          "penulis": "Henry Manampiring",
          "cover": "url-cover-2.jpg"
        }
      }
    ]
  }
  ```
- **Response Error**:
  - `401 Unauthorized` (Belum login / token tidak valid):
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```
  - `500 Internal Server Error`:
    ```json
    {
      "success": false,
      "message": "Internal server error"
    }
    ```

---

## 15. Webhook Payment Gateway Tripay (`/api/webhooks/tripay`)

Endpoint penerima callback otomatis dari server Tripay ketika transaksi denda online telah dibayar oleh anggota.

- **Method**: `POST`
- **URL**: `/api/webhooks/tripay`
- **Auth**: Verifikasi signature HMAC SHA-256
- **Request Headers**:
  - `Content-Type`: `application/json`
  - `x-callback-signature`: `<computed_hmac_sha256_hash>`
- **Request Body (JSON Callback Tripay)**:
  ```json
  {
    "event": "payment_status",
    "reference": "DEV-T1234567890",
    "merchant_ref": "TRX-20260913-0001",
    "payment_method": "BRIVA",
    "status": "PAID",
    "paid_at": 1726200000
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```
- **Response Error**:
  - `400 Bad Request` (Signature tidak cocok / kosong):
    ```json
    {
      "success": false,
      "message": "Invalid signature"
    }
    ```
  - `400 Bad Request` (Field reference kosong):
    ```json
    {
      "success": false,
      "message": "Reference is required"
    }
    ```
  - `404 Not Found` (Referensi pembayaran tidak terdaftar):
    ```json
    {
      "success": false,
      "message": "Payment not found"
    }
    ```

---

## 16. Laporan Sirkulasi & Denda - Pustakawan (`/api/reports`)

Endpoint laporan sirkulasi transaksi peminjaman buku dan laporan pembayaran denda, mendukung preview JSON untuk tabel Frontend serta ekspor file Excel (`.xlsx`), CSV (`.csv`), dan PDF (`.pdf`).

### 16.1 Laporan Sirkulasi Peminjaman
- **Method**: `GET`
- **URL**: `/api/reports/circulation`
- **Auth**: Wajib (Pustakawan)
- **Query Parameters**:
  | Parameter | Tipe | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `startDate` | string | Opsional | - | Tanggal awal filter `tglPinjam` (format `YYYY-MM-DD`, inklusif) |
  | `endDate` | string | Opsional | - | Tanggal akhir filter `tglPinjam` (format `YYYY-MM-DD`, inklusif) |
  | `format` | string | Opsional | `json` | Pilihan: `json`, `csv`, `xlsx`, `pdf` |
- **Response Berhasil (200 OK - format=json)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "kdTransaksi": "TRX-20260901-0001",
        "namaPeminjam": "Ahmad Siswa",
        "judulBuku": "Laskar Pelangi",
        "tglPinjam": "2026-09-01T08:00:00.000Z",
        "tglKembali": "2026-09-08T10:00:00.000Z",
        "status": "Dikembalikan"
      }
    ]
  }
  ```
- **Response Berhasil (200 OK - format=csv / xlsx / pdf)**:
  - `format=csv`:
    - Header `Content-Type`: `text/csv; charset=utf-8`
    - Header `Content-Disposition`: `attachment; filename="laporan-sirkulasi-YYYY-MM-DD.csv"`
    - Kolom: `["Kode Transaksi", "Nama Peminjam", "Judul Buku", "Tgl Pinjam", "Tgl Kembali", "Status"]`
  - `format=xlsx`:
    - Header `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    - Header `Content-Disposition`: `attachment; filename="laporan-sirkulasi-YYYY-MM-DD.xlsx"`
    - Sheet Name: `Laporan Sirkulasi`
  - `format=pdf`:
    - Header `Content-Type`: `application/pdf`
    - Header `Content-Disposition`: `attachment; filename="laporan-sirkulasi-denda-YYYY-MM-DD.pdf"`
    - Dokumen PDF A4 hasil compile Typst dengan tabel sirkulasi dan tabel denda untuk periode terkait.
- **Response Error**:
  - `400 Bad Request` (Format tanggal tidak valid atau `startDate > endDate`):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        {
          "field": "startDate",
          "message": "startDate tidak boleh lebih besar dari endDate"
        }
      ]
    }
    ```
  - `401 Unauthorized` (Belum login):
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

### 16.2 Laporan Pembayaran Denda
- **Method**: `GET`
- **URL**: `/api/reports/fines`
- **Auth**: Wajib (Pustakawan)
- **Query Parameters**:
  | Parameter | Tipe | Wajib? | Default | Keterangan |
  | :--- | :--- | :--- | :--- | :--- |
  | `startDate` | string | Opsional | - | Tanggal awal filter `tglBayar` (format `YYYY-MM-DD`, inklusif) |
  | `endDate` | string | Opsional | - | Tanggal akhir filter `tglBayar` (format `YYYY-MM-DD`, inklusif) |
  | `format` | string | Opsional | `json` | Pilihan: `json`, `csv`, `xlsx`, `pdf` |
- **Response Berhasil (200 OK - format=json)**:
  ```json
  {
    "success": true,
    "message": "Data retrieved successfully",
    "data": [
      {
        "namaPeminjam": "Ahmad Siswa",
        "judulBuku": "Laskar Pelangi",
        "totalDenda": 5000,
        "metodePembayaran": "Tunai",
        "paymentStatus": "PAID",
        "tglBayar": "2026-09-08T10:15:00.000Z"
      }
    ]
  }
  ```
- **Response Berhasil (200 OK - format=csv / xlsx / pdf)**:
  - `format=csv`:
    - Header `Content-Type`: `text/csv; charset=utf-8`
    - Header `Content-Disposition`: `attachment; filename="laporan-denda-YYYY-MM-DD.csv"`
    - Kolom: `["Nama Peminjam", "Judul Buku", "Total Denda", "Metode Pembayaran", "Status Pembayaran", "Tgl Bayar"]`
  - `format=xlsx`:
    - Header `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    - Header `Content-Disposition`: `attachment; filename="laporan-denda-YYYY-MM-DD.xlsx"`
    - Sheet Name: `Laporan Denda`
  - `format=pdf`:
    - Header `Content-Type`: `application/pdf`
    - Header `Content-Disposition`: `attachment; filename="laporan-sirkulasi-denda-YYYY-MM-DD.pdf"`
    - Dokumen PDF A4 hasil compile Typst dengan tabel sirkulasi dan tabel denda untuk periode terkait.
- **Response Error**:
  - `400 Bad Request` (Format tanggal tidak valid atau `startDate > endDate`):
    ```json
    {
      "success": false,
      "message": "Validasi gagal",
      "errors": [
        {
          "field": "startDate",
          "message": "startDate tidak boleh lebih besar dari endDate"
        }
      ]
    }
    ```
  - `401 Unauthorized` (Belum login):
    ```json
    {
      "success": false,
      "message": "Akses ditolak. Belum login."
    }
    ```

---

## 17. Daftar Enum Database

Gunakan nilai-nilai enum berikut ini pada form select / dropdown dan filter tabel di Frontend:

### 1. Tipe Buku (`tipe_buku_enum`)
- `"Fisik"`
- `"Digital"`

### 2. Jenis Denda (`tipe_denda_enum`)
- `"Terlambat"`
- `"Hilang"`

### 3. Metode Perhitungan Denda (`tipe_kalkulasi_enum`)
- `"Akumulasi"` (dikalikan dengan jumlah hari keterlambatan)
- `"Flat"` (nominal tetap satu kali)

### 4. Status Transaksi Peminjaman (`status_transaksi_enum`)
- `"Menunggu Persetujuan"`
- `"Dibatalkan"`
- `"Menunggu Diambil"`
- `"Dipinjam"`
- `"Dikembalikan"`
- `"Terlambat"`
- `"Tidak Mengembalikan"`

### 5. Metode Pembayaran Denda (`metode_pembayaran_enum`)
- `"Tunai"`
- `"Non-Tunai"`

### 6. Status Pembayaran Denda (`status_pembayaran_enum`)
- `"UNPAID"`
- `"PAID"`
- `"EXPIRED"`
- `"FAILED"`

---

## 18. Tips & Panduan Integrasi Frontend

1. **Pengaturan Axios Client**:
   ```typescript
   import axios from 'axios';

   export const api = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
     withCredentials: true, // Wajib diaktifkan agar cookie token JWT otomatis terkirim
   });
   ```

2. **Pengambilan CAPTCHA**:
   - Panggil `GET /api/auth/captcha` dengan `responseType: 'text'` atau `blob`.
   - Browser secara otomatis menerima set-cookie `captcha_token`.
   - Render SVG ke dalam kontainer UI atau `<img src="data:image/svg+xml;utf8,...">`.

3. **Penanganan Form Multipart**:
   - Untuk upload buku (`/api/books`) dan foto pengguna (`/api/user/librarians`, `/api/user/members`), gunakan objek `FormData`:
   ```typescript
   const formData = new FormData();
   formData.append('judul', data.judul);
   formData.append('cover', coverFile); // File instance
   // Kirim dengan Content-Type multipart/form-data
   ```

4. **Query Parameter Pagination & Filter Wajib**:
   - Seluruh tabel dapat menggunakan parameter standar `page`, `limit`, dan `search`.
   - Perhatikan endpoint yang memiliki parameter filter **WAJIB**:
     - `/api/books/` &rarr; wajib menyertakan `bookType` (`"Fisik"` atau `"Digital"`)
     - `/api/user/librarians/` &rarr; wajib menyertakan `statusActive` (`"Semua"`, `"true"`, atau `"false"`)
     - `/api/user/members/` &rarr; wajib menyertakan `statusActive` (`"Semua"`, `"true"`, atau `"false"`)
     - `/api/transactions/` &rarr; wajib menyertakan `status` (contoh: `"Semua"` atau `"Dipinjam"`)
     - `/api/member/transactions/` &rarr; wajib menyertakan `status` (contoh: `"Semua"` atau `"Dipinjam"`)
