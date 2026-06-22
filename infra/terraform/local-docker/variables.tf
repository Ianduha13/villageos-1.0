# Input variables for the VillageOS local-docker module.
#
# Secrets policy: passwords carry NO default — supply them via the git-ignored
# terraform.tfvars (see terraform.tfvars.example). Ports, network name, bucket
# and model names default to fixed constants; override only intentionally.

variable "project_name" {
  description = "Logical project identifier; container-name prefix (e.g. \"<name>-app\")."
  type        = string
  default     = "villageos"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.project_name))
    error_message = "project_name must start with a lowercase letter and contain only lowercase letters, digits and hyphens."
  }
}

# --- PostgreSQL -----------------------------------------------------------

variable "postgres_db" {
  description = "PostgreSQL database name."
  type        = string
  default     = "villageos"
}

variable "postgres_user" {
  description = "PostgreSQL role name."
  type        = string
  default     = "village"
}

variable "postgres_password" {
  description = "PostgreSQL password. Supplied via terraform.tfvars (no default)."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.postgres_password) > 0
    error_message = "postgres_password must not be empty."
  }
}

# --- MinIO ----------------------------------------------------------------

variable "minio_root_user" {
  description = "MinIO root user."
  type        = string
  default     = "village"
}

variable "minio_root_password" {
  description = "MinIO root password. Supplied via terraform.tfvars (no default)."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.minio_root_password) > 0
    error_message = "minio_root_password must not be empty."
  }
}

variable "minio_bucket" {
  description = "MinIO bucket created for proof artifacts."
  type        = string
  default     = "proofs"
}

# --- LLM / inference adapter ----------------------------------------------

variable "llm_chat_model" {
  description = "Ollama chat model the IA da Vila worker pulls and serves."
  type        = string
  default     = "llama3.2"
}

variable "llm_embedding_model" {
  description = "Ollama embedding model to pull and serve."
  type        = string
  default     = "nomic-embed-text"
}

# --- Network --------------------------------------------------------------

variable "network_name" {
  description = "Name of the single bridge network all containers attach to."
  type        = string
  default     = "villageos-network"
}

# --- Ports ----------------------------------------------------------------

variable "app_port" {
  description = "Host port published for the Next.js app (PWA)."
  type        = number
  default     = 3000

  validation {
    condition     = var.app_port > 0 && var.app_port < 65536
    error_message = "app_port must be between 1 and 65535."
  }
}

variable "minio_api_port" {
  description = "MinIO S3 API port (in-network only; not host-published)."
  type        = number
  default     = 9000
}

variable "minio_console_port" {
  description = "MinIO console port (bound to 127.0.0.1)."
  type        = number
  default     = 9001
}

variable "ollama_port" {
  description = "Ollama API port (bound to 127.0.0.1)."
  type        = number
  default     = 11434
}

variable "postgres_port" {
  description = "PostgreSQL port (in-network only; not host-published)."
  type        = number
  default     = 5432
}

variable "redis_port" {
  description = "Redis port (in-network only; not host-published)."
  type        = number
  default     = 6379
}

# --- App image ------------------------------------------------------------

variable "app_image" {
  description = <<-EOT
    Image for the Next.js app + worker containers. Defaults to a non-root
    placeholder (node:20-alpine) that holds the 6-container topology real while
    the app image is built; replace with the real VillageOS image for a live
    PWA. The worker reuses the same image with a different command.
  EOT
  type        = string
  default     = "node:20-alpine"
}

variable "retain_volumes" {
  description = "Whether named volumes survive teardown (honored by the destroy flow)."
  type        = bool
  default     = false
}
