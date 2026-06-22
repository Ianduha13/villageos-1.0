#!/usr/bin/env bash
# Asserts the VillageOS service containers exist with deterministic names and
# the app/worker are CIS-hardened (cap_drop=ALL, no-new-privileges, read-only
# root). Run after `terraform apply`; wired into `make test-flow`.
set -euo pipefail

PROJECT="${VILLAGEOS_PROJECT:-villageos}"
SERVICES="app worker postgres redis minio ollama"
fail=0

ok() { echo "  ok:   $1"; }
no() {
  echo "  FAIL: $1" >&2
  fail=1
}
inspect() { docker inspect "$1" --format "$2" 2>/dev/null || true; }

echo "services exist"
for svc in ${SERVICES}; do
  if [ -n "$(inspect "${PROJECT}-${svc}" '{{.Id}}')" ]; then
    ok "container ${PROJECT}-${svc} exists"
  else
    no "container ${PROJECT}-${svc} missing"
  fi
done

echo "app/worker hardening"
for svc in app worker; do
  c="${PROJECT}-${svc}"
  case "$(inspect "$c" '{{json .HostConfig.CapDrop}}')" in *'"ALL"'*) ok "${svc}: CapDrop=ALL" ;; *) no "${svc}: CapDrop missing ALL" ;; esac
  case "$(inspect "$c" '{{json .HostConfig.SecurityOpt}}')" in *no-new-privileges*) ok "${svc}: no-new-privileges" ;; *) no "${svc}: missing no-new-privileges" ;; esac
  case "$(inspect "$c" '{{.HostConfig.ReadonlyRootfs}}')" in true) ok "${svc}: ReadonlyRootfs" ;; *) no "${svc}: ReadonlyRootfs not true" ;; esac
done

echo "env wiring (app/worker)"
for svc in app worker; do
  envjson="$(inspect "${PROJECT}-${svc}" '{{json .Config.Env}}')"
  for key in DATABASE_URL REDIS_URL S3_ENDPOINT LLM_BASE_URL; do
    case "${envjson}" in *"\"${key}="*) ok "${svc}: has ${key}" ;; *) no "${svc}: missing ${key}" ;; esac
  done
done

if [ "${fail}" -ne 0 ]; then
  echo "services: FAILED" >&2
  exit 1
fi
echo "services: PASSED"
