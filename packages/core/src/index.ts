export type {
  Assessment,
  Ecosystem,
  EcosystemAdapter,
  PackageMetadata,
  Verdict,
} from "./types.js";
export { defaultThresholds, type Thresholds } from "./config.js";
export {
  assess,
  assessMany,
  assessManyWith,
  assessWith,
  type AssessDeps,
} from "./assess.js";
export { assessTree, extractPackages, resolveLockfile, type ExtractResult } from "./tree.js";
export { createNpmAdapter } from "./adapters/npm.js";
export { createPypiAdapter } from "./adapters/pypi.js";
export { defaultFetch, type FetchLike } from "./adapters/http.js";
