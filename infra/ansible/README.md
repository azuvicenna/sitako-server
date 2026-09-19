# Konfigurasi Ansible untuk SITAKO Server

Direktori ini berisi konfigurasi **Ansible (Configuration Management & Deployment)** untuk mengotomatisasi setup server dari keadaan awal (*fresh server*) hingga aplikasi **SITAKO Server** (Node.js/Express, multi-replica container, Nginx Load Balancer, PostgreSQL, Redis, Prometheus) berjalan dan siap melayani trafik.

---

## Struktur Direktori

```text
infra/ansible/
├── ansible.cfg                 # Pengaturan default Ansible
├── group_vars/
│   └── all.yml                 # Konfigurasi variabel aplikasi, port, database, dsb.
├── inventory.ini.example       # Contoh inventaris server target
├── roles/
│   ├── common/                 # Setup dasar OS, swap memory, ufw firewall, fail2ban
│   │   └── tasks/main.yml
│   ├── docker/                 # Instalasi Docker CE & Docker Compose Plugin v2
│   │   └── tasks/main.yml
│   └── sitako/                 # Deploy SITAKO, template .env, scale app, migrasi DB
│       ├── tasks/main.yml
│       └── templates/
│           └── env.j2
├── site.yml                    # Playbook utama yang menggabungkan seluruh role
└── README.md                   # Dokumentasi panduan penggunaan
```

---

## Prasyarat Sebelum Menggunakan

1. **Ansible**: Terpasang di komputer lokal atau VM kontrol Anda (versi `>= 2.14`):
   ```bash
   pip install ansible
   ```
2. **Koleksi Komunitas**:
   ```bash
   ansible-galaxy collection install community.general ansible.posix
   ```
3. **Akses SSH**:
   - Server target berbasis **Ubuntu 22.04 / 24.04 LTS**.
   - User `ubuntu` (atau user lain dengan akses `sudo` tanpa password).
   - SSH Public Key Anda sudah terdaftar di `~/.ssh/authorized_keys` server target.

---

## Cara Penggunaan (Saat Anda Siap Menggunakannya)

### 1. Masuk ke Direktori Ansible
```bash
cd infra/ansible
```

### 2. Siapkan File Inventory

- **Jika menggunakan Terraform**:
  File `inventory.ini` akan **otomatis dibuat** saat menjalankan `terraform apply` di folder `infra/terraform`.
- **Jika menggunakan server mandiri (VPS / VM Multipass)**:
  Salin template dan isi IP server Anda:
  ```bash
  cp inventory.ini.example inventory.ini
  ```
  Edit file `inventory.ini` dan masukkan IP publik server Anda.

### 3. Sesuaikan Variabel di `group_vars/all.yml`
Buka file `group_vars/all.yml` untuk menyesuaikan kredensial:
- `postgres_password`: Password database PostgreSQL.
- `jwt_secret`: Secret token untuk otentikasi JWT.
- `replica_count`: Jumlah replika container backend (default: `2`).
- Kredensial opsional (Tripay, Mailer SMTP, Cloudflare R2 / S3).

---

## Menjalankan Playbook

### 1. Uji Koneksi ke Server (Ping)
```bash
ansible sitako_servers -m ping
```

### 2. Validasi Sintaks Playbook
```bash
ansible-playbook site.yml --syntax-check
```

### 3. Simulasi Dry-Run (Check Mode)
```bash
ansible-playbook site.yml --check
```

### 4. Eksekusi Penuh (Provisioning & Deployment)
```bash
ansible-playbook site.yml
```

---

## Menjalankan Berdasarkan Tag Tertentu

Anda dapat menjalankan bagian tertentu dari playbook tanpa harus mengulang seluruh proses:

- **Hanya konfigurasi sistem dasar & firewall:**
  ```bash
  ansible-playbook site.yml --tags system
  ```

- **Hanya instalasi Docker Engine & Compose:**
  ```bash
  ansible-playbook site.yml --tags docker
  ```

- **Hanya update / redeploy aplikasi SITAKO & migrasi DB:**
  ```bash
  ansible-playbook site.yml --tags deploy
  ```

- **Menjalankan seeder awal akun pustakawan (pertama kali deploy):**
  ```bash
  ansible-playbook site.yml --tags deploy -e "run_seed=true"
  ```

- **Menyesuaikan jumlah replika secara dinamis:**
  ```bash
  ansible-playbook site.yml --tags deploy -e "replica_count=4"
  ```

---

## Verifikasi Hasil Deployment

Setelah playbook selesai:
- **Aplikasi SITAKO (via Load Balancer)**: `http://<SERVER_IP>/`
- **Health Check Endpoint**: `http://<SERVER_IP>/nginx-health`
- **Prometheus UI**: `http://<SERVER_IP>:9091`
- **Metrics Endpoint**: `http://<SERVER_IP>:8080/metrics`
