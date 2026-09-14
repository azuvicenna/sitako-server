# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical official account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# Networking: VPC & Subnet
# -----------------------------------------------------------------------------
resource "aws_vpc" "sitako_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

resource "aws_internet_gateway" "sitako_igw" {
  vpc_id = aws_vpc.sitako_vpc.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

resource "aws_subnet" "sitako_public_subnet" {
  vpc_id                  = aws_vpc.sitako_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${var.environment}"
  }
}

resource "aws_route_table" "sitako_public_rt" {
  vpc_id = aws_vpc.sitako_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.sitako_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

resource "aws_route_table_association" "sitako_public_rta" {
  subnet_id      = aws_subnet.sitako_public_subnet.id
  route_table_id = aws_route_table.sitako_public_rt.id
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "sitako_sg" {
  name        = "${var.project_name}-sg-${var.environment}"
  description = "Security Group untuk server backend SITAKO"
  vpc_id      = aws_vpc.sitako_vpc.id

  # SSH Access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP - Nginx Load Balancer (Public access)
  ingress {
    description = "HTTP Public (Nginx Reverse Proxy / Load Balancer)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr
  }

  # HTTPS
  ingress {
    description = "HTTPS Public"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr
  }

  # SITAKO Backend App Port (Direct access / Fallback)
  ingress {
    description = "SITAKO App Direct Port"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr
  }

  # Prometheus Dashboard
  ingress {
    description = "Prometheus Monitoring UI"
    from_port   = 9091
    to_port     = 9091
    protocol    = "tcp"
    cidr_blocks = var.allowed_monitoring_cidr
  }

  # Outbound Traffic (Allow all)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# SSH Key Pair
# -----------------------------------------------------------------------------
resource "aws_key_pair" "sitako_key" {
  key_name   = "${var.project_name}-key-${var.environment}"
  public_key = file(var.ssh_public_key_path)

  tags = {
    Name = "${var.project_name}-key-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# EC2 Compute Instance
# -----------------------------------------------------------------------------
resource "aws_instance" "sitako_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.sitako_public_subnet.id
  vpc_security_group_ids = [aws_security_group.sitako_sg.id]
  key_name               = aws_key_pair.sitako_key.key_name

  root_block_device {
    volume_size           = var.volume_size
    volume_type           = "gp3"
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-root-volume-${var.environment}"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              hostnamectl set-hostname sitako-server
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg
              EOF

  tags = {
    Name = "${var.project_name}-server-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# Elastic IP (Static Public IP)
# -----------------------------------------------------------------------------
resource "aws_eip" "sitako_eip" {
  instance = aws_instance.sitako_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip-${var.environment}"
  }
}

# -----------------------------------------------------------------------------
# Otomatisasi: Generate Inventory Ansible
# -----------------------------------------------------------------------------
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/inventory.tmpl", {
    server_ip = aws_eip.sitako_eip.public_ip
    ssh_user  = "ubuntu"
  })
  filename        = "${path.module}/../ansible/inventory.ini"
  file_permission = "0644"
}
