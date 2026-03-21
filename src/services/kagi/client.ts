import { getJson } from "../../lib/http.js";
import { mapKagiSearchResponse } from "./mapper.js";
import type { KagiRawSearchResponse, KagiSearchParams, KagiSearchResult } from "./types.js";

export async function searchWithKagi(params: KagiSearchParams): Promise<KagiSearchResult> {
  const startedAt = Date.now();
  const url = new URL(`${params.baseUrl.replace(/\/$/, "")}/search`);

  url.searchParams.set("q", params.query);
  url.searchParams.set("limit", String(params.count));

  const payload = await getJson<KagiRawSearchResponse>(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bot ${params.apiKey}`
    }
  });

  const results = mapKagiSearchResponse(payload);

  return {
    query: params.query,
    provider: "kagi",
    count: results.length,
    tookMs: Date.now() - startedAt,
    results
  };
}
