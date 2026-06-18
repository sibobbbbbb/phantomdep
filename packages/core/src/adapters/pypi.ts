import type { EcosystemAdapter, PackageMetadata } from "../types.js";
import { defaultFetch, type FetchLike } from "./http.js";

const BASE = "https://pypi.org/pypi";

interface PypiFile {
  upload_time_iso_8601?: string;
}
interface PypiDoc {
  releases?: Record<string, PypiFile[]>;
}

export function createPypiAdapter(fetchFn: FetchLike = defaultFetch): EcosystemAdapter {
  return {
    ecosystem: "pypi",

    async exists(name) {
      const res = await fetchFn(`${BASE}/${encodeURIComponent(name)}/json`);
      if (res.status === 404) return false;
      if (res.ok) return true;
      throw new Error(`pypi error ${res.status} for ${name}`);
    },

    async getMetadata(name): Promise<PackageMetadata> {
      const meta: PackageMetadata = {};
      const res = await fetchFn(`${BASE}/${encodeURIComponent(name)}/json`);
      if (!res.ok) return meta;
      const json = (await res.json()) as PypiDoc;
      const times: string[] = [];
      for (const files of Object.values(json.releases ?? {})) {
        for (const f of files) {
          if (f.upload_time_iso_8601) times.push(f.upload_time_iso_8601);
        }
      }
      if (times.length > 0) {
        meta.firstPublished = times.sort()[0];
      }
      return meta;
    },
  };
}
