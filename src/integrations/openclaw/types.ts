export interface OpenClawWebSearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
}

export interface OpenClawWebSearchResponse {
  query: string;
  provider: string;
  mode?: string;
  count: number;
  tookMs: number;
  warning?: string;
  externalContent: {
    untrusted: true;
    source: "web_search";
    provider: string;
    wrapped: true;
  };
  results: OpenClawWebSearchResult[];
}
