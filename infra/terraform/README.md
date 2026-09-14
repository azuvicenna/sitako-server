# Konfigurasi Terraform untuk SITAKO Backend

Direktori ini berisi konfigurasi **Terraform (Infrastructure as Code)** untuk menyediakan infrastruktur server cloud (AWS) yang siap digunakan untuk menjalankan aplikasi **SITAKO Backend**.

---

## Arsitektur Infrastruktur yang Disediakan

- **VPC & Subnet**: 1 VPC khusus dengan 1 Public Subnet dan Internet Gateway.
- **Security Group (`sitako-sg`)**:
  - `22/tcp`: Akses SSH untuk remote admin & Ansible.
  - `80/tcp`: Akses HTTP publik melalui Nginx Load Balancer.
  - `443/tcp`: Akses HTTPS publik (jika SSL diaktifkan).
  - `8080/tcp`: Akses langsung ke port aplikasi Express.
  - `9091/tcp`: Akses ke Prometheus monitoring dashboard.
- **EC2 Instance**: Ubuntu 24.04 LTS (Noble Numbat) dengan tipe instance yang dapat disesuaikan (default: `t3.medium` dengan 30 GB EBS gp3).
- **Elastic IP (EIP)**: Alamat IP publik statis yang terikat ke instance.
- **Ansible Inventory Generator**: Otomatis membuat file `infra/ansible/inventory.ini` dengan IP publik server setelah `terraform apply` selesai.

---

## Prasyarat Sebelum Menggunakan

1. **Terraform CLI**: Versi `>= 1.5.0` terpasang di komputer lokal Anda ([Unduh Terraform](https://developer.hashicorp.com/terraform/downloads)).
2. **AWS CLI & Kredensial**:
   - Akun AWS dengan hak akses EC2 & VPC.
   - Konfigurasikan kredensial di komputer lokal:
     ```bash
     aws configure
     ```
     Atau set environment variables:
     ```bash
     export AWS_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxxxxx"
     export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
     export AWS_DEFAULT_REGION="ap-southeast-1"
     ```
3. **SSH Key Pair**:
   - Pastikan Anda sudah memiliki SSH key di komputer Anda (misal `~/.ssh/id_rsa.pub`).
   - Jika belum ada, buat dengan perintah:
     ```bash
     ssh-keygen -t ed25519 -C "sitako-deploy"
     ```

---

## Cara Menjalankan (Saat Anda Siap Menggunakannya)

### 1. Masuk ke Direktori Terraform
```bash
cd infra/terraform
```

### 2. Salin dan Sesuaikan Variabel
```bash
cp terraform.tfvars.example terraform.tfvars
```
Buka file `terraform.tfvars` dan sesuaikan:
- `aws_region`: Region AWS tujuan (default: `ap-southeast-1`).
- `ssh_public_key_path`: Path ke public key Anda.
- `allowed_ssh_cidr`: Batasi ke IP Anda (misal `["103.xxx.xxx.xxx/32"]`).

### 3. Inisialisasi Terraform Provider
```bash
terraform init
```

### 4. Tinjau Rencana Pembuatan Resource
```bash
terraform plan
```

### 5. Terapkan dan Buat Infrastruktur
```bash
terraform apply
```
Ketik `yes` saat diminta konfirmasi.

Setelah proses selesai, Terraform akan menampilkan output seperti:
```text
Outputs:

ansible_inventory_path = "../ansible/inventory.ini"
application_url = "http://54.255.xxx.xxx"
instance_id = "i-0123456789abcdef0"
prometheus_url = "http://54.255.xxx.xxx:9091"
server_public_ip = "54.255.xxx.xxx"
ssh_command = "ssh ubuntu@54.255.xxx.xxx"
```

File `infra/ansible/inventory.ini` akan otomatis terbuat dengan IP publik yang baru!

---

## Menghapus Seluruh Infrastruktur (Teardown)

Jika Anda ingin mematikan dan menghapus semua resource cloud agar tidak memakan biaya:
```bash
terraform destroy
```
Ketik `yes` untuk mengonfirmasi penghapusan.
