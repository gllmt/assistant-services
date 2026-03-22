export function resolveKagiSessionToken(input: {
  sessionLink?: string;
  sessionToken?: string;
}) {
  if (input.sessionToken?.trim()) {
    return sanitizeKagiSessionToken(input.sessionToken);
  }

  if (!input.sessionLink?.trim()) {
    return undefined;
  }

  try {
    const url = new URL(input.sessionLink);
    const token = url.searchParams.get("token")?.trim();
    return sanitizeKagiSessionToken(token);
  } catch {
    return sanitizeKagiSessionToken(input.sessionLink);
  }
}

export function buildKagiSessionBootstrapUrl(
  webBaseUrl: string,
  input: {
    sessionLink?: string;
    sessionToken?: string;
  }
) {
  const token = resolveKagiSessionToken(input);
  if (!token) {
    return undefined;
  }

  const url = new URL(`${webBaseUrl.replace(/\/$/, "")}/search`);
  url.searchParams.set("token", token);
  return url.toString();
}

export function redactKagiToken(value: string) {
  try {
    const url = new URL(value);
    if (url.searchParams.has("token")) {
      url.searchParams.set("token", "***");
    }

    return url.toString();
  } catch {
    return value.replace(/token=[^&]+/i, "token=***");
  }
}

function sanitizeKagiSessionToken(raw: string | undefined) {
  const trimmed = raw?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return sanitizeKagiSessionToken(url.searchParams.get("token") ?? undefined);
    } catch {
      return undefined;
    }
  }

  return (
    trimmed
      .replace(/[?&](q|query)=%s.*$/i, "")
      .replace(/[?&](q|query)=%25s.*$/i, "")
      .replace(/%26(q|query)%3D%25s.*$/i, "")
      .trim() || undefined
  );
}
