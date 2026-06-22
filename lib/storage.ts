import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/*
 * Proof artifact storage.
 *
 * Tier-1 default = local filesystem (no extra dependency, simplest deploy). The
 * S3/MinIO backend (S3_ENDPOINT / S3_BUCKET already in .env.example) is the
 * documented drop-in for later behind this same `ArtifactStore` interface — a
 * config change, not a call-site change. Link-type proofs skip storage entirely
 * (their `uri` is the external URL).
 */
export interface ArtifactStore {
  put(filename: string, bytes: Uint8Array): Promise<{ uri: string }>;
}

export class FilesystemStore implements ArtifactStore {
  private dir: string;
  constructor(dir?: string) {
    this.dir = dir ?? process.env.PROOFS_DIR ?? join(process.cwd(), "data", "proofs");
  }
  async put(filename: string, bytes: Uint8Array): Promise<{ uri: string }> {
    await mkdir(this.dir, { recursive: true });
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "artifact";
    const key = `${randomUUID()}-${safe}`;
    await writeFile(join(this.dir, key), bytes);
    return { uri: `/proofs/${key}` };
  }
}

let store: ArtifactStore | undefined;

/** Process-wide artifact store (filesystem in Tier 1). */
export function getArtifactStore(): ArtifactStore {
  if (!store) store = new FilesystemStore();
  return store;
}
