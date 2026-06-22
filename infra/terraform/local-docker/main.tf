# VillageOS local stack — one bridge network, three named volumes, and the
# services: Postgres+pgvector (Reality Ledger + relational + embeddings), Redis
# (async IA da Vila queue), MinIO (+ proofs bucket), Ollama (local inference),
# the Next.js app, and the worker. CIS-hardened (cap_drop=ALL, no-new-privileges,
# read-only root + tmpfs); only the app, MinIO console, and Ollama publish to
# 127.0.0.1. Stateful services stay network-internal.

resource "docker_network" "villageos" {
  name   = var.network_name
  driver = "bridge"
}

resource "docker_volume" "postgres_data" {
  name = "postgres_data"
}

resource "docker_volume" "minio_data" {
  name = "minio_data"
}

resource "docker_volume" "ollama_models" {
  name = "ollama_models"
}

locals {
  images = {
    postgres = "pgvector/pgvector:pg16"
    redis    = "redis:7-alpine"
    minio    = "minio/minio:latest"
    mc       = "minio/mc:latest"
    ollama   = "ollama/ollama:latest"
  }

  # Shared backend env for app + worker — service discovery by container name on
  # villageos-network. Secrets flow from sensitive variables; only *.example is
  # committed. The inference adapter is config-driven (LLM_*), so the LLM backend
  # is swappable without code changes (the AI is advisory and never decides).
  backend_env = [
    "NODE_ENV=production",
    "POSTGRES_HOST=postgres",
    "POSTGRES_PORT=${var.postgres_port}",
    "POSTGRES_DB=${var.postgres_db}",
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
    "DATABASE_URL=postgresql://${var.postgres_user}:${var.postgres_password}@postgres:${var.postgres_port}/${var.postgres_db}",
    "REDIS_URL=redis://redis:${var.redis_port}",
    "S3_ENDPOINT=http://minio:${var.minio_api_port}",
    "S3_BUCKET=${var.minio_bucket}",
    "S3_ACCESS_KEY=${var.minio_root_user}",
    "S3_SECRET_KEY=${var.minio_root_password}",
    "LLM_PROVIDER=local",
    "LLM_BASE_URL=http://ollama:${var.ollama_port}",
    "LLM_CHAT_MODEL=${var.llm_chat_model}",
    "LLM_EMBEDDING_MODEL=${var.llm_embedding_model}",
  ]
}

resource "docker_image" "postgres" {
  name = local.images.postgres
}

resource "docker_image" "redis" {
  name = local.images.redis
}

resource "docker_image" "minio" {
  name = local.images.minio
}

resource "docker_image" "mc" {
  name = local.images.mc
}

resource "docker_image" "ollama" {
  name = local.images.ollama
}

resource "docker_image" "app" {
  name = var.app_image
}

# --- PostgreSQL 16 + pgvector ----------------------------------------------
# Internal-only. The entrypoint starts as root to prep the data dir then drops
# privileges, hence the minimal cap_add set. read-only root + tmpfs.
resource "docker_container" "postgres" {
  name    = "${var.project_name}-postgres"
  image   = docker_image.postgres.image_id
  restart = "unless-stopped"

  env = [
    "POSTGRES_DB=${var.postgres_db}",
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
  ]

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["postgres"]
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  healthcheck {
    test     = ["CMD-SHELL", "pg_isready -U ${var.postgres_user} -d ${var.postgres_db}"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  capabilities {
    drop = ["ALL"]
    add  = ["CAP_CHOWN", "CAP_SETGID", "CAP_SETUID", "CAP_DAC_OVERRIDE", "CAP_FOWNER"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
    "/run" = ""
  }
}

# --- Redis 7 (ephemeral async queue) ---------------------------------------
resource "docker_container" "redis" {
  name    = "${var.project_name}-redis"
  image   = docker_image.redis.image_id
  restart = "unless-stopped"
  user    = "999:1000"

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["redis"]
  }

  healthcheck {
    test     = ["CMD", "redis-cli", "ping"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp"  = ""
    "/data" = ""
  }
}

# --- MinIO (proof artifacts) -----------------------------------------------
# S3 API (9000) internal-only; console (9001) bound to 127.0.0.1.
resource "docker_container" "minio" {
  name    = "${var.project_name}-minio"
  image   = docker_image.minio.image_id
  restart = "unless-stopped"
  command = ["server", "/data", "--console-address", ":${var.minio_console_port}"]

  env = [
    "MINIO_ROOT_USER=${var.minio_root_user}",
    "MINIO_ROOT_PASSWORD=${var.minio_root_password}",
  ]

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["minio"]
  }

  volumes {
    volume_name    = docker_volume.minio_data.name
    container_path = "/data"
  }

  ports {
    internal = var.minio_console_port
    external = var.minio_console_port
    ip       = "127.0.0.1"
  }

  healthcheck {
    test     = ["CMD", "curl", "-f", "http://localhost:${var.minio_api_port}/minio/health/live"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
  }
}

# --- Ollama (local inference) ----------------------------------------------
resource "docker_container" "ollama" {
  name    = "${var.project_name}-ollama"
  image   = docker_image.ollama.image_id
  restart = "unless-stopped"

  env = [
    "OLLAMA_HOST=0.0.0.0:${var.ollama_port}",
  ]

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["ollama"]
  }

  volumes {
    volume_name    = docker_volume.ollama_models.name
    container_path = "/root/.ollama"
  }

  ports {
    internal = var.ollama_port
    external = var.ollama_port
    ip       = "127.0.0.1"
  }

  healthcheck {
    test     = ["CMD", "ollama", "list"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
  }
}

# --- Bucket init -----------------------------------------------------------
# One-shot minio/mc helper: waits for MinIO, then idempotently creates the
# proofs bucket. must_run=false (exits after the job).
resource "docker_container" "createbucket" {
  name       = "${var.project_name}-createbucket"
  image      = docker_image.mc.image_id
  restart    = "no"
  must_run   = false
  depends_on = [docker_container.minio]

  env = [
    "MINIO_ROOT_USER=${var.minio_root_user}",
    "MINIO_ROOT_PASSWORD=${var.minio_root_password}",
    "HOME=/tmp",
  ]

  entrypoint = ["/bin/sh", "-c"]
  command = [
    "i=0; until mc alias set local http://minio:${var.minio_api_port} \"$MINIO_ROOT_USER\" \"$MINIO_ROOT_PASSWORD\" >/dev/null 2>&1; do i=$((i + 1)); if [ \"$i\" -ge 30 ]; then echo 'minio unreachable after ~60s' >&2; exit 1; fi; echo 'waiting for minio...'; sleep 2; done; mc mb --ignore-existing local/${var.minio_bucket} && echo \"bucket ready: ${var.minio_bucket}\"",
  ]

  networks_advanced {
    name = docker_network.villageos.name
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
  }
}

# --- App: Next.js PWA (full-stack) -----------------------------------------
# Publishes to 127.0.0.1 only. The default placeholder image keeps the topology
# real until the VillageOS image is built; swap var.app_image for the real one.
resource "docker_container" "app" {
  name    = "${var.project_name}-app"
  image   = docker_image.app.image_id
  restart = "unless-stopped"
  user    = "node"
  env     = local.backend_env

  # Placeholder keep-alive so the 6-container topology is real before the
  # VillageOS image is built; the real image overrides this with the Next.js
  # server (CMD already set in its Dockerfile).
  entrypoint = ["/bin/sh", "-c"]
  command    = ["tail -f /dev/null"]

  depends_on = [
    docker_container.postgres,
    docker_container.redis,
    docker_container.minio,
  ]

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["app"]
  }

  ports {
    internal = 3000
    external = var.app_port
    ip       = "127.0.0.1"
  }

  labels {
    label = "villageos.placeholder"
    value = "true"
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
  }
}

# --- Worker: async IA da Vila (Redis consumer) -----------------------------
# No host port. Reuses the app image; the real image runs `npm run worker`.
resource "docker_container" "worker" {
  name    = "${var.project_name}-worker"
  image   = docker_image.app.image_id
  restart = "unless-stopped"
  user    = "node"
  env     = local.backend_env

  # Placeholder keep-alive; the real image runs `npm run worker`.
  entrypoint = ["/bin/sh", "-c"]
  command    = ["tail -f /dev/null"]

  depends_on = [
    docker_container.redis,
    docker_container.ollama,
    docker_container.postgres,
  ]

  networks_advanced {
    name    = docker_network.villageos.name
    aliases = ["worker"]
  }

  labels {
    label = "villageos.placeholder"
    value = "true"
  }

  capabilities {
    drop = ["ALL"]
  }
  security_opts = ["no-new-privileges:true"]
  read_only     = true
  tmpfs = {
    "/tmp" = ""
  }
}
