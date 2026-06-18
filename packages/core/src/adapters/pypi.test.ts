import { describe, expect, test } from "vitest";
import { createPypiAdapter } from "./pypi.js";
import type { FetchLike } from "./http.js";

const stub = (status: number, body?: unknown): FetchLike => async () =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("pypi adapter", () => {
  test("exists() is true on a 200", async () => {
    const a = createPypiAdapter(stub(200, { releases: {} }));
    expect(await a.exists("requests")).toBe(true);
  });

  test("exists() is false on a 404", async () => {
    const a = createPypiAdapter(stub(404));
    expect(await a.exists("phantom-pypi-pkg")).toBe(false);
  });

  test("getMetadata() derives firstPublished from earliest release upload", async () => {
    const a = createPypiAdapter(
      stub(200, {
        releases: {
          "0.1.0": [{ upload_time_iso_8601: "2026-06-05T10:00:00Z" }],
          "0.2.0": [{ upload_time_iso_8601: "2026-06-09T10:00:00Z" }],
        },
      }),
    );
    const meta = await a.getMetadata("x");
    expect(meta.firstPublished).toBe("2026-06-05T10:00:00Z");
  });
});
