import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectKagiHtml,
  parseKagiHtmlResults
} from "../../src/services/kagi/html.ts";

test("parseKagiHtmlResults extracts normalized URLs and cleans snippets", () => {
  const html = `
    <html>
      <head><title>Kagi Search</title></head>
      <body>
        <main class="results">
          <article class="search-result">
            <a
              class="__sri_title_link"
              href="/redirect?url=https%3A%2F%2Fexample.com%2Fpost"
            >
              Example Result
            </a>
            <div class="snippet">
              Example Result · example.com This is the matching snippet for the result.
            </div>
          </article>
          <article class="search-result">
            <a class="__sri_title_link" href="https://help.kagi.com/faq">Help Center</a>
            <div class="snippet">This internal help result must be ignored.</div>
          </article>
        </main>
      </body>
    </html>
  `;

  const results = parseKagiHtmlResults(html, "https://kagi.com");

  assert.deepEqual(results, [
    {
      title: "Example Result",
      url: "https://example.com/post",
      snippet: "This is the matching snippet for the result."
    }
  ]);
});

test("parseKagiHtmlResults falls back to generic main/article anchors when Kagi classes change", () => {
  const html = `
    <html>
      <body>
        <main>
          <section class="result-card">
            <a href="https://remix.run/blog/react-server-components">
              React Server Components and Remix
            </a>
            <p>
              A detailed writeup about how React Server Components fit into Remix
              applications and where the boundaries are today.
            </p>
          </section>
        </main>
      </body>
    </html>
  `;

  const results = parseKagiHtmlResults(html, "https://kagi.com");

  assert.deepEqual(results, [
    {
      title: "React Server Components and Remix",
      url: "https://remix.run/blog/react-server-components",
      snippet:
        "A detailed writeup about how React Server Components fit into Remix applications and where the boundaries are today."
    }
  ]);
});

test("inspectKagiHtml exposes normalized sample anchors for debugging", () => {
  const html = `
    <html>
      <head><title>Kagi Search</title></head>
      <body>
        <a href="/redirect?target=https%3A%2F%2Freact.dev%2Freference%2Frsc%2Fserver-components">
          Server Components
        </a>
      </body>
    </html>
  `;

  const inspection = inspectKagiHtml(html, "https://kagi.com");

  assert.equal(inspection.title, "Kagi Search");
  assert.deepEqual(inspection.sampleAnchors, [
    {
      href: "/redirect?target=https%3A%2F%2Freact.dev%2Freference%2Frsc%2Fserver-components",
      text: "Server Components",
      normalizedUrl: "https://react.dev/reference/rsc/server-components"
    }
  ]);
});
