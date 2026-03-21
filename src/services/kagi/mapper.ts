import type { KagiRawSearchResponse, KagiSearchResultItem } from "./types.js";

interface KagiWebEntry {
  t?: number;
  title?: unknown;
  url?: unknown;
  snippet?: unknown;
  published?: unknown;
}

function hasStringUrl(entry: KagiWebEntry): entry is KagiWebEntry & { url: string } {
  return entry.t === 0 && typeof entry.url === "string";
}

export function mapKagiSearchResponse(payload: KagiRawSearchResponse): KagiSearchResultItem[] {
  const entries = Array.isArray(payload.data) ? payload.data : [];

  return entries
    .filter((entry): entry is KagiWebEntry => typeof entry === "object" && entry !== null)
    .filter(hasStringUrl)
    .map((entry) => ({
      title: typeof entry.title === "string" ? entry.title : "",
      url: entry.url,
      snippet: typeof entry.snippet === "string" ? entry.snippet : "",
      published: typeof entry.published === "string" ? entry.published : undefined
    }));
}
