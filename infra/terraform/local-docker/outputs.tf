# Service URLs surfaced after apply. Static (computed from port variables), all
# on the host loopback (127.0.0.1) per the exposure policy.

output "app_url" {
  description = "VillageOS PWA URL (host loopback)."
  value       = "http://localhost:${var.app_port}"
}

output "minio_console_url" {
  description = "MinIO console URL (bound to 127.0.0.1)."
  value       = "http://127.0.0.1:${var.minio_console_port}"
}

output "ollama_url" {
  description = "Ollama API URL (bound to 127.0.0.1)."
  value       = "http://127.0.0.1:${var.ollama_port}"
}
