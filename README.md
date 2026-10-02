# SITAKO Server

## Deskripsi Proyek

SITAKO (Sistem Informasi Perpustakaan Sekolah) Server adalah service API utama yang menangani logika bisnis, pengelolaan database, dan otentikasi untuk aplikasi perpustakaan sekolah. Proyek ini dirancang agar scalable dan mudah di-deploy menggunakan sistem container.

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
- **OpenTelemetry**: Standar observabilitas (APM) open-source untuk distributed tracing dan metrics telemetry yang menginstrumentasi request HTTP, database queries (PostgreSQL), cache (Redis), dan Winston logging secara otomatis.
- **Docker & Docker Compose**: Mengemas aplikasi beserta ekosistem pendukungnya (PostgreSQL, Redis, Exporters, dan Prometheus) ke dalam container.
- **Jenkins**: Tools CI/CD untuk mengotomatisasi pipeline mulai dari build, test, hingga proses deploy langsung ke Virtual Machine (VirtualBox / Multipass).

## Daftar Library Dependencies

Berikut adalah rincian fungsi dari masing-masing dependencies utama yang terdaftar di `package.json`:

- **`@aws-sdk/client-s3`**: Library official AWS SDK untuk berinteraksi dengan S3-compatible storage (digunakan untuk Cloudflare R2).
- **`@opentelemetry/api`**: API inti OpenTelemetry untuk distributed tracing, metrics, context propagation, dan pembuatan custom spans.
- **`@opentelemetry/auto-instrumentations-node`**: Bundle instrumentasi otomatis untuk framework & library Node.js populer (Express, HTTP, PostgreSQL, Redis, Winston, AWS SDK).
- **`@opentelemetry/exporter-metrics-otlp-http`**: Exporter OpenTelemetry untuk mengirim data metrics ke OTLP receiver (Collector) via HTTP.
- **`@opentelemetry/exporter-trace-otlp-http`**: Exporter OpenTelemetry untuk mengekspor distributed traces ke APM backend (Jaeger, Tempo, SigNoz) via OTLP HTTP.
- **`@opentelemetry/resources`**: Pengelola metadata dan atribut entitas service (seperti nama service, versi, environment) untuk data telemetri.
- **`@opentelemetry/sdk-metrics`**: Implementasi OpenTelemetry Metrics SDK dan metric readers (`PeriodicExportingMetricReader`).
- **`@opentelemetry/sdk-node`**: SDK utama OpenTelemetry untuk Node.js yang mengorkestrasi siklus hidup tracing, metrics, dan instrumentations.
- **`@opentelemetry/sdk-trace-node`**: Implementasi OpenTelemetry Tracing SDK untuk runtime Node.js (termasuk `ConsoleSpanExporter` untuk debugging lokal).
- **`@opentelemetry/semantic-conventions`**: Definisi standar penamaan atribut telemetri (Semantic Conventions) seperti nama layanan, HTTP request, dan status code.
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

Perintah khusus untuk database (Drizzle ORM & Seeder):

- `npm run db:generate` : Membuat file migrasi SQL baru dari skema terbaru ke folder `drizzle/`.
- `npm run db:migrate` : Mengeksekusi migrasi skema ke database (mode dev via tsx).
- `npm run db:migrate:prod` : Mengeksekusi migrasi skema ke database (mode prod via Node.js murni).
- `npm run db:seed` : Mengisi akun pustakawan awal jika database masih kosong (mode dev via tsx).
- `npm run db:seed:prod` : Mengisi akun pustakawan awal jika database masih kosong (mode prod via Node.js murni).
- `npm run db:push` : Mendorong perubahan skema langsung ke database tanpa file migrasi (khusus dev lokal).
- `npm run db:studio` : Membuka antarmuka web GUI Drizzle Studio untuk melihat dan mengelola isi database.

> **Kredensial Akun Pustakawan Default (hasil seeder):**
>
> - **NIP:** `198001012005011001`
> - **Password:** `admin123`

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

Tersedia 9 skenario pengujian beban (_load & performance testing_) menggunakan k6:

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

Tersedia 2 mode deployment Docker:

#### 1. Mode Standalone (Single Instance)

Cocok untuk pengembangan atau server dengan beban standar:

- Menjalankan seluruh container di background:
  ```bash
  docker compose up -d
  ```
- Menjalankan migrasi database di dalam kontainer:
  ```bash
  docker compose exec app npm run db:migrate:prod
  ```
- Mengisi akun pustakawan awal:
  ```bash
  docker compose exec app npm run db:seed:prod
  ```
- Melihat log dari container aplikasi:
  ```bash
  docker logs -f sitako-app
  ```
- Menghentikan container:
  ```bash
  docker compose down
  ```

#### 2. Mode Production dengan Nginx Load Balancer (Multi-Replica)

Menggunakan reverse proxy Nginx di port 80 dan mendukung horizontal scaling kontainer `app`:

- Menjalankan dengan 2 replika backend `app`:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --scale app=2
  ```
- Menjalankan migrasi database di dalam kontainer:
  ```bash
  docker compose -f docker-compose.prod.yml exec app npm run db:migrate:prod
  ```
- Mengisi akun pustakawan awal:
  ```bash
  docker compose -f docker-compose.prod.yml exec app npm run db:seed:prod
  ```
- Melihat log load balancer / app:
  ```bash
  docker logs -f sitako-loadbalancer
  ```
- Menghentikan container production:
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```

Akses layanan pendukung:

- **Prometheus UI**: `http://localhost:9091`
- **Application Metrics**: `http://localhost:8080/metrics`
- **Health Check Endpoint**: `http://localhost:8080/`

### Deployment ke Kubernetes

Folder `k8s/` menyediakan manifest lengkap untuk deployment ke cluster Kubernetes, baik untuk pengujian lokal di laptop menggunakan **Minikube** maupun di server/VM menggunakan **K3s**.

#### 1. Menjalankan di Minikube (Lokal di Laptop)

Mode ini direkomendasikan untuk pengembangan dan pengujian Kubernetes secara langsung di laptop (Windows/macOS/Linux) menggunakan driver Docker:

1. **Nyalakan Minikube Cluster & Aktifkan Ingress:**

   ```bash
   minikube start --driver=docker
   minikube addons enable ingress
   ```

2. **Build Image Backend & Load ke Minikube:**

   ```bash
   docker build -t sitako-server:latest .
   minikube image load sitako-server:latest
   ```

   _(Tips: Anda juga bisa me-load image base PostgreSQL jika koneksi lambat: `minikube image load postgres:18-alpine`)_

3. **Deploy Seluruh Manifest (Namespace, Config, Postgres, Redis, App, Monitoring, HPA):**

   ```bash
   kubectl apply -f k8s/00-namespace-and-config.yaml
   kubectl apply -f k8s/01-postgres.yaml
   kubectl apply -f k8s/02-redis.yaml
   kubectl apply -f k8s/03-app.yaml
   kubectl apply -f k8s/04-monitoring.yaml
   kubectl apply -f k8s/05-hpa.yaml
   ```

4. **Eksekusi Migrasi Database & Seeder Akun Awal di Pod:**

   ```bash
   kubectl exec -it -n sitako deploy/sitako-app -c backend -- npm run db:migrate:prod
   kubectl exec -it -n sitako deploy/sitako-app -c backend -- npm run db:seed:prod
   ```

5. **Mengecek Status Seluruh Resource:**

   ```bash
   kubectl get pods,pvc,svc,ingress -n sitako
   ```

6. **Mengakses Aplikasi di Laptop:**
   - **Metode Praktis (Port Forward Service):**
     ```bash
     minikube service app -n sitako
     ```
     _(Perintah ini akan membuat tunnel dan otomatis membuka browser ke URL aplikasi)_.
   - **Metode Ingress (Port 80):**
     ```bash
     minikube tunnel
     ```
     _(Setelah tunnel aktif di satu terminal, akses langsung via `http://localhost/` di browser)_.

7. **Mengakses Dashboard Monitoring Prometheus:**
   - **Metode Praktis (Otomatis Buka Browser):**
     ```bash
     minikube service prometheus -n sitako
     ```
   - **Metode Port Tetap (`9091`):**
     ```bash
     kubectl port-forward svc/prometheus 9091:9091 -n sitako
     ```
     _(Buka di browser: `http://localhost:9091/`)_

8. **Perintah Perawatan / Utility Minikube:**
   - Membuka antarmuka grafis Web Dashboard:
     ```bash
     minikube dashboard
     ```
   - Menghentikan cluster saat laptop selesai digunakan:
     ```bash
     minikube stop
     ```
   - Menyalakan kembali cluster yang di-stop (data PVC tetap aman):
     ```bash
     minikube start
     ```
   - Menghapus cluster jika ingin reset dari awal:
     ```bash
     minikube delete
     ```

#### 2. Menjalankan di K3s (Server Linux / VM Multipass)

Untuk deployment di lingkungan K3s (misalnya di Virtual Machine Multipass):

1. **Import Docker Image ke Runtime Containerd K3s:**
   ```bash
   sudo k3s ctr -n k8s.io images import sitako-server.tar
   ```
2. **Deploy Manifests (Namespace, Postgres, Redis, App, Monitoring, HPA):**
   ```bash
   kubectl apply -f k8s/00-namespace-and-config.yaml
   kubectl apply -f k8s/01-postgres.yaml
   kubectl apply -f k8s/02-redis.yaml
   kubectl apply -f k8s/03-app.yaml
   kubectl apply -f k8s/04-monitoring.yaml
   kubectl apply -f k8s/05-hpa.yaml
   ```
3. **Eksekusi Migrasi Skema & Seeder Akun Awal di Pod:**
   ```bash
   kubectl exec -it -n sitako deploy/sitako-app -c backend -- npm run db:migrate:prod
   kubectl exec -it -n sitako deploy/sitako-app -c backend -- npm run db:seed:prod
   ```
4. **Melihat Status Pod, Ingress Traefik & HPA:**
   ```bash
   kubectl get pods,svc,ingress -n sitako
   kubectl get hpa -n sitako
   ```

### CI/CD dengan Jenkins

Aplikasi ini sudah dipasang otomatisasi melalui `Jenkinsfile` dengan dukungan parameter pipeline dinamis (`Build with Parameters`). Anda dapat memilih target deployment sesuai kebutuhan:

#### Parameter Pipeline:

- **`DEPLOY_MODE`** (Pilihan target deployment):
  - `docker-standalone`: Menjalankan kontainer tunggal menggunakan `docker-compose.yml` (port `8080`).
  - `docker-multi-replica`: Menjalankan kontainer multi-replika menggunakan `docker-compose.prod.yml` dengan Nginx Load Balancer (port `80`).
  - `k3s`: Menjalankan deployment ke Kubernetes cluster lokal (K3s) menggunakan manifest di folder `k8s/` (port `80` via Traefik Ingress).
- **`REPLICA_COUNT`**: Menentukan jumlah replika service backend (khusus mode `docker-multi-replica`, default: `2`).
- **`RUN_MIGRATION`**: Menjalankan migrasi database otomatis (`npm run db:migrate:prod`) setelah deployment berhasil (default: `true`).

#### Tahapan Pipeline:

1. **Verify VM Connection**: Memvalidasi konektivitas SSH dari agent Jenkins ke Virtual Machine target (VirtualBox via port forwarding `2222`).
2. **Checkout**: Mengambil kode sumber terbaru dari repositori Git (`checkout scm`).
3. **Install Dependencies**: Memasang seluruh dependensi Node.js secara deterministik menggunakan `npm ci`.
4. **Lint**: Memeriksa kualitas dan kepatuhan standar kode TypeScript/JavaScript (`npm run lint --if-present`).
5. **Test**: Menjalankan pengujian otomatis yang terdiri dari unit test (`npm run test:unit --if-present`) dan feature test (`npm run test:feature --if-present`).
6. **Build**: Melakukan kompilasi kode sumber TypeScript ke JavaScript murni menggunakan `npm run build` (`tsc && tsc-alias`).
7. **Docker Build & Push**: Melakukan login ke Docker Registry, mem-build Docker image dengan tag nomor build (`${BUILD_NUMBER}`) dan `latest`, lalu melakukan _push_ image ke Docker Registry.
8. **Deploy (Dinamis sesuai `DEPLOY_MODE`)**:
   - **Docker Standalone**: Melakukan _pull_ image terbaru di VM dari registry, menyalin file `docker-compose.yml`, direktori `infra/`, dan file `.env`, menjalankan migrasi DB (`npm run db:migrate:prod`), lalu menyalakan stack container aplikasi tunggal.
   - **Docker Multi-Replica**: Melakukan _pull_ image terbaru di VM dari registry, menyalin `docker-compose.prod.yml`, direktori `infra/`, dan file `.env`, menjalankan migrasi DB, lalu melakukan _scaling_ replika container `app` sesuai `REPLICA_COUNT` dengan Nginx Load Balancer.
   - **K3s**: Melakukan _pull_ image terbaru di VM, menyimpannya ke file `.tar` lokal lalu mengimpornya ke runtime containerd K3s (`sudo k3s ctr -n k8s.io images import`), menerapkan seluruh manifest Kubernetes (`k8s/`), membuat/memperbarui Kubernetes Secret dari file `.env`, memicu _rollout restart_ deployment `sitako-app`, dan menjalankan migrasi DB di dalam Pod.
9. **Health Check**: Menguji endpoint aplikasi di VM secara dinamis via `curl` dengan mekanisme pengulangan otomatis (hingga 10 kali percobaan):
   - Mode `docker-standalone`: Port `8080`, path `/`
   - Mode `docker-multi-replica`: Port `80` (Nginx), path `/`
   - Mode `k3s`: Port `80` (Ingress Traefik), path `/api/health`
10. **Post Actions (Cleanup & Notification)**: Selalu membersihkan workspace di agent Jenkins (`deleteDir()`) serta mencatat notifikasi status eksekusi pipeline (berhasil / gagal).
