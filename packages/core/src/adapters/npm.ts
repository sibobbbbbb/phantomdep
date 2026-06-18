import type { EcosystemAdapter, PackageMetadata } from "../types.js";
import { defaultFetch, type FetchLike } from "./http.js";

const REGISTRY = "https://registry.npmjs.org";
const DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week";

interface NpmDoc {
  time?: { created?: string };
}

export function createNpmAdapter(fetchFn: FetchLike = defaultFetch): EcosystemAdapter {
  return {
    ecosystem: "npm",

    async exists(name) {
      const res = await fetchFn(`${REGISTRY}/${encodeURIComponent(name)}`);
      if (res.status === 404) return false;
      if (res.ok) return true;
      throw new Error(`npm registry error ${res.status} for ${name}`);
    },

    async getMetadata(name): Promise<PackageMetadata> {
      const meta: PackageMetadata = {};
      const doc = await fetchFn(`${REGISTRY}/${encodeURIComponent(name)}`);
      if (doc.ok) {
        const json = (await doc.json()) as NpmDoc;
        if (json.time?.created) meta.firstPublished = json.time.created;
      }
      const dl = await fetchFn(`${DOWNLOADS}/${encodeURIComponent(name)}`);
      if (dl.ok) {
        const json = (await dl.json()) as { downloads?: number };
        if (typeof json.downloads === "number") meta.downloads = json.downloads;
      }
      return meta;
    },
  };
}
