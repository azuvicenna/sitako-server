variable "aws_region" {
  description = "Region AWS tempat infrastruktur akan dibuat (misal: ap-southeast-1 untuk Jakarta/Singapura)"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Nama proyek untuk penamaan resource dan tagging"
  type        = string
  default     = "sitako"
}

variable "environment" {
  description = "Nama environment (staging / production)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "Blok CIDR untuk VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Blok CIDR untuk subnet publik"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability Zone untuk subnet publik"
  type        = string
  default     = "ap-southeast-1a"
}

variable "instance_type" {
  description = "Tipe instance EC2 (disarankan minimal t3.small atau t3.medium untuk multi-replica compose)"
  type        = string
  default     = "t3.medium"
}

variable "volume_size" {
  description = "Ukuran EBS root volume dalam GB"
  type        = number
  default     = 30
}

variable "ssh_public_key_path" {
  description = "Path ke file SSH public key lokal untuk akses ke server (misal: ~/.ssh/id_rsa.pub atau ~/.ssh/id_ed25519.pub)"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "allowed_ssh_cidr" {
  description = "Daftar CIDR IP yang diizinkan mengakses port SSH (22). Disarankan membatasi ke IP publik Anda untuk keamanan!"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_http_cidr" {
  description = "Daftar CIDR IP yang diizinkan mengakses HTTP (80/8080/443)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_monitoring_cidr" {
  description = "Daftar CIDR IP yang diizinkan mengakses dashboard Prometheus (9091). Disarankan dibatasi ke IP dev/admin."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
