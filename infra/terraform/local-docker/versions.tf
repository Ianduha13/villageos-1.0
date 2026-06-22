# Terraform + provider constraints for the VillageOS local-docker module.
# Terraform is the single orchestrator (ADR-0001); the same description is the
# blueprint for the cloud module in Phase 9. kreuzwerker/docker drives the
# local stack.
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}
