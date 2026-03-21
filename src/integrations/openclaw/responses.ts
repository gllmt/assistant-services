import type { OpenClawWebSearchResponse } from "./types.js";
import type { KagiSearchResult } from "../../services/kagi/types.js";

export function createOpenClawWebSearchResponse(
  result: KagiSearchResult
): OpenClawWebSearchResponse {
  return {
    query: result.query,
    provider: result.provider,
    count: result.count,
    tookMs: result.tookMs,
    externalContent: {
      untrusted: true,
      source: "web_search",
      provider: result.provider,
      wrapped: true
    },
    results: result.results.map((item) => ({
      title: item.title,
      url: item.url,
      description: item.snippet,
      published: item.published
    }))
  };
}
