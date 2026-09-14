output "instance_id" {
  description = "ID dari instance EC2 SITAKO"
  value       = aws_instance.sitako_server.id
}

output "server_public_ip" {
  description = "IP Publik statis (Elastic IP) dari server SITAKO"
  value       = aws_eip.sitako_eip.public_ip
}

output "ssh_command" {
  description = "Perintah untuk login ke server via SSH"
  value       = "ssh ubuntu@${aws_eip.sitako_eip.public_ip}"
}

output "application_url" {
  description = "URL akses publik SITAKO Backend melalui Nginx Load Balancer"
  value       = "http://${aws_eip.sitako_eip.public_ip}"
}

output "prometheus_url" {
  description = "URL akses Prometheus Dashboard"
  value       = "http://${aws_eip.sitako_eip.public_ip}:9091"
}

output "ansible_inventory_path" {
  description = "File inventory Ansible yang berhasil digenerate otomatis"
  value       = local_file.ansible_inventory.filename
}
