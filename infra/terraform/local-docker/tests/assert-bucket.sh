#!/usr/bin/env bash
# Asserts the network + named volumes exist and the proofs bucket was created by
# the one-shot createbucket helper. Run after `terraform apply`.
set -euo pipefail

PROJECT="${VILLAGEOS_PROJECT:-villageos}"
NETWORK="${VILLAGEOS_NETWORK:-villageos-network}"
BUCKET="${VILLAGEOS_BUCKET:-proofs}"
fail=0

ok() { echo "  ok:   $1"; }
no() {
  echo "  FAIL: $1" >&2
  fail=1
}

echo "network + volumes"
if docker network inspect "${NETWORK}" >/dev/null 2>&1; then ok "network ${NETWORK}"; else no "network ${NETWORK} missing"; fi
for v in postgres_data minio_data ollama_models; do
  if docker volume inspect "$v" >/dev/null 2>&1; then ok "volume $v"; else no "volume $v missing"; fi
done

echo "proofs bucket created"
# The createbucket helper logs "bucket ready: <bucket>" on success; verify via
# its logs (it exits after the one-shot job).
logs="$(docker logs "${PROJECT}-createbucket" 2>&1 || true)"
case "${logs}" in
  *"bucket ready: ${BUCKET}"*) ok "createbucket created '${BUCKET}'" ;;
  *) no "createbucket did not confirm bucket '${BUCKET}' (logs: ${logs})" ;;
esac

if [ "${fail}" -ne 0 ]; then
  echo "bucket: FAILED" >&2
  exit 1
fi
echo "bucket: PASSED"
