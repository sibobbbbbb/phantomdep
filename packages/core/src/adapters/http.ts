/** Minimal fetch signature so adapters are testable without a network. */
export type FetchLike = (url: string) => Promise<Response>;

export const defaultFetch: FetchLike = (url) =>
  fetch(url, { headers: { accept: "application/json" } });
