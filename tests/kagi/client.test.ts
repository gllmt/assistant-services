import assert from "node:assert/strict";
import test from "node:test";

import { UpstreamError } from "../../src/lib/errors.ts";
import { createKagiClient } from "../../src/services/kagi/client.ts";
import type {
  KagiSearchParams,
  KagiSearchResult
} from "../../src/services/kagi/types.ts";

const baseParams: KagiSearchParams = {
  apiKey: "test-api-key",
  baseUrl: "https://kagi.com/api/v0",
  webBaseUrl: "https://kagi.com",
  query: "react server components",
  count: 3,
  mode: "auto",
  browserExecutablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  browserProfileDir: ".profiles/kagi-browser",
  browserHeadless: true
};

test("searchWithKagi falls back to browser session when API access is unavailable", async () => {
  let browserCalls = 0;
  let browserParams: KagiSearchParams | undefined;

  const browserResult: KagiSearchResult = {
    query: baseParams.query,
    provider: "kagi",
    mode: "browser_session",
    count: 1,
    tookMs: 42,
    warning: "Using Kagi browser-session fallback because Search API access is unavailable.",
    results: [
      {
        title: "Server Components",
        url: "https://react.dev/reference/rsc/server-components",
        snippet: "React Server Components let you render ahead of time on the server."
      }
    ]
  };

  const client = createKagiClient({
    getJson: async <T extends object>() => {
      throw new UpstreamError("Upstream request failed (401): Search API is currently in beta", 502, {
        upstreamStatus: 401,
        upstreamBody: "Search API is currently in beta. Request access to continue."
      });
    },
    getText: async () => "",
    searchWithKagiBrowser: async (params) => {
      browserCalls += 1;
      browserParams = params;
      return browserResult;
    },
    debugKagiBrowserSearch: async () => ({}),
    inspectKagiHtml: () => ({
      title: "",
      sampleAnchors: [],
      parsedResults: []
    }),
    parseKagiHtmlResults: () => [],
    resolveKagiSessionToken: () => undefined,
    redactKagiToken: (value) => value
  });

  const result = await client.searchWithKagi(baseParams);

  assert.deepEqual(result, browserResult);
  assert.equal(browserCalls, 1);
  assert.equal(browserParams?.mode, "browser_session");
});

test("searchWithKagi does not hide non-fallback upstream failures", async () => {
  let browserCalls = 0;

  const client = createKagiClient({
    getJson: async <T extends object>() => {
      throw new UpstreamError("Upstream request failed (500): boom", 502, {
        upstreamStatus: 500,
        upstreamBody: "boom"
      });
    },
    getText: async () => "",
    searchWithKagiBrowser: async () => {
      browserCalls += 1;
      throw new Error("browser fallback should not have been called");
    },
    debugKagiBrowserSearch: async () => ({}),
    inspectKagiHtml: () => ({
      title: "",
      sampleAnchors: [],
      parsedResults: []
    }),
    parseKagiHtmlResults: () => [],
    resolveKagiSessionToken: () => undefined,
    redactKagiToken: (value) => value
  });

  await assert.rejects(() => client.searchWithKagi(baseParams), (error: unknown) => {
    assert(error instanceof UpstreamError);
    assert.equal(error.upstreamStatus, 500);
    return true;
  });

  assert.equal(browserCalls, 0);
});

test("searchWithKagi returns API results when the API succeeds", async () => {
  const client = createKagiClient({
    getJson: async <T extends object>() =>
      ({
        data: [
          {
            t: 0,
            title: "Server Components",
            url: "https://react.dev/reference/rsc/server-components",
            snippet: "React Server Components let you render components on the server."
          }
        ]
      }) as T,
    getText: async () => "",
    searchWithKagiBrowser: async () => {
      throw new Error("browser fallback should not have been called");
    },
    debugKagiBrowserSearch: async () => ({}),
    inspectKagiHtml: () => ({
      title: "",
      sampleAnchors: [],
      parsedResults: []
    }),
    parseKagiHtmlResults: () => [],
    resolveKagiSessionToken: () => undefined,
    redactKagiToken: (value) => value
  });

  const result = await client.searchWithKagi(baseParams);

  assert.equal(result.mode, "api");
  assert.equal(result.count, 1);
  assert.deepEqual(result.results, [
    {
      title: "Server Components",
      url: "https://react.dev/reference/rsc/server-components",
      snippet: "React Server Components let you render components on the server.",
      published: undefined
    }
  ]);
});
