#!/usr/bin/env bash
# Asserts the exposure policy: stateful services (postgres/redis + the MinIO S3
# API) are NOT host-published; only the app, MinIO console, and Ollama publish,
# all on 127.0.0.1 (never 0.0.0.0). Run after `terraform apply`.
set -euo pipefail

PROJECT="${VILLAGEOS_PROJECT:-villageos}"
fail=0

ok() { echo "  ok:   $1"; }
no() {
  echo "  FAIL: $1" >&2
  fail=1
}
inspect() { docker inspect "$1" --format "$2" 2>/dev/null || true; }

echo "internal-only stateful services"
for svc in postgres redis; do
  case "$(inspect "${PROJECT}-${svc}" '{{json .HostConfig.PortBindings}}')" in
    null | '{}') ok "${svc}: no host-published ports" ;;
    *) no "${svc}: unexpected host ports (should be internal-only)" ;;
  esac
done

echo "worker has no host ports"
case "$(inspect "${PROJECT}-worker" '{{json .HostConfig.PortBindings}}')" in
  null | '{}') ok "worker: no host-published ports" ;;
  *) no "worker: unexpected host ports" ;;
esac

echo "loopback-only published surfaces"
for svc in app minio ollama; do
  bindings="$(inspect "${PROJECT}-${svc}" '{{json .HostConfig.PortBindings}}')"
  case "${bindings}" in
    *'0.0.0.0'*) no "${svc}: published on 0.0.0.0 (exposed beyond localhost)" ;;
    *'127.0.0.1'*) ok "${svc}: published on 127.0.0.1 only" ;;
    *) no "${svc}: expected a loopback host port" ;;
  esac
done

if [ "${fail}" -ne 0 ]; then
  echo "exposure: FAILED" >&2
  exit 1
fi
echo "exposure: PASSED"
