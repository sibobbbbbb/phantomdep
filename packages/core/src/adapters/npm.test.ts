import { describe, expect, test } from "vitest";
import { createNpmAdapter } from "./npm.js";
import type { FetchLike } from "./http.js";

function stub(routes: Record<string, { status: number; body?: unknown }>): FetchLike {
  return async (url) => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    const r = key ? routes[key]! : { status: 404 };
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status,
    });
  };
}

describe("npm adapter", () => {
  test("exists() is true on a 200 registry response", async () => {
    const a = createNpmAdapter(stub({ "registry.npmjs.org/react": { status: 200, body: {} } }));
    expect(await a.exists("react")).toBe(true);
  });

  test("exists() is false on a 404", async () => {
    const a = createNpmAdapter(stub({}));
    expect(await a.exists("totally-phantom-pkg")).toBe(false);
  });

  test("getMetadata() returns firstPublished and downloads", async () => {
    const a = createNpmAdapter(
      stub({
        "registry.npmjs.org": { status: 200, body: { time: { created: "2026-06-01T00:00:00Z" } } },
        "api.npmjs.org/downloads": { status: 200, body: { downloads: 7 } },
      }),
    );
    const meta = await a.getMetadata("something");
    expect(meta.firstPublished).toBe("2026-06-01T00:00:00Z");
    expect(meta.downloads).toBe(7);
  });
});
