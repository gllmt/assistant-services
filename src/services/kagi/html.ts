import * as cheerio from "cheerio";

import type { KagiSearchResult, KagiSearchResultItem } from "./types.js";

export type KagiHtmlInspection = {
  title: string;
  sampleAnchors: Array<{
    href: string;
    text: string;
    normalizedUrl?: string;
  }>;
  parsedResults: KagiSearchResultItem[];
};

export function inspectKagiHtml(
  html: string,
  webBaseUrl: string,
  maxAnchors = 80
): KagiHtmlInspection {
  const $ = cheerio.load(html);

  const sampleAnchors = $("a[href]")
    .slice(0, maxAnchors)
    .map((_index, element) => {
      const anchor = $(element);
      const href = anchor.attr("href") ?? "";
      const text = cleanText(anchor.text());
      return {
        href,
        text,
        normalizedUrl: normalizeResultUrl(href, webBaseUrl)
      };
    })
    .get();

  return {
    title: $("title").first().text(),
    sampleAnchors,
    parsedResults: parseKagiHtmlResults(html, webBaseUrl)
  };
}

export function parseKagiHtmlResults(html: string, webBaseUrl: string) {
  const $ = cheerio.load(html);
  const results: KagiSearchResult["results"] = [];
  const seen = new Set<string>();
  const selectors = [
    ".results .__sri_title_link",
    ".results .sri-title a",
    ".search-result .__sri_title_link",
    "a.__sri_title_link",
    ".results a[href][rel='nofollow']",
    "main a[href]",
    "article a[href]",
    ".results a[href]",
    ".search-result a[href]",
    "[class*='result'] a[href]"
  ];

  for (const selector of selectors) {
    $(selector).each((_index, element) => {
      const anchor = $(element);
      const normalizedUrl = normalizeResultUrl(anchor.attr("href"), webBaseUrl);

      if (!normalizedUrl || seen.has(normalizedUrl)) {
        return;
      }

      const title = cleanText(anchor.text());
      if (title.length < 3 || shouldSkipResult(title, normalizedUrl)) {
        return;
      }

      const container = findResultContainer($, anchor, title);
      const snippet = extractSnippet($, container, anchor, title, normalizedUrl);

      seen.add(normalizedUrl);
      results.push({
        title,
        url: normalizedUrl,
        snippet
      });
    });

    if (results.length > 0) {
      break;
    }
  }

  return results;
}

function findResultContainer(
  $: cheerio.CheerioAPI,
  anchor: cheerio.Cheerio<any>,
  title: string
) {
  const candidates = anchor.parents("article, section, div, li").slice(0, 8).toArray();
  let bestCandidate: any;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const [index, candidate] of candidates.entries()) {
    const element = $(candidate);
    const text = cleanText(element.text());
    if (text.length <= title.length + 24) {
      continue;
    }

    const className = (element.attr("class") ?? "").toLowerCase();
    const anchorCount = element.find("a[href]").length;
    let score = Math.min(text.length, 400) - index * 10 - Math.max(anchorCount - 4, 0) * 25;

    if (/(^|_|-)(sri|result|search|main)(_|-|$)/.test(className)) {
      score += 120;
    }

    if (/(snippet|desc|summary|body|content|preview|text)/.test(className)) {
      score += 80;
    }

    if (text.length > 1200) {
      score -= 140;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate ? $(bestCandidate) : anchor.closest("article, section, div, li");
}

function extractSnippet(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<any>,
  anchor: cheerio.Cheerio<any>,
  title: string,
  resultUrl: string
) {
  const titleText = cleanText(title);
  const snippetSelectors = [
    ".snippet",
    ".description",
    "[class*='snippet']",
    "[class*='desc']",
    "[class*='summary']",
    "[class*='body']",
    "[class*='content']",
    "[class*='preview']",
    "[class*='text']",
    "p",
    "div",
    "span"
  ];

  const candidates = new Map<string, number>();

  for (const selector of snippetSelectors) {
    container.find(selector).each((_index, element) => {
      const candidate = $(element);

      if (candidate.is(anchor) || candidate.find(anchor).length > 0) {
        return;
      }

      const rawText = cleanText(candidate.text());
      const text = sanitizeSnippetText(rawText, titleText, resultUrl);
      if (!isGoodSnippet(text, titleText)) {
        return;
      }

      const className = (candidate.attr("class") ?? "").toLowerCase();
      const tagName = candidate.prop("tagName")?.toLowerCase() ?? "";
      let score = Math.min(text.length, 280);

      if (/(snippet|desc|summary|preview)/.test(className)) {
        score += 140;
      }

      if (/(body|content|text)/.test(className)) {
        score += 70;
      }

      if (tagName === "p") {
        score += 60;
      }

      if (candidate.find("a[href]").length > 0) {
        score -= 80;
      }

      const existingScore = candidates.get(text) ?? Number.NEGATIVE_INFINITY;
      if (score > existingScore) {
        candidates.set(text, score);
      }
    });
  }

  const bestCandidate = [...candidates.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([text]) => text)[0];

  if (bestCandidate) {
    return bestCandidate;
  }

  const fallbackText = sanitizeSnippetText(cleanText(container.text()), titleText, resultUrl);
  if (isGoodSnippet(fallbackText, titleText)) {
    return truncateSnippet(fallbackText, 320);
  }

  return "";
}

function normalizeResultUrl(rawHref: string | undefined, webBaseUrl: string) {
  if (!rawHref?.trim()) {
    return undefined;
  }

  try {
    const resolved = new URL(rawHref, webBaseUrl);
    const candidate =
      resolved.searchParams.get("url") ??
      resolved.searchParams.get("target") ??
      resolved.searchParams.get("u");

    if (candidate) {
      const decoded = tryDecodeUrl(candidate);
      if (decoded) {
        return decoded;
      }
    }

    if (!/^https?:$/.test(resolved.protocol)) {
      return undefined;
    }

    if (resolved.hostname === new URL(webBaseUrl).hostname) {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}

function tryDecodeUrl(value: string) {
  try {
    const decoded = decodeURIComponent(value);
    const url = new URL(decoded);
    if (!/^https?:$/.test(url.protocol)) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeSnippetText(value: string, title: string, resultUrl: string) {
  let text = cleanText(value);
  if (!text) {
    return "";
  }

  const hostname = getHostname(resultUrl);
  const strippedTitle = escapeRegExp(title);
  const strippedHostname = hostname ? escapeRegExp(hostname) : "";

  text = text.replace(new RegExp(`^${strippedTitle}(\\s*[·|:-]\\s*)?`, "i"), "");
  text = text.replace(new RegExp(`${strippedTitle}`, "ig"), "").trim();

  if (strippedHostname) {
    text = text.replace(new RegExp(`^${strippedHostname}(\\s*[›»/:-]\\s*)?`, "i"), "");
    text = text.replace(new RegExp(`\\b${strippedHostname}\\b`, "ig"), "").trim();
  }

  text = text.replace(/\s*[·•|]\s*/g, " ").replace(/\s{2,}/g, " ").trim();

  return truncateSnippet(text, 320);
}

function isGoodSnippet(text: string, title: string) {
  if (text.length < 30) {
    return false;
  }

  if (text.toLowerCase() === title.toLowerCase()) {
    return false;
  }

  return true;
}

function truncateSnippet(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function getHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldSkipResult(title: string, url: string) {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("help.kagi.com")) {
    return true;
  }

  if (lowerUrl.includes("/privacy/private-browser-sessions")) {
    return true;
  }

  return (
    lowerTitle === "click here!" ||
    lowerTitle.includes("sign in") ||
    lowerTitle.includes("create account") ||
    lowerTitle.includes("reset your password")
  );
}
