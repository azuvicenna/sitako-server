# SITAKO Backend

## Deskripsi Proyek

SITAKO (Sistem Informasi Perpustakaan Sekolah) Backend adalah service API utama yang menangani logika bisnis, pengelolaan database, dan otentikasi untuk aplikasi perpustakaan sekolah. Proyek ini dirancang agar scalable dan mudah di-deploy menggunakan sistem container.

## Teknologi Utama

Berikut adalah beberapa teknologi utama yang digunakan beserta fungsinya:

- **Node.js & TypeScript**: Lingkungan eksekusi dan bahasa pemrograman utama yang memastikan kode lebih rapi dan bebas dari error pengetikan tipe data.
- **Express.js**: Framework web ringan untuk mengatur routing API.
- **Drizzle ORM & PostgreSQL**: PostgreSQL sebagai database utama, sedangkan Drizzle ORM digunakan untuk memudahkan manajemen skema dan query ke database.
- **Redis**: In-memory data store yang dipakai untuk caching agar respons aplikasi lebih cepat.
- **Cloudflare R2**: Layanan object storage yang kompatibel dengan S3 API, digunakan untuk menyimpan file seperti gambar, dokumen, atau aset lainnya.
- **Tripay**: Payment gateway terintegrasi untuk menangani transaksi pembayaran denda perpustakaan.
- **Node-Cron & PostgreSQL Distributed Lock**: Penjadwal tugas otomatis harian untuk pengingat pengembalian buku dan pembaruan status keterlambatan yang aman untuk multi-container/cluster.
- **Nodemailer**: Layanan pengiriman email notifikasi otomatis (pengingat jatuh tempo, status transaksi, tagihan denda, dan kuitansi pembayaran).
- **Jest & Supertest**: Framework testing untuk pengujian otomatis (Unit, Integration, dan Feature tests).
- **k6**: Framework modern untuk load testing dan performance profiling API.
- **Prometheus & Exporters**: Monitoring stack untuk mengumpulkan dan memvisualisasikan metrics performa aplikasi, PostgreSQL, dan Redis.
- **Docker & Docker Compose**: Mengemas aplikasi beserta ekosistem pendukungnya (PostgreSQL, Redis, Exporters, dan Prometheus) ke dalam container.
- **Jenkins**: Tools CI/CD untuk mengotomatisasi pipeline mulai dari build, test, hingga proses deploy langsung ke Virtual Machine (menggunakan Multipass).

## Daftar Library Dependencies

Berikut adalah rincian fungsi dari masing-masing dependencies utama yang terdaftar di `package.json`:

- **`@aws-sdk/client-s3`**: Library official AWS SDK untuk berinteraksi dengan S3-compatible storage (digunakan untuk Cloudflare R2).
- **`bcrypt`**: Digunakan untuk melakukan _hashing_ password pengguna agar aman di database.
- **`cookie-parser`**: Middleware Express untuk memparsing cookie dari header HTTP.
- **`cors`**: Middleware keamanan untuk mengatur kebijakan Cross-Origin Resource Sharing agar frontend bisa mengakses API.
- **`helmet`**: Middleware keamanan untuk menyembunyikan dan mengamankan HTTP headers dasar (menangkal serangan XSS, sniffing, dsb).
- **`drizzle-orm`**: TypeScript ORM yang ringan dan cepat untuk berinteraksi dengan database PostgreSQL.
- **`express`**: Framework web minimalis untuk membangun RESTful API di Node.js.
- **`jsonwebtoken`**: Untuk membuat dan memverifikasi JSON Web Token (JWT) untuk sistem otentikasi.
- **`node-cron`**: Task scheduler berbasis Node.js untuk menjalankan tugas terjadwal di latar belakang (seperti auto-update status transaksi keterlambatan dan pengiriman email pengingat pengembalian buku harian).
- **`nodemailer`**: Library untuk mengirim email notifikasi otomatis (peringatan jatuh tempo peminjaman, perubahan status transaksi, tagihan denda, dan bukti pembayaran lunas) via SMTP.
- **`pg`**: Node.js client murni untuk PostgreSQL (koneksi database utama).
- **`prom-client`**: Mengumpulkan dan menghitung metrics, lalu menyajikannya dalam format yang bisa dibaca Prometheus.
- **`redis`**: Client Redis resmi untuk Node.js guna mengelola cache dan session.
- **`svg-captcha`**: Untuk menghasilkan gambar captcha berbasis SVG (biasanya untuk keamanan form login/register).
- **`typst`**: Package wrapper untuk menjalankan engine compiler Typst dari dalam Node.js.
- **`ulid`**: Generator unique identifier berbasis waktu yang berurutan secara leksikografis (alternatif UUID).
- **`uuid`**: Generator unique identifier untuk penamaan file upload.
- **`winston`**: Library logging yang fleksibel dan powerful untuk mencatat aktivitas atau error aplikasi.
- **`xlsx`**: Library untuk membaca, menulis, dan memanipulasi file spreadsheet Excel (.xlsx/.xls).
- **`zod`**: Library validasi skema berbasis TypeScript yang ketat untuk data input/request.

## Perintah Terminal & Cara Menjalankan

### Persiapan Awal

Langkah pertama sebelum menjalankan aplikasi secara lokal:

1. Salin template file environment:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan nilai di dalam `.env` dengan kredensial database, Redis, Tripay, mailer, dan S3 (termasuk `PUBLIC_STORAGE_URL` untuk akses gambar publik dari Cloudflare R2).
3. Install semua dependencies:
   ```bash
   npm install
   ```

### Mode Development

Gunakan perintah berikut untuk pengembangan lokal:

- Menjalankan server lokal (dengan watch/hot-reload via `tsx`):
  ```bash
  npm run dev
  ```
- Menjalankan container database (PostgreSQL) & Redis saja di background:
  ```bash
  docker compose up -d database redis
  ```

Perintah khusus untuk database (Drizzle ORM):

- `npm run db:generate` : Membuat file migrasi dari skema terbaru.
- `npm run db:migrate` : Mengeksekusi migrasi ke database.
- `npm run db:push` : Mendorong perubahan skema langsung ke database (cocok untuk dev).
- `npm run db:studio` : Membuka antarmuka web GUI Drizzle Studio untuk melihat dan mengelola isi database.

### Type Checking & Build Production

Gunakan perintah berikut untuk validasi tipe data dan proses build:

- Memeriksa error tipe data TypeScript tanpa melakukan kompilasi file:
  ```bash
  npm run typecheck
  ```
- Melakukan kompilasi kode TypeScript ke JavaScript (`dist/`) beserta resolving path alias:
  ```bash
  npm run build
  ```
- Menjalankan server hasil build production:
  ```bash
  npm start
  ```

### Automated Testing (Jest)

Pengujian otomatis dilakukan menggunakan Jest dan Supertest. Variabel lingkungan pengujian dimuat otomatis dari `.env.test`.

- Menjalankan seluruh rangkaian test suite:
  ```bash
  npm test
  ```
- Menjalankan unit tests (`tests/unit`):
  ```bash
  npm run test:unit
  ```
- Menjalankan integration tests (`tests/integration`):
  ```bash
  npm run test:integration
  ```
- Menjalankan feature / API controller tests (`tests/feature`):
  ```bash
  npm run test:feature
  ```

### Load Testing (k6)

Tersedia 9 skenario pengujian beban (*load & performance testing*) menggunakan k6:

- `npm run k6:smoke` : Smoke test cepat untuk verifikasi kesehatan dasar endpoint API.
- `npm run k6:login` : Stress test alur login dan verifikasi captcha/autentikasi pengguna.
- `npm run k6:load` : Pengujian beban kerja standar dalam batas kapasitas operasional normal.
- `npm run k6:mixed` : Pengujian simulasi trafik campuran (pencarian, navigasi, dan membaca buku).
- `npm run k6:stress` : Stress test melampaui batas kapasitas normal untuk menguji stabilitas sistem.
- `npm run k6:spike` : Pengujian lonjakan beban ekstrem secara tiba-tiba dalam kurun waktu singkat.
- `npm run k6:soak` : Pengujian durasi panjang untuk mendeteksi memory leak dan degradasi performa bertahap.
- `npm run k6:breakpoint` : Pengujian bertingkat hingga menemukan titik batas maksimal sistem sebelum mengalami kegagalan.
- `npm run k6:write` : Pengujian beban terhadap operasi penulisan data dan siklus hidup transaksi peminjaman.

### Menggunakan Docker & Monitoring Stack

Jika ingin menjalankan aplikasi beserta seluruh ekosistem pendukungnya (PostgreSQL, Redis, Exporters, dan Prometheus):

- Build dan jalankan seluruh container di background:
  ```bash
  docker compose up -d
  ```
- Melihat log dari container aplikasi:
  ```bash
  docker logs -f sitako-app
  ```
- Menghentikan dan menghapus semua container yang sedang berjalan:
  ```bash
  docker compose down
  ```

Akses layanan pendukung:

- **Prometheus UI**: `http://localhost:9091`
- **Application Metrics**: `http://localhost:8080/metrics`
- **Health Check Endpoint**: `http://localhost:8080/`

### CI/CD dengan Jenkins

Aplikasi ini sudah dipasang otomatisasi melalui `Jenkinsfile`. Pipeline akan menjalankan tahapan berikut secara berurutan:

1. **Install Dependencies & Lint/Test** (`npm ci`, `npm run lint`, `npm test`)
2. **Build TypeScript** (`npm run build`)
3. **Docker Build** (Membungkus hasil build ke dalam image Docker)
4. **Ship Image** (Menyimpan image ke dalam file `.tar` dan mengirimnya ke VM `sitako-vm` via Multipass)
5. **Deploy** (Menjalankan `docker compose up -d` langsung di dalam VM)
