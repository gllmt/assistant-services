import { AppError, UpstreamError } from "../../lib/errors.js";
import { getJson, getText } from "../../lib/http.js";
import { debugKagiBrowserSearch, searchWithKagiBrowser } from "./browser.js";
import { inspectKagiHtml, parseKagiHtmlResults } from "./html.js";
import { mapKagiSearchResponse } from "./mapper.js";
import { redactKagiToken, resolveKagiSessionToken } from "./session.js";
import type {
  KagiRawSearchResponse,
  KagiSearchParams,
  KagiSearchResult
} from "./types.js";

type JsonFetcher = <T extends object>(url: URL, init?: RequestInit) => Promise<T>;

export interface KagiClientDeps {
  getJson: JsonFetcher;
  getText: (url: URL, init?: RequestInit) => Promise<string>;
  searchWithKagiBrowser: (params: KagiSearchParams) => Promise<KagiSearchResult>;
  debugKagiBrowserSearch: (params: KagiSearchParams) => Promise<unknown>;
  inspectKagiHtml: typeof inspectKagiHtml;
  parseKagiHtmlResults: typeof parseKagiHtmlResults;
  resolveKagiSessionToken: typeof resolveKagiSessionToken;
  redactKagiToken: typeof redactKagiToken;
}

const defaultDeps: KagiClientDeps = {
  getJson,
  getText,
  searchWithKagiBrowser,
  debugKagiBrowserSearch,
  inspectKagiHtml,
  parseKagiHtmlResults,
  resolveKagiSessionToken,
  redactKagiToken
};

export function createKagiClient(deps: KagiClientDeps = defaultDeps) {
  async function searchWithKagi(params: KagiSearchParams): Promise<KagiSearchResult> {
    if (params.mode === "api") {
      if (!params.apiKey) {
        throw new AppError("KAGI_API_KEY is required when KAGI_SEARCH_MODE=api", 500);
      }

      return searchWithKagiApi(params);
    }

    if (params.mode === "browser_session") {
      return deps.searchWithKagiBrowser(params);
    }

    if (params.mode === "session_html") {
      return searchWithKagiHtml(params);
    }

    if (params.apiKey) {
      try {
        return await searchWithKagiApi(params);
      } catch (error) {
        if (shouldFallbackToBrowser(error)) {
          return deps.searchWithKagiBrowser({
            ...params,
            mode: "browser_session"
          });
        }

        throw error;
      }
    }

    return deps.searchWithKagiBrowser({
      ...params,
      mode: "browser_session"
    });
  }

  async function debugKagiSearch(params: KagiSearchParams) {
    if (params.mode === "session_html") {
      return debugKagiHtmlSearch(params);
    }

    return deps.debugKagiBrowserSearch(params);
  }

  async function debugKagiHtmlSearch(params: KagiSearchParams) {
    const sessionToken = deps.resolveKagiSessionToken(params);

    if (!sessionToken) {
      throw new AppError(
        "Kagi HTML fallback requires KAGI_SESSION_TOKEN or KAGI_SESSION_LINK",
        500
      );
    }

    const url = new URL(`${params.webBaseUrl.replace(/\/$/, "")}/search`);
    url.searchParams.set("q", params.query);
    url.searchParams.set("token", sessionToken);

    const html = await deps.getText(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
      }
    });
    const inspection = deps.inspectKagiHtml(html, params.webBaseUrl);

    return {
      finalUrl: deps.redactKagiToken(url.toString()),
      title: inspection.title,
      sampleAnchors: inspection.sampleAnchors,
      parsedResults: inspection.parsedResults
    };
  }

  async function searchWithKagiApi(params: KagiSearchParams): Promise<KagiSearchResult> {
    const startedAt = Date.now();
    const url = new URL(`${params.baseUrl.replace(/\/$/, "")}/search`);

    url.searchParams.set("q", params.query);
    url.searchParams.set("limit", String(params.count));

    const payload = await deps.getJson<KagiRawSearchResponse>(url, {
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
      mode: "api",
      count: results.length,
      tookMs: Date.now() - startedAt,
      results
    };
  }

  async function searchWithKagiHtml(params: KagiSearchParams): Promise<KagiSearchResult> {
    const startedAt = Date.now();
    const sessionToken = deps.resolveKagiSessionToken(params);

    if (!sessionToken) {
      throw new AppError(
        "Kagi HTML fallback requires KAGI_SESSION_TOKEN or KAGI_SESSION_LINK",
        500
      );
    }

    const url = new URL(`${params.webBaseUrl.replace(/\/$/, "")}/search`);
    url.searchParams.set("q", params.query);
    url.searchParams.set("token", sessionToken);

    const html = await deps.getText(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
      }
    });

    const results = deps.parseKagiHtmlResults(html, params.webBaseUrl).slice(0, params.count);

    if (results.length === 0) {
      throw new UpstreamError(
        "Kagi HTML fallback returned no parsable search results",
        502,
        {
          upstreamBody: "No parsable Kagi HTML search results"
        }
      );
    }

    return {
      query: params.query,
      provider: "kagi",
      mode: "session_html",
      count: results.length,
      tookMs: Date.now() - startedAt,
      results,
      warning: "Using Kagi session-based HTML fallback because Search API access is unavailable."
    };
  }

  return {
    searchWithKagi,
    debugKagiSearch,
    debugKagiHtmlSearch
  };
}

export const { searchWithKagi, debugKagiSearch, debugKagiHtmlSearch } = createKagiClient();

function shouldFallbackToBrowser(error: unknown) {
  if (!(error instanceof UpstreamError)) {
    return false;
  }

  const status = error.upstreamStatus;
  const message = `${error.message}\n${error.upstreamBody ?? ""}`;

  return status === 401 && /search api is currently in beta|request access/i.test(message);
}
