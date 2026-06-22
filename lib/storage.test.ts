import { describe, it, expect } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FilesystemStore } from "@/lib/storage";

/* Unit test — no Docker. The filesystem artifact store round-trips bytes. */
describe("FilesystemStore", () => {
  it("stores bytes and returns a /proofs uri that resolves back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "vos-proofs-"));
    const store = new FilesystemStore(dir);

    const bytes = new TextEncoder().encode("evidence: praia limpa");
    const { uri } = await store.put("foto da praia.jpg", bytes);

    expect(uri).toMatch(/^\/proofs\//);
    const key = uri.replace("/proofs/", "");
    const back = await readFile(join(dir, key));
    expect(new TextDecoder().decode(back)).toBe("evidence: praia limpa");
  });
});
