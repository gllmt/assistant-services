import { UpstreamError } from "./errors.js";

type JsonValue = object;

export async function getJson<T extends JsonValue>(
  url: URL,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const detail = await safeReadText(response);
    throw new UpstreamError(
      `Upstream request failed (${response.status}): ${detail || response.statusText}`,
      502,
      {
        upstreamStatus: response.status,
        upstreamBody: detail || response.statusText
      }
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new UpstreamError("Upstream returned invalid JSON", 502, { cause: error });
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
}

export async function getText(
  url: URL,
  init: RequestInit = {}
): Promise<string> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const detail = await safeReadText(response);
    throw new UpstreamError(
      `Upstream request failed (${response.status}): ${detail || response.statusText}`,
      502,
      {
        upstreamStatus: response.status,
        upstreamBody: detail || response.statusText
      }
    );
  }

  return safeReadText(response);
}
