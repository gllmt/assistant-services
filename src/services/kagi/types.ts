export interface KagiSearchParams {
  apiKey?: string;
  baseUrl: string;
  webBaseUrl: string;
  query: string;
  count: number;
  mode: "auto" | "api" | "browser_session" | "session_html";
  sessionLink?: string;
  sessionToken?: string;
  browserExecutablePath: string;
  browserProfileDir: string;
  browserHeadless: boolean;
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
  mode: "api" | "browser_session" | "session_html";
  count: number;
  tookMs: number;
  results: KagiSearchResultItem[];
  warning?: string;
}
