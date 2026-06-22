# Local-first Docker provider — talks to the host's default Docker socket. No
# remote daemon or registry credentials are configured; the cloud module
# (Phase 9) parametrizes the equivalent providers.
provider "docker" {}
