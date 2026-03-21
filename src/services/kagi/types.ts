export interface KagiSearchParams {
  apiKey: string;
  baseUrl: string;
  query: string;
  count: number;
}

export interface KagiRawSearchResponse {
  data?: unknown[];
}

export interface KagiSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  published?: string;
}

export interface KagiSearchResult {
  query: string;
  provider: "kagi";
  count: number;
  tookMs: number;
  results: KagiSearchResultItem[];
}
