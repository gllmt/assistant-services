import { UpstreamError } from "./errors.js";

type JsonValue = object;
type HttpRequestInit = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_COUNT = 1;
const BASE_RETRY_DELAY_MS = 250;

export async function getJson<T extends JsonValue>(
  url: URL,
  init: HttpRequestInit = {}
): Promise<T> {
  const response = await fetchWithPolicy(url, init);

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
  init: HttpRequestInit = {}
): Promise<string> {
  const response = await fetchWithPolicy(url, init);

  return safeReadText(response);
}

async function fetchWithPolicy(
  url: URL,
  init: HttpRequestInit
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRY_COUNT,
    signal,
    ...requestInit
  } = init;
  const parentSignal = signal ?? undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const requestSignal = createRequestSignal(timeoutMs, parentSignal);

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: requestSignal.signal
      });

      if (!response.ok) {
        const detail = await safeReadText(response);

        if (attempt < retries && shouldRetryStatus(response.status)) {
          await delay(getRetryDelayMs(attempt));
          continue;
        }

        throw new UpstreamError(
          `Upstream request failed (${response.status}): ${detail || response.statusText}`,
          502,
          {
            upstreamStatus: response.status,
            upstreamBody: detail || response.statusText
          }
        );
      }

      return response;
    } catch (error) {
      if (attempt < retries && shouldRetryError(error, requestSignal, parentSignal)) {
        await delay(getRetryDelayMs(attempt));
        continue;
      }

      if (requestSignal.didTimeout()) {
        throw new UpstreamError(`Upstream request timed out after ${timeoutMs}ms`, 502, {
          cause: error
        });
      }

      throw error;
    } finally {
      requestSignal.cleanup();
    }
  }

  throw new UpstreamError("Upstream request failed after retries", 502);
}

function createRequestSignal(timeoutMs: number, parentSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutError = new Error(`timeout after ${timeoutMs}ms`);
  const timeoutId = setTimeout(() => controller.abort(timeoutError), timeoutMs);
  const onAbort = () => controller.abort(parentSignal?.reason);

  if (parentSignal) {
    if (parentSignal.aborted) {
      onAbort();
    } else {
      parentSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout() {
      return controller.signal.aborted && controller.signal.reason === timeoutError;
    },
    cleanup() {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener("abort", onAbort);
    }
  };
}

function shouldRetryStatus(status: number) {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function shouldRetryError(
  error: unknown,
  requestSignal: ReturnType<typeof createRequestSignal>,
  parentSignal?: AbortSignal
) {
  if (parentSignal?.aborted) {
    return false;
  }

  if (requestSignal.didTimeout()) {
    return true;
  }

  return error instanceof TypeError;
}

function getRetryDelayMs(attempt: number) {
  return BASE_RETRY_DELAY_MS * (attempt + 1);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
