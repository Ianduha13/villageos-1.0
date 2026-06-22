import { describe, it, expect } from "vitest";
import { computeCci, type Submetrics } from "@/lib/metrics";

/* Unit — the CCI math is the must-be-correct part; null-safe averaging. */
describe("computeCci", () => {
  const base: Submetrics = {
    proofCoverage: null,
    decisionCoverage: null,
    aiSupportCoverage: null,
    reviewRate: null,
  };

  it("returns null when every submetric is null", () => {
    expect(computeCci(base)).toBeNull();
  });

  it("averages only the present submetrics", () => {
    expect(
      computeCci({ ...base, proofCoverage: 1, aiSupportCoverage: 0.5 }),
    ).toBeCloseTo(0.75);
  });

  it("averages all four when present", () => {
    expect(
      computeCci({
        proofCoverage: 1,
        decisionCoverage: 0,
        aiSupportCoverage: 0.5,
        reviewRate: 0.5,
      }),
    ).toBeCloseTo(0.5);
  });

  it("is 0 when all present submetrics are 0", () => {
    expect(
      computeCci({
        proofCoverage: 0,
        decisionCoverage: 0,
        aiSupportCoverage: 0,
        reviewRate: 0,
      }),
    ).toBe(0);
  });

  it("is 1 when all present submetrics are 1", () => {
    expect(
      computeCci({
        proofCoverage: 1,
        decisionCoverage: 1,
        aiSupportCoverage: 1,
        reviewRate: 1,
      }),
    ).toBe(1);
  });
});
